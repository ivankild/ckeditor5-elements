import { _getModelData, _setModelData, type ClassicEditor, type ModelElement, type ModelPosition } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import { elementMenu, exampleConfig, exampleData } from '../src/index.js';

describe('the full example', () => {
	let editor: ClassicEditor;

	beforeEach(async () => {
		editor = await createEditor({ ...exampleConfig, root: { initialData: exampleData } });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has all the features', () => {
		for (const name of [
			'Note',
			'ElementContextMenu',
			'ElementClipboard',
			'ElementActions',
			'ElementAttributes',
			'ElementSchema',
			'ElementSelectable',
			'ElementToolbar',
			'QuickInsert',
			'Breadcrumbs'
		] as const) {
			expect([name, editor.plugins.has(name)]).toEqual([name, true]);
		}
	});

	it('keeps its data: saving and loading it again changes nothing', () => {
		const data = editor.getData();

		editor.setData(data);

		expect(editor.getData()).toBe(data);
		expect(data).toContain('<aside class="note warning">');
		expect(data).toContain('<figure class="media"><oembed url="https://example.com/video/1">');
		expect(data).toContain('<div class="tip" data-tone="success"><div class="tipTitle">A tip</div>');
		expect(data).toContain('<span class="status" data-state="new"></span>');
	});

	describe('the element schema', () => {
		it('declares the elements of schema.json, which hold what their types hold', () => {
			const schema = editor.model.schema;

			expect(schema.checkChild('tip', 'tipTitle')).toBe(true);
			expect(schema.checkChild('$root', 'tipTitle')).toBe(false);
			expect(schema.checkChild('steps', 'step')).toBe(true);
			expect(schema.checkChild('step', 'paragraph')).toBe(true);
			expect(schema.checkChild('paragraph', 'status')).toBe(true);
			expect(schema.checkChild('$root', 'status')).toBe(false);
		});

		it('shows the title of a tip as a `header` in the editor, and a `div` in the data', () => {
			expect(editor.ui.getEditableElement()!.querySelector('header.tipTitle')?.textContent).toBe('A tip');
			expect(editor.getData()).toContain('<div class="tipTitle">A tip</div>');
		});

		it('offers a tip title in quick insert only in a tip', () => {
			const root = editor.model.document.getRoot()!;
			const tip = [...root.getChildren()].find(node => node.is('element', 'tip')) as ModelElement;
			const labels = (position: ModelPosition): string[] =>
				editor.plugins
					.get('QuickInsert')
					.getItems(position)
					.map(item => item.label);

			expect(labels(editor.model.createPositionAt(tip, 'end'))).toContain('Tip title');
			expect(labels(editor.model.createPositionAt(root, 0))).not.toContain('Tip title');
			expect(labels(editor.model.createPositionAt(root, 0))).toContain('Tip');
		});
	});

	describe('selectable elements', () => {
		const mouseDown = (element: Element): void => {
			element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		};
		const selected = (): string | undefined => editor.model.document.selection.getSelectedElement()?.name;

		it('selects the containers and empty elements of the schema, and the notes, by a click on their frame', () => {
			const editable = editor.ui.getEditableElement()!;

			for (const [selector, name] of [
				['div.tip', 'tip'],
				['div.step', 'step'],
				['span.status', 'status'],
				['aside.note', 'note']
			]) {
				mouseDown(editable.querySelector(selector)!);
				expect([selector, selected()]).toEqual([selector, name]);
			}
		});

		it('does not select a note for a click in its text', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph><note><paragraph>b</paragraph></note>');
			mouseDown(editor.ui.getEditableElement()!.querySelector('aside.note p')!);

			expect(selected()).toBeUndefined();
		});
	});

	describe('Note', () => {
		it('`note` wraps blocks with a note, and unwraps any note', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');

			editor.execute('note');
			expect(_getModelData(editor.model)).toBe('<note><paragraph>a[]</paragraph></note>');

			_setModelData(editor.model, '<note type="warning"><paragraph>a[]</paragraph></note>');
			expect(editor.commands.get('note')?.isOn).toBe(true);

			editor.execute('note');
			expect(_getModelData(editor.model)).toBe('<paragraph>a[]</paragraph>');
		});

		it('`warning` wraps blocks with a warning, which is a note of the `warning` type', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');

			editor.execute('warning');

			expect(_getModelData(editor.model)).toBe('<note type="warning"><paragraph>a[]</paragraph></note>');
			expect(editor.getData()).toBe('<aside class="note warning"><p>a</p></aside>');
		});

		it('`warning` is off in a note of another type', () => {
			_setModelData(editor.model, '<note><paragraph>a[]</paragraph></note>');

			expect(editor.commands.get('warning')?.isOn).toBe(false);
		});
	});

	it('quick insert lists the blocks between blocks, without tables', () => {
		_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b</paragraph>');

		const position = editor.model.createPositionAt(editor.model.document.getRoot()!, 1);
		const labels = editor.plugins
			.get('QuickInsert')
			.getItems(position)
			.map(item => item.label);

		expect(labels).toEqual(
			expect.arrayContaining(['Paragraph', 'Heading 1', 'Note', 'Block quote', 'Horizontal line'])
		);
		expect(labels).not.toContain('table');
	});

	it('has "Show attributes" in the menu of an element', () => {
		const items = elementMenu(editor.model.document.getRoot()!.getChild(0) as ModelElement, editor);

		expect(items).toContain(editor.commands.get('showElementAttributes'));
	});

	describe('clickable elements', () => {
		const dialog = (): { id: string | null; rows: string[][] } => {
			const rows = [...document.querySelectorAll('.ck-dialog .ck-elements-attributes tr')].map(row =>
				[...row.children].map(cell => cell.textContent)
			);

			return { id: editor.plugins.get('Dialog').id, rows };
		};
		const fire = (type: 'click' | 'dblclick', element: Element): void => {
			element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
		};
		const editable = (): HTMLElement => editor.ui.getEditableElement()!;

		beforeEach(() => {
			// A click on a link would navigate the page of the test.
			editable().addEventListener('click', event => {
				event.preventDefault();
			});
		});

		it('clicking an image shows its attributes in a modal', () => {
			fire('click', editable().querySelector('figure.image img')!);

			const { id, rows } = dialog();

			expect(id).toBe('elementAttributes');
			expect(rows.map(([key]) => key)).toEqual(expect.arrayContaining(['src', 'alt']));
			expect(rows.find(([key]) => key === 'alt')?.[1]).toBe('An example image');
		});

		it('clicking the medium shows its attributes', () => {
			fire('click', editable().querySelector('figure.media')!);

			expect(dialog().rows).toContainEqual(['url', 'https://example.com/video/1']);
		});

		it('clicking a linked image shows its attributes, with the link', () => {
			fire('click', editable().querySelector('a img')!);

			expect(dialog().rows).toContainEqual(['linkHref', 'https://ckeditor.com']);
		});

		it('double-clicking a note shows its attributes, but clicking it does not', () => {
			const note = editable().querySelector('aside.note.warning p')!;

			fire('click', note);
			expect(dialog().id).toBeNull();

			fire('dblclick', note);
			expect(dialog().rows).toContainEqual(['type', 'warning']);
		});

		it('the modal can be closed', () => {
			fire('click', editable().querySelector('figure.image img')!);
			editor.plugins.get('Dialog').hide();

			expect(dialog().id).toBeNull();
		});
	});
});
