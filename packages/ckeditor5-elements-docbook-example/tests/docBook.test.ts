import { _getModelData, _setModelData, type ClassicEditor } from 'ckeditor5';
import { userEvent } from 'vitest/browser';
import { validateElementSchema, type ElementListCommand } from 'ckeditor5-elements';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import { DOCBOOK_PROLOG, docBookConfig, docBookData } from '../src/index.js';
import schema from '../src/schema.json';

/**
 * The XML of an article with the content, as the data processor writes it.
 */
const article = (...lines: string[]): string =>
	`${DOCBOOK_PROLOG}<article>${lines.length ? `\n${lines.map(line => `\t${line}`).join('\n')}\n` : ''}</article>\n`;

describe('the DocBook example', () => {
	let editor: ClassicEditor;

	const model = (): string => _getModelData(editor.model, { withoutSelection: true });

	beforeEach(async () => {
		editor = await createEditor({ ...docBookConfig, root: { initialData: docBookData } });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a valid element schema, with the paragraph of CKEditor as `para`', () => {
		expect(validateElementSchema(schema, { external: { paragraph: { type: 'block', isInline: false } } })).toEqual(
			[]
		);
	});

	describe('the data', () => {
		it('is the article, saved as it is loaded', () => {
			expect(editor.getData()).toBe(docBookData);
		});

		it('is the elements of the model, by their DocBook names', () => {
			expect(model()).toContain(
				'<section><title>Elements, all the way down</title><paragraph>A <literal>section</literal> holds'
			);
			expect(model()).toContain('<itemizedlist><listitem><paragraph>Put the cursor here');
			expect(model()).toContain('<ulink url="https://docbook.org/">DocBook</ulink>');
		});

		it('writes the block-level elements on lines of their own, the inline ones in the text', () => {
			_setModelData(
				editor.model,
				'<section><title>T</title><itemizedlist><listitem><paragraph>a <emphasis>b</emphasis></paragraph>' +
					'</listitem></itemizedlist></section>'
			);

			expect(editor.getData()).toBe(
				article(
					'<section>',
					'\t<title>T</title>',
					'\t<itemizedlist>',
					'\t\t<listitem>',
					'\t\t\t<para>a <emphasis>b</emphasis></para>',
					'\t\t</listitem>',
					'\t</itemizedlist>',
					'</section>'
				)
			);
		});

		it('escapes the text and the attributes, and writes empty elements as such', () => {
			const data = article(
				'<para>a &amp; b &lt; c &gt; d "e"</para>',
				'<para/>',
				'<para><ulink url="https://example.com/?a=1&amp;b=&quot;2&quot;">x</ulink></para>'
			);

			editor.setData(data);

			expect(editor.getData()).toBe(data);
			expect(model()).toContain('<paragraph>a & b < c > d "e"</paragraph><paragraph></paragraph>');
		});

		it('keeps the whitespace of a program listing, and writes a soft break of a paragraph as a new line', () => {
			const data = article('<programlisting>if (a) {\n\tb();\n}</programlisting>');

			editor.setData(data);

			expect(editor.getData()).toBe(data);

			_setModelData(editor.model, '<paragraph>a<softBreak></softBreak>b</paragraph>');

			expect(editor.getData()).toBe(article('<para>a\nb</para>'));
		});

		it('gets a new line in a program listing for Enter, which is verbatim', async () => {
			_setModelData(editor.model, '<programlisting>a[]</programlisting>');
			editor.editing.view.focus();
			await userEvent.keyboard('{Enter}b');

			expect(editor.getData()).toBe(article('<programlisting>a\nb</programlisting>'));
		});

		it('is empty for an empty editor, as CKEditor returns it, or an article with an empty paragraph', () => {
			editor.setData('');

			expect(editor.getData()).toBe('');
			expect(editor.getData({ trim: 'none' })).toBe(article('<para/>'));

			editor.setData(`${DOCBOOK_PROLOG}<article/>`);

			expect(model()).toBe('<paragraph></paragraph>');
		});

		it('rejects data that is not well-formed XML, or not an article', () => {
			expect(() => {
				editor.setData('<article><para>a</article>');
			}).toThrow('The data is not well-formed XML');
			expect(() => {
				editor.setData('<book><para>a</para></book>');
			}).toThrow('The data must be a "article", not a "book".');
		});
	});

	describe('the lists', () => {
		it('make a list of the blocks, each in an item, and unwrap it', () => {
			_setModelData(editor.model, '<paragraph>[a</paragraph><paragraph>b]</paragraph>');

			editor.execute('itemizedlist');

			expect(model()).toBe(
				'<itemizedlist><listitem><paragraph>a</paragraph></listitem>' +
					'<listitem><paragraph>b</paragraph></listitem></itemizedlist>'
			);
			expect((editor.commands.get('itemizedlist') as unknown as ElementListCommand).isOn).toBe(true);
			expect((editor.commands.get('orderedlist') as unknown as ElementListCommand).isOn).toBe(false);

			editor.execute('itemizedlist');

			expect(model()).toBe('<paragraph>a</paragraph><paragraph>b</paragraph>');
		});

		it('turn a list of the other kind into theirs', () => {
			_setModelData(editor.model, '<itemizedlist><listitem><paragraph>a[]</paragraph></listitem></itemizedlist>');

			editor.execute('orderedlist');

			expect(model()).toBe('<orderedlist><listitem><paragraph>a</paragraph></listitem></orderedlist>');
		});

		it('hold only list items, and get the next item for Enter', async () => {
			expect(editor.model.schema.checkChild(['$root', 'itemizedlist'], 'paragraph')).toBe(false);

			_setModelData(
				editor.model,
				'<itemizedlist><listitem><paragraph>ab[]</paragraph></listitem></itemizedlist>'
			);
			editor.editing.view.focus();
			await userEvent.keyboard('{Enter}c');

			expect(model()).toBe(
				'<itemizedlist><listitem><paragraph>ab</paragraph></listitem>' +
					'<listitem><paragraph>c</paragraph></listitem></itemizedlist>'
			);
		});

		it('are disabled for what a list cannot hold, e.g. a title', () => {
			_setModelData(editor.model, '<title>a[]</title>');

			expect(editor.commands.get('itemizedlist')!.isEnabled).toBe(false);
		});
	});

	describe('the features', () => {
		it('show the path of the DocBook elements in the breadcrumbs', () => {
			_setModelData(
				editor.model,
				'<section><itemizedlist><listitem><paragraph>a[]</paragraph></listitem></itemizedlist></section>'
			);

			expect(editor.plugins.get('Breadcrumbs').items.map(item => item.label)).toEqual([
				'section',
				'itemizedlist',
				'listitem',
				'para'
			]);
		});

		it('have the buttons of the toolbar, and mark the editable for the styles', () => {
			for (const name of [
				'title',
				'section',
				'itemizedlist',
				'orderedlist',
				'emphasis',
				'literal',
				'sourceEditing'
			]) {
				expect([name, editor.ui.componentFactory.has(name)]).toEqual([name, true]);
			}

			expect(editor.ui.getEditableElement()!.classList.contains('docbook')).toBe(true);
		});
	});
});
