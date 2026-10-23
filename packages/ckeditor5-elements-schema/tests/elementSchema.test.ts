import {
	Bold,
	Paragraph,
	Plugin,
	type ModelElement,
	_getModelData,
	_getViewData,
	_setModelData,
	type ClassicEditor,
	type ModelSchema
} from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import ElementSchema from '../src/elementSchema.js';
import { ElementSelectable } from 'ckeditor5-elements-selectable';
import ElementSchemaError from '../src/elementSchemaError.js';
import type { ElementSchemaInput } from '../src/types.js';

/**
 * The schema of the tests, one of each kind.
 */
const SCHEMA: ElementSchemaInput = {
	note: { type: 'container', allowAttributes: ['type'] },
	title: { type: 'block', allowIn: ['note'] },
	quote: { type: 'block' },
	divider: { type: 'empty' },
	badge: { type: 'empty', isInline: true, allowAttributes: ['color'] },
	term: { type: 'block', isInline: true, allowAttributes: ['id'] },
	callout: { type: 'container', allowChildren: ['title'] },
	row: { type: 'block', allowChildren: ['chip'] },
	chip: { type: 'container', isInline: true }
};

/**
 * Converts the elements of the schema, so the editor can show them.
 */
function converters(input: ElementSchemaInput): typeof Plugin {
	return class extends Plugin {
		public init(): void {
			for (const [name, element] of Object.entries(input)) {
				this.editor.conversion.elementToElement({
					model: name,
					view: { name: element.isInline ? 'span' : 'div', classes: name }
				});
			}
		}
	};
}

