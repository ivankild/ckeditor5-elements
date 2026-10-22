import {
	Bold,
	ButtonView,
	ContextualBalloon,
	Paragraph,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ElementContextMenu, { type ElementContextMenuItems } from '../src/elementContextMenu.js';
import ElementContextMenuView from '../src/elementContextMenuView.js';
import { Container, createEditor, createPlainView } from '../../../testUtils/editor.js';

describe('ElementContextMenu', () => {
	let editor: ClassicEditor;
	let plugin: ElementContextMenu;
	let balloon: ContextualBalloon;

	async function setUp(elementContextMenu?: ElementContextMenuItems): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Bold, Container, ElementContextMenu],
			...(elementContextMenu ? { elementContextMenu } : {})
		});

		plugin = editor.plugins.get('ElementContextMenu');
		balloon = editor.plugins.get(ContextualBalloon);

		_setModelData(
			editor.model,
			'<container><paragraph>f[]oo</paragraph></container><paragraph><$text bold="true">bar</$text></paragraph>'
		);
	}

	/**
	 * Fires `contextmenu` on the DOM element and returns whether the native menu was prevented.
	 */
	function rightClick(domElement: Element): boolean {
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 20 });

		domElement.dispatchEvent(event);

		return event.defaultPrevented;
	}

	const editable = (): HTMLElement => editor.ui.getEditableElement()!;
	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name and requires the clipboard commands', async () => {
		await setUp();

		expect(ElementContextMenu.pluginName).toBe('ElementContextMenu');
		expect(editor.plugins.has('ElementClipboard')).toBe(true);
	});

	describe('right-click in the editable', () => {
		it('opens the menu with the clipboard items by default', async () => {
			await setUp();

			const prevented = rightClick(editable().querySelector('section p')!);

			expect(prevented).toBe(true);
			expect(plugin.view).toBeInstanceOf(ElementContextMenuView);
			expect(balloon.visibleView).toBe(plugin.view);
			expect(Array.from(plugin.view!.items, item => (item as ButtonView).label)).toEqual([
				'Copy',
				'Cut',
				'Paste',
				'Paste before',
				'Paste after'
			]);
		});

		it('passes the closest model element and the editor to the config callback', async () => {
			const items = vi.fn<ElementContextMenuItems>(() => [createPlainView()]);

			await setUp(items);
			rightClick(editable().querySelector('section p')!);

			expect(items).toHaveBeenCalledWith(child(0).getChild(0), editor);
		});

		it('skips text attribute elements', async () => {
			const items = vi.fn<ElementContextMenuItems>(() => [createPlainView()]);

			await setUp(items);
			rightClick(editable().querySelector('strong')!);

			expect(items).toHaveBeenCalledWith(child(1), editor);
		});

		it('keeps the native menu when there are no items', async () => {
			await setUp(() => []);

			expect(rightClick(editable().querySelector('section p')!)).toBe(false);
			expect(plugin.view).toBeNull();
		});

		it('keeps the native menu for the root', async () => {
			await setUp();

			expect(rightClick(editable())).toBe(false);
			expect(plugin.view).toBeNull();
		});
	});

	describe('default items', () => {
		it('are the clipboard actions', async () => {
			await setUp();

			expect(
				plugin.getDefaultItems(child(0)).map(item => (item instanceof ButtonView ? item.label : null))
			).toEqual(['Copy', 'Cut', 'Paste', 'Paste before', 'Paste after']);
		});

		it('start with the items added by other plugins, in the order they were added', async () => {
			await setUp();

			const first = createPlainView();
			const second = createPlainView();
			const firstCallback = vi.fn<ElementContextMenuItems>(() => [first]);

			plugin.addItems(firstCallback);
			plugin.addItems(() => [second]);

			const items = plugin.getDefaultItems(child(0));

			expect(items.slice(0, 2)).toEqual([first, second]);
			expect(items).toHaveLength(7);
			expect(firstCallback).toHaveBeenCalledWith(child(0), editor);
		});

		it('are shown when the config option is not set', async () => {
			await setUp();

			const view = createPlainView();

			plugin.addItems(() => [view]);
			plugin.open(child(0), new DOMRect());

			expect(plugin.view?.items.first).toBe(view);
		});

		it('are replaced by the config option', async () => {
			const configured = createPlainView();

			await setUp(() => [configured]);
			plugin.addItems(() => [createPlainView()]);
			plugin.open(child(0), new DOMRect());

			expect(Array.from(plugin.view!.items)).toEqual([configured]);
		});
	});

	describe('open()', () => {
		it('returns whether the menu was opened', async () => {
			await setUp(element => (element.is('element', 'container') ? [createPlainView()] : []));

			expect(plugin.open(child(1), new DOMRect())).toBe(false);
			expect(plugin.open(child(0), new DOMRect())).toBe(true);
		});
	});

	describe('show() and hide()', () => {
		it('focuses the first focusable item', async () => {
			await setUp();

			plugin.open(child(1), new DOMRect());

			expect(document.activeElement).toBe(plugin.view!.items.first!.element);
		});

		it('replaces the open menu', async () => {
			await setUp();

			plugin.open(child(0), new DOMRect());
			const first = plugin.view;

			plugin.open(child(1), new DOMRect());

			expect(plugin.view).not.toBe(first);
			expect(balloon.hasView(first!)).toBe(false);
		});

		it('closes when an item is executed', async () => {
			const button = new ButtonView();

			await setUp(() => [button]);
			plugin.open(child(0), new DOMRect());

			button.fire('execute');

			expect(plugin.view).toBeNull();
			expect(balloon.visibleView).toBeNull();
		});

		it('closes on Esc and focuses the editor', async () => {
			await setUp();
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			plugin.open(child(0), new DOMRect());
			plugin.view!.fire('cancel');

			expect(plugin.view).toBeNull();
			expect(focusSpy).toHaveBeenCalled();
		});

		it('closes when clicking outside', async () => {
			await setUp();

			plugin.open(child(0), new DOMRect());
			document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

			expect(plugin.view).toBeNull();
		});

		it('stays open when clicking inside', async () => {
			await setUp();

			plugin.open(child(0), new DOMRect());
			plugin.view!.element!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

			expect(plugin.view).not.toBeNull();
		});

		it('hide() does nothing when no menu is open', async () => {
			await setUp();

			expect(() => {
				plugin.hide();
			}).not.toThrow();
		});

		it('hides the menu when the editor is destroyed', async () => {
			await setUp();

			plugin.open(child(0), new DOMRect());
			const view = plugin.view!;
			const destroySpy = vi.spyOn(view, 'destroy');

			plugin.destroy();

			expect(destroySpy).toHaveBeenCalled();
			expect(plugin.view).toBeNull();
		});
	});

	describe('getModelElement()', () => {
		it('maps a view element, or its closest mapped ancestor, to a model element', async () => {
			await setUp();

			const viewRoot = editor.editing.view.document.getRoot()!;
			const viewParagraph = editor.editing.mapper.toViewElement(child(1))!;
			const viewStrong = viewParagraph.getChild(0);

			expect(plugin.getModelElement(viewParagraph)).toBe(child(1));
			expect(viewStrong?.is('attributeElement') && plugin.getModelElement(viewStrong)).toBe(child(1));
			expect(plugin.getModelElement(viewRoot)).toBeNull();
		});
	});
});
