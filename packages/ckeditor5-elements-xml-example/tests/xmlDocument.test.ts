import { Essentials, Paragraph, _getModelData, type ClassicEditor } from 'ckeditor5';
import { ElementSchema, ElementSelectable } from 'ckeditor5-elements';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import { XmlDocument } from '../src/index.js';

const PROLOG = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * The XML of a document with the content, as the data processor writes it.
 */
const doc = (attributes: string, ...lines: string[]): string =>
	PROLOG +
	(lines.length
		? `<doc${attributes}>\n${lines.map(line => `\t${line}`).join('\n')}\n</doc>`
		: `<doc${attributes}/>`) +
	'\n';

describe('XmlDocument', () => {
	let editor: ClassicEditor;

	const model = (): string => _getModelData(editor.model, { withoutSelection: true });

	beforeEach(async () => {
		editor = await createEditor({
			plugins: [Essentials, Paragraph, ElementSchema, ElementSelectable, XmlDocument],
			elementSchema: {
				part: { type: 'container' },
				code: { type: 'block', verbatim: true },
				link: { type: 'block', isInline: true, allowAttributes: ['href'] }
			},
			elementSchemaConverters: 'names',
			xmlDocument: { root: 'doc', prolog: PROLOG, paragraph: 'p', className: 'doc' }
		});
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('loads and saves the document, with the elements by their names and the paragraph by its own', () => {
		const data = doc(' id="a"', '<part>', '\t<p>a <link href="x">b</link></p>', '</part>');

		editor.setData(data);

		expect(model()).toBe('<part><paragraph>a <link href="x">b</link></paragraph></part>');
		expect(editor.getData()).toBe(data);
		expect(editor.ui.getEditableElement()!.classList.contains('doc')).toBe(true);
	});

	it('keeps the attributes of the root element of the data loaded last', () => {
		editor.setData(doc(' id="a" xml:lang="en"', '<p>a</p>'));

		expect(editor.getData()).toBe(doc(' id="a" xml:lang="en"', '<p>a</p>'));

		editor.setData(doc('', '<p>b</p>'));

		expect(editor.getData()).toBe(doc('', '<p>b</p>'));
	});

	it('escapes the text and the attributes, and writes empty elements as such', () => {
		const data = doc(
			'',
			'<p>a &amp; b &lt; c &gt; d "e"</p>',
			'<p/>',
			'<p><link href="?a=1&amp;b=&quot;2&quot;">x</link></p>'
		);

		editor.setData(data);

		expect(editor.getData()).toBe(data);
		expect(model()).toContain('<paragraph>a & b < c > d "e"</paragraph><paragraph></paragraph>');
	});

	it('keeps the whitespace of the verbatim blocks, and writes a soft break of a paragraph as a new line', () => {
		const data = doc('', '<code>if (a) {\n\tb();\n}</code>');

		editor.setData(data);

		expect(editor.getData()).toBe(data);

		editor.setData(doc('', '<p>a</p>'));
		editor.model.change(writer => {
			const paragraph = editor.model.document.getRoot()!.getChild(0)!;

			writer.insertElement('softBreak', writer.createPositionAt(paragraph, 'end'));
			writer.insertText('b', writer.createPositionAt(paragraph, 'end'));
		});

		expect(editor.getData()).toBe(doc('', '<p>a\nb</p>'));
	});

	it('is an empty root element for an empty editor, with `trim: none`', () => {
		editor.setData(doc(' id="a"'));

		expect(model()).toBe('<paragraph></paragraph>');
		expect(editor.getData()).toBe('');
		expect(editor.getData({ trim: 'none' })).toBe(doc(' id="a"', '<p/>'));
	});

	it('rejects data that is not well-formed XML, or of another root element', () => {
		expect(() => {
			editor.setData('<doc><p>a</doc>');
		}).toThrow('The data is not well-formed XML');
		expect(() => {
			editor.setData('<book><p>a</p></book>');
		}).toThrow('The data must be a "doc", not a "book".');
	});

	it('needs its option', async () => {
		await expect(createEditor({ plugins: [Paragraph, XmlDocument] })).rejects.toThrow(
			'XmlDocument: the xmlDocument option is required'
		);
	});

	it('needs the converters of the schema with the names of the elements', async () => {
		await expect(
			createEditor({
				plugins: [Paragraph, XmlDocument],
				elementSchema: { part: { type: 'container' } },
				elementSchemaConverters: true,
				xmlDocument: { root: 'doc', prolog: PROLOG, paragraph: 'p' }
			})
		).rejects.toThrow("XmlDocument: set elementSchemaConverters to 'names'");
	});
});