describe('ElementSchema', () => {
	let editor: ClassicEditor | undefined;

	async function setUp(
		input: ElementSchemaInput = SCHEMA,
		plugins: (typeof Plugin)[] = [Paragraph, Bold, ElementSelectable]
	): Promise<ModelSchema> {
		editor = await createEditor({
			plugins: [...plugins, converters(input), ElementSchema],
			elementSchema: input
		});

		return editor.model.schema;
	}

	afterEach(async () => {
		await editor?.destroy();
		editor = undefined;
	});

	it('has a plugin name, and registers nothing without the option', async () => {
		editor = await createEditor({ plugins: [Paragraph, ElementSchema] });

		expect(ElementSchema.pluginName).toBe('ElementSchema');
		expect(editor.model.schema.isRegistered('note')).toBe(false);
	});

	it('registers the elements', async () => {
		const schema = await setUp();

		for (const name of Object.keys(SCHEMA)) {
			expect([name, schema.isRegistered(name)]).toEqual([name, true]);
		}
	});

	describe('the types', () => {
		it('`empty` is an object: selectable as a whole, and has no content', async () => {
			const schema = await setUp();

			expect(schema.isObject('divider')).toBe(true);
			expect(schema.isBlock('divider')).toBe(true);
			expect(schema.isInline('divider')).toBe(false);
			expect(schema.isLimit('divider')).toBe(true);

			for (const child of ['$text', 'quote', 'note', 'badge', 'divider']) {
				expect([child, schema.checkChild('divider', child)]).toEqual([child, false]);
			}
		});

		it('`empty` and inline is an inline object, with the attributes of text', async () => {
			const schema = await setUp();

			expect(schema.isObject('badge')).toBe(true);
			expect(schema.isInline('badge')).toBe(true);
			expect(schema.isBlock('badge')).toBe(false);
			expect(schema.checkAttribute('badge', 'color')).toBe(true);
			// As inline objects of CKEditor, it gets the attributes text can have, e.g. bold.
			expect(schema.checkAttribute('badge', 'bold')).toBe(true);
			expect(schema.checkAttribute('divider', 'bold')).toBe(false);
		});

		it('`block` and inline is an inline element with text: not a block, not an object, with its own attributes', async () => {
			const schema = await setUp();

			expect(schema.isInline('term')).toBe(true);
			expect(schema.isBlock('term')).toBe(false);
			expect(schema.isObject('term')).toBe(false);
			expect(schema.isLimit('term')).toBe(false);

			// Text, inline objects and other inline elements, also itself, but not blocks, containers and block objects.
			for (const child of ['$text', 'badge', 'term']) {
				expect([child, schema.checkChild('term', child)]).toEqual([child, true]);
			}

			for (const child of ['quote', 'note', 'divider', 'title']) {
				expect([child, schema.checkChild('term', child)]).toEqual([child, false]);
			}

			// Allowed where text is: in blocks, and inside itself, not in the root or in containers.
			expect(schema.checkChild('quote', 'term')).toBe(true);
			expect(schema.checkChild('paragraph', 'term')).toBe(true);
			expect(schema.checkChild('$root', 'term')).toBe(false);
			expect(schema.checkChild('note', 'term')).toBe(false);

			// Text in it is text in a block: it can have the attributes text can have, and the element has its own.
			expect(schema.checkChild(['paragraph', 'term'], '$text')).toBe(true);
			expect(schema.checkAttribute('term', 'id')).toBe(true);
			expect(schema.checkAttribute('term', 'bold')).toBe(true);
			expect(schema.checkAttribute(['paragraph', 'term', '$text'], 'bold')).toBe(true);
			expect(schema.checkAttribute('quote', 'id')).toBe(false);
		});

		it('`container` and inline is a box laid out in a line: not typable, holds blocks, allowed where text is', async () => {
			const schema = await setUp();

			expect(schema.isInline('chip')).toBe(true);
			expect(schema.isBlock('chip')).toBe(false);
			expect(schema.isObject('chip')).toBe(false);

			// It holds what a container holds: blocks, containers and block objects, but no text.
			for (const child of ['quote', 'note', 'divider']) {
				expect([child, schema.checkChild('chip', child)]).toEqual([child, true]);
			}

			// But no text, and no inline elements, which are for blocks.
			expect(schema.checkChild('chip', '$text')).toBe(false);
			expect(schema.checkChild('chip', 'badge')).toBe(false);

			// It is allowed where text is, as every inline element: in blocks, several of them. Not in the root or in
			// containers, which hold no inline elements.
			expect(schema.checkChild('quote', 'chip')).toBe(true);
			expect(schema.checkChild('row', 'chip')).toBe(true);
			expect(schema.checkChild('$root', 'chip')).toBe(false);
			expect(schema.checkChild('note', 'chip')).toBe(false);
			expect(schema.checkChild('chip', 'chip')).toBe(false);
		});

		it('inline elements of every type are not allowed in containers or in the root', async () => {
			const schema = await setUp();

			for (const name of ['badge', 'term', 'chip']) {
				expect([name, schema.checkChild('note', name), schema.checkChild('$root', name)]).toEqual([
					name,
					false,
					false
				]);
			}
		});

		it('`block` holds text and inline elements, and nothing else', async () => {
			const schema = await setUp();

			expect(schema.isBlock('quote')).toBe(true);
			expect(schema.isObject('quote')).toBe(false);
			expect(schema.checkChild('quote', '$text')).toBe(true);
			expect(schema.checkChild('quote', 'badge')).toBe(true);
			expect(schema.checkChild('quote', 'chip')).toBe(true);

			for (const child of ['quote', 'note', 'divider', 'title']) {
				expect([child, schema.checkChild('quote', child)]).toEqual([child, false]);
			}
		});

		it('`container` holds blocks, containers and block objects, and no text and no inline elements', async () => {
			const schema = await setUp();

			expect(schema.isBlock('note')).toBe(false);

			for (const child of ['quote', 'note', 'divider', 'title', 'paragraph', 'callout']) {
				expect([child, schema.checkChild('note', child)]).toEqual([child, true]);
			}

			for (const child of ['$text', 'badge']) {
				expect([child, schema.checkChild('note', child)]).toEqual([child, false]);
			}
		});

		it('the elements are allowed in the root and in containers, by default; inline ones where text is', async () => {
			const schema = await setUp();

			for (const name of ['note', 'quote', 'divider', 'callout']) {
				expect([name, schema.checkChild('$root', name), schema.checkChild('note', name)]).toEqual([
					name,
					true,
					true
				]);
			}

			expect(schema.checkChild('$root', 'badge')).toBe(false);
			expect(schema.checkChild('paragraph', 'badge')).toBe(true);
			expect(schema.checkChild('paragraph', 'chip')).toBe(true);
			expect(schema.checkChild('quote', 'badge')).toBe(true);
		});
	});

	describe('allowIn', () => {
		it('replaces the default places: the element is allowed only in the listed parents', async () => {
			const schema = await setUp();

			expect(schema.checkChild('note', 'title')).toBe(true);
			expect(schema.checkChild('$root', 'title')).toBe(false);
			expect(schema.checkChild('quote', 'title')).toBe(false);
		});

		it('can list the root', async () => {
			const schema = await setUp({ part: { type: 'block', allowIn: ['$root'] } });

			expect(schema.checkChild('$root', 'part')).toBe(true);
			expect(schema.checkChild('paragraph', 'part')).toBe(false);
		});
	});

	describe('allowChildren', () => {
		it('adds to what the type holds, as in CKEditor: the child is allowed in the parent too', async () => {
			const schema = await setUp();

			expect(schema.checkChild('callout', 'title')).toBe(true);
			// Title was allowed in notes, and still is.
			expect(schema.checkChild('note', 'title')).toBe(true);
			expect(schema.checkChild('$root', 'title')).toBe(false);
		});

		it('works with elements of other plugins, which are extended', async () => {
			class Outside extends Plugin {
				public init(): void {
					this.editor.model.schema.register('outside', { allowIn: '$root', isBlock: true });
				}
			}

			const schema = await setUp({ box: { type: 'container', allowChildren: ['outside'] } }, [
				Paragraph,
				Outside
			]);

			expect(schema.checkChild('box', 'outside')).toBe(true);
			expect(schema.checkChild('$root', 'outside')).toBe(true);
		});

		it('allows `$text` in a block', async () => {
			const schema = await setUp({ line: { type: 'block', allowChildren: ['$text'] } });

			expect(schema.checkChild('line', '$text')).toBe(true);
		});
	});

	describe('allowAttributes', () => {
		it('allows the attributes, on the element only', async () => {
			const schema = await setUp();

			expect(schema.checkAttribute('note', 'type')).toBe(true);
			expect(schema.checkAttribute('note', 'color')).toBe(false);
			expect(schema.checkAttribute('quote', 'type')).toBe(false);
			expect(schema.checkAttribute('$root', 'type')).toBe(false);
		});
	});

	describe('in the editor', () => {
		it('keeps content that follows the schema', async () => {
			await setUp();

			const data =
				'<note type="a"><title>T</title><quote>q<badge color="red"></badge></quote><divider></divider></note><callout><title>t</title></callout>';

			_setModelData(editor!.model, data);

			expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(data);
		});

		it('keeps inline text elements in text, with text attributes inside them', async () => {
			await setUp();

			const data =
				'<quote>a<term id="x">b<$text bold="true">c</$text><badge color="red"></badge></term>d</quote>';

			_setModelData(editor!.model, data);

			expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(data);
		});

		it('keeps inline containers next to each other in a block, with blocks inside them', async () => {
			await setUp();

			const data =
				'<row><chip><quote>a</quote></chip><chip><quote>b</quote><divider></divider></chip></row><note><quote>q</quote></note>';

			_setModelData(editor!.model, data);

			expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(data);
		});

		it('does not accept content that does not: CKEditor refuses text in a container', async () => {
			await setUp();

			expect(() => {
				_setModelData(editor!.model, '<note>text</note>');
			}).toThrow('Text was not allowed in given position');
		});

		it('moves content to where it is allowed when it is inserted: a title is allowed only in notes', async () => {
			await setUp();
			_setModelData(editor!.model, '<quote>q[]</quote>');

			editor!.model.change(writer => {
				editor!.model.insertContent(writer.createElement('title'), editor!.model.document.selection);
			});

			expect(_getModelData(editor!.model, { withoutSelection: true })).not.toContain('<title>');
		});

		it('works with the data: loading and saving', async () => {
			await setUp();

			editor!.setData(
				'<div class="note"><div class="quote">q<span class="badge"></span></div><div class="divider"></div></div>'
			);

			expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(
				'<note><quote>q<badge></badge></quote><divider></divider></note>'
			);

			// Empty elements are saved with a space, as CKEditor does; saving and loading again changes nothing.
			const data = editor!.getData();

			editor!.setData(data);

			expect(editor!.getData()).toBe(data);
		});
	});

	describe('elementSchemaConverters', () => {
		const CONVERTED: ElementSchemaInput = {
			note: { type: 'container', allowAttributes: ['type', 'dataId'] },
			title: { type: 'block', allowIn: ['note'], editingTag: 'header' },
			badge: { type: 'empty', isInline: true, allowAttributes: ['color'] },
			term: { type: 'block', isInline: true, editingTag: 'mark' },
			divider: { type: 'empty' },
			chip: { type: 'container', isInline: true }
		};

		const convert = async (): Promise<ClassicEditor> => {
			editor = await createEditor({
				plugins: [Paragraph, ElementSchema, ElementSelectable],
				elementSchema: CONVERTED,
				elementSchemaConverters: true
			});

			return editor;
		};
		const view = (): string => _getViewData(editor!.editing.view, { withoutSelection: true });

		it('downcasts to the data one to one: a div, a span for inline elements with text or empty, the name as the class', async () => {
			await convert();

			_setModelData(
				editor!.model,
				'<note type="a" dataId="x"><title>T</title><divider></divider></note>' +
					'<paragraph>a<badge color="red"></badge><term>b</term></paragraph>'
			);

			expect(editor!.getData()).toBe(
				'<div class="note" data-type="a" data-dataid="x"><div class="title">T</div><div class="divider"></div></div>' +
					'<p>a<span class="badge" data-color="red"></span><span class="term">b</span></p>'
			);
		});

		it('makes an inline container a div: it holds blocks', async () => {
			await convert();

			_setModelData(editor!.model, '<paragraph>a<chip><paragraph>b</paragraph></chip></paragraph>');

			expect(editor!.getData()).toContain('<div class="chip"><p>b</p></div>');
		});

		it('upcasts the data it downcasts, with the attributes of the model in their case', async () => {
			await convert();

			editor!.setData(
				'<div class="note" data-type="a" data-dataid="x"><div class="title">T</div></div>' +
					'<p>a<span class="badge" data-color="red"></span></p>'
			);

			expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(
				'<note dataId="x" type="a"><title>T</title></note><paragraph>a<badge color="red"></badge></paragraph>'
			);
			const saved = editor!.getData();

			editor!.setData(saved);

			expect(editor!.getData()).toBe(saved);
		});

		it('has the same editing view, with the editingTag, and no widgets', async () => {
			await convert();

			_setModelData(
				editor!.model,
				'<note><title>T</title><divider></divider></note><paragraph>a<term>b</term></paragraph>'
			);

			const html = editor!.ui.view.editable.element!.innerHTML;

			expect(html).toContain('<header class="title">T</header>');
			expect(html).toContain('<mark class="term">b</mark>');
			expect(html).toContain('<div class="divider"');
			expect(html).not.toContain('ck-widget');
			expect(html).toContain('<div class="note">');
			expect(view()).toContain('<header class="title">T</header>');
		});

		it('warns when nothing selects the elements: the converters make them, and without ElementSelectable they cannot be selected', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			editor = await createEditor({
				plugins: [Paragraph, ElementSchema],
				elementSchema: CONVERTED,
				elementSchemaConverters: true
			});

			expect(warn).toHaveBeenCalledOnce();
			expect(warn).toHaveBeenCalledWith(
				'ElementSchema: load ElementSelectable to select the elements of the schema as a whole: note, badge, divider, chip.'
			);

			warn.mockClear();
			await editor.destroy();
			editor = await createEditor({
				plugins: [Paragraph, ElementSchema, ElementSelectable],
				elementSchema: CONVERTED,
				elementSchemaConverters: true
			});

			expect(warn).not.toHaveBeenCalled();
			warn.mockRestore();
		});

		it('does not warn without the converters: the elements are converted by something else', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			editor = await createEditor({ plugins: [Paragraph, ElementSchema], elementSchema: CONVERTED });

			expect(warn).not.toHaveBeenCalled();
			warn.mockRestore();
		});

		it('is off by default: the elements are in the schema, and not converted', async () => {
			editor = await createEditor({ plugins: [Paragraph, ElementSchema], elementSchema: CONVERTED });
			editor.setData('<div class="note"><div class="title">T</div></div>');

			expect(_getModelData(editor.model, { withoutSelection: true })).not.toContain('<note>');
		});
	});

	describe('selecting elements', () => {
		it('makes `empty` and `container` elements selectable, for a click and for the arrow keys, and not `block` ones', async () => {
			const schema = await setUp();
			const selectable = editor!.plugins.get(ElementSelectable);

			_setModelData(
				editor!.model,
				'<note></note><divider></divider><quote>q<badge></badge><chip></chip><term></term></quote>'
			);

			const root = editor!.model.document.getRoot()!;
			const quote = root.getChild(2) as ModelElement;
			const elements = [...root.getChildren(), ...quote.getChildren()].filter(node => node.is('element'));

			expect(elements.map(element => [element.name, selectable.isSelectable(element)])).toEqual([
				['note', true],
				['divider', true],
				['quote', false],
				['badge', true],
				['chip', true],
				['term', false]
			]);
			expect(['note', 'divider', 'badge', 'chip'].every(name => schema.isSelectable(name))).toBe(true);
			expect(schema.isSelectable('quote')).toBe(false);
		});

		it('selects an element when it is clicked: a container on its box, and not in its text', async () => {
			await setUp();
			_setModelData(editor!.model, '<paragraph>a[]</paragraph><callout><quote>q</quote></callout>');

			const box = editor!.ui.getEditableElement()!.querySelector('.callout')!;

			// In the text of a block of the container.
			box.querySelector('.quote')!.dispatchEvent(
				new MouseEvent('mousedown', { bubbles: true, cancelable: true })
			);

			expect(_getModelData(editor!.model)).toBe('<paragraph>a[]</paragraph><callout><quote>q</quote></callout>');

			box.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

			expect(_getModelData(editor!.model)).toBe('<paragraph>a</paragraph>[<callout><quote>q</quote></callout>]');
		});

		it('needs no `Widget` plugin', async () => {
			await setUp();

			expect(editor!.plugins.has('Widget')).toBe(false);
		});

		it('does not need `ElementSelectable`: without it, the elements are not made selectable, and nothing fails', async () => {
			const schema = await setUp(SCHEMA, [Paragraph, Bold]);

			expect(schema.isRegistered('note')).toBe(true);
			expect(schema.isSelectable('note')).toBe(false);
		});
	});

	describe('an invalid schema', () => {
		it('stops the editor from being created, with an error that lists every problem', async () => {
			const error = await createEditor({
				plugins: [Paragraph, ElementSchema],
				elementSchema: {
					a: { type: 'container', allowChildren: ['$text'] },
					b: { type: 'empty', isInline: 'yes' as unknown as boolean },
					c: { type: 'empty', allowChildren: ['a'] }
				}
			}).then(
				() => null,
				(rejection: unknown) => rejection
			);

			expect(error).toBeInstanceOf(ElementSchemaError);
			expect((error as ElementSchemaError).issues.map(({ path }) => path)).toEqual([
				'a.allowChildren[0]',
				'b.isInline',
				'c.allowChildren'
			]);
			expect((error as ElementSchemaError).message).toMatch(
				/^The element schema is not valid \(3 problems\):\n- a\.allowChildren\[0\]: /
			);
		});

		it('rejects an element that another plugin declared', async () => {
			await expect(
				createEditor({
					plugins: [Paragraph, ElementSchema],
					elementSchema: { paragraph: { type: 'block' } }
				})
			).rejects.toThrow('"paragraph" already exists in the editor');
		});

		it('rejects a reference to an element of a plugin that is not loaded, with the way out', async () => {
			await expect(
				createEditor({
					plugins: [ElementSchema],
					elementSchema: { note: { type: 'container', allowChildren: ['paragraph'] } }
				})
			).rejects.toThrow('unknown element "paragraph"');
		});

		it('uses the kind of the elements of other plugins: a block cannot contain a paragraph', async () => {
			await expect(
				createEditor({
					plugins: [Paragraph, ElementSchema],
					elementSchema: { title: { type: 'block', allowChildren: ['paragraph'] } }
				})
			).rejects.toThrow(
				'"paragraph" cannot be a child of "title": a block can contain only text and inline elements'
			);
		});

		it('says "1 problem" for one', () => {
			expect(new ElementSchemaError([{ path: 'note', message: 'bad.' }]).message).toBe(
				'The element schema is not valid (1 problem):\n- note: bad.'
			);
		});
	});
});
