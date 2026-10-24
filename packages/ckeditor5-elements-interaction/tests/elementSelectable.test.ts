import {
	Delete,
	Paragraph,
	Typing,
	Widget,
	_getModelData,
	_setModelData,
	keyCodes,
	type ClassicEditor,
	type ModelElement,
	type ViewDocumentKeyDownEvent
} from 'ckeditor5';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockObject, Container, createEditor } from '../../../testUtils/editor.js';
import { pressIn } from '../../../testUtils/keyboard.js';
import ElementSelectable, { type ElementSelectableMatcher } from '../src/elementSelectable.js';

describe('ElementSelectable', () => {
	let editor: ClassicEditor;

	async function setUp(selectable: ElementSelectableMatcher[], data: string): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Typing, Delete, Container, BlockObject, ElementSelectable],
			selectableElements: selectable
		});

		// `container` is the element of the test utils, converted to `<section class="container">`.
		_setModelData(editor.model, data);
	}

	const editable = (): HTMLElement => editor.ui.getEditableElement()!;
	const model = (): string => _getModelData(editor.model);
	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	function mouseDown(target: Element): MouseEvent {
		const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

		target.dispatchEvent(event);

		return event;
	}

	const key = (keyCode: number): boolean => pressIn(editable(), keyCode);

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name', async () => {
		await setUp([], '<paragraph>a[]</paragraph>');

		expect(ElementSelectable.pluginName).toBe('ElementSelectable');
	});

	describe('the selection', () => {
		it('is on the element, with a fake view selection and a class on the element, which goes away with the selection', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			editor.model.change(writer => {
				writer.setSelection(child(1), 'on');
			});

			expect(editor.editing.view.document.selection.isFake).toBe(true);
			expect(editor.editing.view.document.selection.fakeSelectionLabel).toBe('<container>');
			expect(editable().querySelector('section')!.classList.contains('ck-elements-selected')).toBe(true);

			editor.model.change(writer => {
				writer.setSelection(child(0), 'in');
			});

			expect(editor.editing.view.document.selection.isFake).toBe(false);
			expect(editable().querySelector('section')!.classList.contains('ck-elements-selected')).toBe(false);
		});

		it('is kept on a container: the names are made selectable in the schema', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			expect(editor.model.schema.isSelectable('container')).toBe(true);
			expect(editor.model.schema.isSelectable('paragraph')).toBe(false);
		});

		it('is not a fake one for an element that is not selectable', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			editor.model.change(writer => {
				writer.setSelection(child(0), 'on');
			});

			expect(editor.editing.view.document.selection.isFake).toBe(false);
		});
	});

	describe('the mouse', () => {
		it('selects the element that is clicked: a container, on its own box', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			const event = mouseDown(editable().querySelector('section')!);

			expect(event.defaultPrevented).toBe(true);
			expect(model()).toBe('<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]');
		});

		it('does not select a container for a click on its content: the cursor goes there', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			const event = mouseDown(editable().querySelector('section p')!);

			expect(event.defaultPrevented).toBe(false);
			expect(model()).toBe('<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');
		});

		it('selects an element with no content for a click anywhere in it, also in a nested view element', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container></container>');
			editor.editing.view.change(writer => {
				const view = editor.editing.mapper.toViewElement(child(1))!;

				writer.insert(
					writer.createPositionAt(view, 0),
					writer.createContainerElement('span', { class: 'inner' })
				);
			});

			mouseDown(editable().querySelector('.inner')!);

			expect(model()).toBe('<paragraph>a</paragraph>[<container></container>]');
		});

		it('selects by a filter function', async () => {
			// A filter cannot make the element selectable in the schema, so it is for the elements that are: objects.
			await setUp([element => element.name === 'element'], '<paragraph>a[]</paragraph><element></element>');

			mouseDown(editable().querySelector('.ck-element')!);

			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});

		it('does nothing for an element that does not match', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container></container>');

			const event = mouseDown(editable().querySelector('p')!);

			expect(event.defaultPrevented).toBe(false);
			expect(model()).toBe('<paragraph>a[]</paragraph><container></container>');
		});

		it('does nothing when the plugin is disabled', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container></container>');
			editor.plugins.get(ElementSelectable).forceDisabled('test');

			mouseDown(editable().querySelector('section')!);

			expect(model()).toBe('<paragraph>a[]</paragraph><container></container>');
		});

		it('works in read-only mode, which does not change the data', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container></container>');
			editor.enableReadOnlyMode('test');

			mouseDown(editable().querySelector('section')!);

			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});
	});

	describe('the arrow keys', () => {
		it('select the next selectable element when the cursor is at the end of the text', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			expect(key(keyCodes.arrowright)).toBe(true);
			expect(model()).toBe('<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]');
		});

		it('select the previous one when the cursor is at the start of the text, with the left key', async () => {
			await setUp(['container'], '<container><paragraph>a</paragraph></container><paragraph>[]b</paragraph>');

			expect(key(keyCodes.arrowleft)).toBe(true);
			expect(model()).toBe('[<container><paragraph>a</paragraph></container>]<paragraph>b</paragraph>');
		});

		it('select the next one from the end of a block in a container, which is the last in it', async () => {
			await setUp(
				['container', 'divider'],
				'<container><container><paragraph>a[]</paragraph></container></container><paragraph>b</paragraph>'
			);

			// Not selectable after it: the paragraph. Nothing happens, the browser moves the cursor.
			expect(key(keyCodes.arrowright)).toBe(false);
			expect(model()).toBe(
				'<container><container><paragraph>a[]</paragraph></container></container><paragraph>b</paragraph>'
			);
		});

		it('select an empty container, which the cursor cannot enter, between blocks', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container></container><paragraph>b</paragraph>');

			expect(key(keyCodes.arrowright)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));

			_setModelData(editor.model, '<paragraph>a</paragraph><container></container><paragraph>[]b</paragraph>');

			expect(key(keyCodes.arrowleft)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});

		it('select the outermost of nested selectable containers, which the step enters', async () => {
			await setUp(
				['container'],
				'<paragraph>a[]</paragraph><container><container><paragraph>b</paragraph></container></container>'
			);

			key(keyCodes.arrowright);

			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});

		it('do nothing in the middle of the text, or before an element that is not selectable', async () => {
			await setUp(['container'], '<paragraph>a[]b</paragraph><paragraph>c</paragraph>');

			expect(key(keyCodes.arrowright)).toBe(false);
			expect(model()).toBe('<paragraph>a[]b</paragraph><paragraph>c</paragraph>');

			_setModelData(editor.model, '<paragraph>a[]</paragraph><paragraph>c</paragraph>');

			expect(key(keyCodes.arrowright)).toBe(false);
		});

		it('do nothing in the middle of the text, with a selectable element after or before the paragraph', async () => {
			await setUp(
				['container'],
				'<container></container><paragraph>one t[]wo <$text bold="true">three</$text> four</paragraph><container></container>'
			);

			expect(key(keyCodes.arrowright)).toBe(false);
			expect(key(keyCodes.arrowleft)).toBe(false);
			expect(model()).toContain('one t[]wo');
		});

		it('select an element that is next to the cursor in the text, e.g. an inline one', async () => {
			await setUp(['element'], '<paragraph>a[]</paragraph>');
			editor.model.schema.extend('element', { allowIn: 'paragraph' });
			_setModelData(editor.model, '<paragraph>a[]<element></element>b</paragraph>');

			expect(key(keyCodes.arrowright)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(0, 1));
		});

		it('do not move by the up and down keys when the cursor is in the text: only the browser knows the lines', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			expect(key(keyCodes.arrowdown)).toBe(false);
		});

		it('do nothing with the shift key: it extends the selection', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container>');

			expect(pressIn(editable(), keyCodes.arrowright, { shiftKey: true })).toBe(false);
		});

		it('move out of the selected element: right and down to the content after it, left and up before it', async () => {
			await setUp(
				['container'],
				'<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]<paragraph>c</paragraph>'
			);

			expect(key(keyCodes.arrowdown)).toBe(true);
			expect(model()).toBe(
				'<paragraph>a</paragraph><container><paragraph>b</paragraph></container><paragraph>[]c</paragraph>'
			);

			_setModelData(
				editor.model,
				'<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]<paragraph>c</paragraph>'
			);

			expect(key(keyCodes.arrowup)).toBe(true);
			expect(model()).toBe(
				'<paragraph>a[]</paragraph><container><paragraph>b</paragraph></container><paragraph>c</paragraph>'
			);
		});

		it('move from a selected element to the next one that is selectable, if it is just there', async () => {
			await setUp(
				['container'],
				'[<container></container>]<container><paragraph>b</paragraph></container><paragraph>c</paragraph>'
			);

			key(keyCodes.arrowright);

			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));

			key(keyCodes.arrowleft);

			expect(editor.model.document.selection.getSelectedElement()).toBe(child(0));
		});

		it('keep the selected element when there is nothing after it, and do not let the browser move', async () => {
			await setUp(['container'], '<paragraph>a</paragraph>[<container></container>]');

			expect(key(keyCodes.arrowright)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});
	});

	describe('with CKEditor widgets loaded, which other features load (e.g. the clipboard)', () => {
		it('selects the next element from a selected object, which the widgets handle for every object', async () => {
			editor = await createEditor({
				plugins: [Paragraph, Widget, Container, BlockObject, ElementSelectable],
				selectableElements: ['container', 'element']
			});
			_setModelData(editor.model, '[<element></element>]<container><paragraph>b</paragraph></container>');

			expect(key(keyCodes.arrowright)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(1));
		});
	});

	describe('the Esc key', () => {
		it('selects the closest selectable element around the cursor, and then the next one around it', async () => {
			await setUp(
				['container'],
				'<container><container><paragraph>a[]</paragraph></container></container><paragraph>b</paragraph>'
			);

			expect(key(keyCodes.esc)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(0, 0));

			expect(key(keyCodes.esc)).toBe(true);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(0));

			// No more around it.
			expect(key(keyCodes.esc)).toBe(false);
			expect(editor.model.document.selection.getSelectedElement()).toBe(child(0));
		});

		it('leaves Esc to what handles it first, e.g. closing a balloon, and does not select then', async () => {
			await setUp(['container'], '<container><paragraph>a[]</paragraph></container>');

			let handled = 0;

			editor.editing.view.document.on<ViewDocumentKeyDownEvent>(
				'keydown',
				(evt, data) => {
					if (data.keystroke === keyCodes.esc) {
						handled++;
						evt.stop();
					}
				},
				{ priority: 'normal' }
			);

			key(keyCodes.esc);

			expect(handled).toBe(1);
			expect(editor.model.document.selection.getSelectedElement()).toBeNull();
		});

		it('leaves Esc to an editor keystroke that handles it, as features do (e.g. a balloon calls cancel())', async () => {
			await setUp(['container'], '<container><paragraph>a[]</paragraph></container>');

			let handled = 0;

			editor.keystrokes.set('Esc', (data, cancel) => {
				handled++;
				cancel();
			});

			key(keyCodes.esc);

			expect(handled).toBe(1);
			expect(editor.model.document.selection.getSelectedElement()).toBeNull();
		});

		it('does nothing outside the selectable elements', async () => {
			await setUp(['container'], '<paragraph>a[]</paragraph>');

			expect(key(keyCodes.esc)).toBe(false);
		});
	});

	describe('a selected element', () => {
		it('is deleted by Backspace and Delete, as any selected content', async () => {
			await setUp(['container'], '<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]');

			editor.execute('delete');

			expect(model()).not.toContain('<container>');
		});

		it('is replaced by typing', async () => {
			await setUp(['container'], '<paragraph>a</paragraph>[<container><paragraph>b</paragraph></container>]');

			editor.execute('insertText', { text: 'x' });

			expect(_getModelData(editor.model, { withoutSelection: true })).not.toContain('<container>');
			expect(_getModelData(editor.model, { withoutSelection: true })).toContain('x');
		});
	});

	describe('add()', () => {
		it('makes more elements selectable, and extends the schema for names', async () => {
			await setUp([], '<paragraph>a[]</paragraph><container></container>');

			expect(editor.plugins.get(ElementSelectable).isSelectable(child(1))).toBe(false);

			editor.plugins.get(ElementSelectable).add('container');

			expect(editor.plugins.get(ElementSelectable).isSelectable(child(1))).toBe(true);
			expect(editor.model.schema.isSelectable('container')).toBe(true);
		});

		it('ignores a name that is not registered, for the schema', async () => {
			await setUp([], '<paragraph>a[]</paragraph>');

			expect(() => {
				editor.plugins.get(ElementSelectable).add('unknown');
			}).not.toThrow();
		});

		it('does not select the root', async () => {
			await setUp([() => true], '<paragraph>a[]</paragraph>');

			expect(editor.plugins.get(ElementSelectable).isSelectable(editor.model.document.getRoot()!)).toBe(false);
		});
	});
});
