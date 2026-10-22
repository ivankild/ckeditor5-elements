import {
	Bold,
	ButtonView,
	ContextualBalloon,
	Paragraph,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement,
	type View
} from 'ckeditor5';
import { ElementCommand } from 'ckeditor5-elements-ui';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementContextMenu, { type ElementContextMenuItems } from '../src/elementContextMenu.js';
import ElementContextMenuView from '../src/elementContextMenuView.js';
import MenuSeparatorView from '../src/menuSeparatorView.js';
import SubmenuView from '../src/submenuView.js';

describe('ElementContextMenu', () => {
	let editor: ClassicEditor;
	let plugin: ElementContextMenu;
	let balloon: ContextualBalloon;
	let containerCommand: ElementCommand;

	/**
	 * Creates the editor with a `container` toggle command (titled "Container"). The menu config defaults to just that
	 * command. The selection is in the paragraph inside the container; the second paragraph has bold text.
	 */
	async function setUp(elementContextMenu: ElementContextMenuItems = () => [containerCommand]): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Bold, Container, ElementContextMenu],
			elementContextMenu
		});

		plugin = editor.plugins.get('ElementContextMenu');
		balloon = editor.plugins.get(ContextualBalloon);

		containerCommand = new ElementCommand(editor);
		containerCommand.elementName = 'container';
		containerCommand.set({ title: 'Container', icon: '<svg></svg>' });
		editor.commands.add('container', containerCommand);

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
	const menuItems = (): View[] => Array.from(plugin.view?.items ?? []);
	const buttons = (): ButtonView[] => menuItems().filter(item => item instanceof ButtonView);
	const labels = (): string[] => buttons().map(button => button.label ?? '');

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name and does not load the clipboard commands', async () => {
		await setUp();

		expect(ElementContextMenu.pluginName).toBe('ElementContextMenu');
		expect(editor.plugins.has('ElementClipboard')).toBe(false);
	});

	describe('right-click in the editable', () => {
		it('opens the menu with the configured items', async () => {
			await setUp();

			const prevented = rightClick(editable().querySelector('section p')!);

			expect(prevented).toBe(true);
			expect(plugin.view).toBeInstanceOf(ElementContextMenuView);
			expect(balloon.visibleView).toBe(plugin.view);
			expect(labels()).toEqual(['Container']);
			expect(buttons().every(button => button.withText && button.role === 'menuitem')).toBe(true);
		});

		it('keeps the native menu without the config option', async () => {
			editor = await createEditor({ plugins: [Paragraph, ElementContextMenu] });
			plugin = editor.plugins.get('ElementContextMenu');

			expect(rightClick(editable().querySelector('p')!)).toBe(false);
			expect(plugin.open(child(0), new DOMRect())).toBe(false);
		});

		it('passes the closest model element and the editor to the config callback', async () => {
			const items = vi.fn<ElementContextMenuItems>(() => [containerCommand]);

			await setUp(items);
			rightClick(editable().querySelector('section p')!);

			expect(items).toHaveBeenCalledWith(child(0).getChild(0), editor);
		});

		it('skips text attribute elements', async () => {
			const items = vi.fn<ElementContextMenuItems>(() => [containerCommand]);

			await setUp(items);
			rightClick(editable().querySelector('strong')!);

			expect(items).toHaveBeenCalledWith(child(1), editor);
		});

		it('keeps the native menu when there are no items', async () => {
			await setUp(() => [undefined, null]);

			expect(rightClick(editable().querySelector('section p')!)).toBe(false);
			expect(plugin.view).toBeNull();
		});

		it('keeps the native menu for the root', async () => {
			await setUp();

			expect(rightClick(editable())).toBe(false);
			expect(plugin.view).toBeNull();
		});
	});

	describe('command items', () => {
		it('show the title and icon of the command, and its state for the element', async () => {
			await setUp(() => [containerCommand]);

			// The selection is in the container, but the menu is for the second paragraph.
			expect(containerCommand.isOn).toBe(true);
			plugin.open(child(1), new DOMRect());

			const [button] = buttons();

			expect(button.label).toBe('Container');
			expect(button.icon).toBe('<svg></svg>');
			expect(button.isOn).toBe(false);
			expect(button.isEnabled).toBe(true);
			expect(containerCommand.isOn).toBe(true);
		});

		it('show the disabled state of the command for the element', async () => {
			await setUp(() => [containerCommand]);
			editor.enableReadOnlyMode('test');

			plugin.open(child(1), new DOMRect());

			expect(buttons()[0]?.isEnabled).toBe(false);
		});

		it('execute the command for the element, close the menu and focus the editor', async () => {
			await setUp(() => [containerCommand]);
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			plugin.open(child(1), new DOMRect());
			buttons()[0].fire('execute');

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><container><paragraph><$text bold="true">bar</$text></paragraph></container>'
			);
			expect(plugin.view).toBeNull();
			expect(focusSpy).toHaveBeenCalled();
			expect(containerCommand.isOn).toBe(true);
		});

		it('skip missing items', async () => {
			await setUp(() => [undefined, null, containerCommand]);

			plugin.open(child(1), new DOMRect());

			expect(labels()).toEqual(['Container']);
		});
	});

	describe('submenus', () => {
		it('are shown as submenus with the views of their items', async () => {
			await setUp(() => [
				{ title: 'More', items: [containerCommand, { title: 'Even more', items: [containerCommand] }] }
			]);

			plugin.open(child(1), new DOMRect());

			const [submenu] = menuItems();

			expect(submenu).toBeInstanceOf(SubmenuView);

			if (!(submenu instanceof SubmenuView)) {
				return;
			}

			const [button, nested] = Array.from(submenu.panelView.items);

			expect(submenu.buttonView.label).toBe('More');
			expect(submenu.buttonView.isEnabled).toBe(true);
			expect(button instanceof ButtonView && button.label).toBe('Container');
			expect(nested).toBeInstanceOf(SubmenuView);
		});

		it('are disabled when none of their items is enabled', async () => {
			await setUp(() => [{ title: 'More', items: [{ title: 'Even more', items: [containerCommand] }] }]);
			editor.enableReadOnlyMode('test');

			plugin.open(child(1), new DOMRect());

			const [submenu] = menuItems();

			expect(submenu instanceof SubmenuView && submenu.buttonView.isEnabled).toBe(false);
		});

		it('are skipped when they have no items', async () => {
			await setUp(() => [{ title: 'Empty', items: [] }, containerCommand]);

			plugin.open(child(1), new DOMRect());

			expect(menuItems()).toHaveLength(1);
			expect(menuItems()[0]).toBeInstanceOf(ButtonView);
		});

		it('close the whole menu when a nested item is executed', async () => {
			await setUp(() => [{ title: 'More', items: [containerCommand] }]);

			plugin.open(child(1), new DOMRect());

			const [submenu] = menuItems();

			if (submenu instanceof SubmenuView) {
				submenu.panelView.items.first?.fire('execute');
			}

			expect(plugin.view).toBeNull();
		});
	});

	describe('separators', () => {
		const isSeparator = (view: View | undefined): boolean => view instanceof MenuSeparatorView;

		it('are shown between items', async () => {
			await setUp(() => [containerCommand, '|', { title: 'More', items: [containerCommand] }]);

			plugin.open(child(1), new DOMRect());

			expect(menuItems().map(isSeparator)).toEqual([false, true, false]);
			expect(menuItems()[1]?.element?.getAttribute('role')).toBe('separator');
		});

		it('are not shown at the start or the end, or repeated', async () => {
			await setUp(() => ['|', '|', containerCommand, '|', null, '|', containerCommand, '|']);

			plugin.open(child(1), new DOMRect());

			expect(menuItems().map(isSeparator)).toEqual([false, true, false]);
		});

		it('are not shown next to skipped items', async () => {
			await setUp(() => [containerCommand, '|', { title: 'Empty', items: ['|'] }, '|']);

			plugin.open(child(1), new DOMRect());

			expect(menuItems().map(isSeparator)).toEqual([false]);
		});

		it('work in submenus', async () => {
			await setUp(() => [{ title: 'More', items: ['|', containerCommand, '|', containerCommand] }]);

			plugin.open(child(1), new DOMRect());

			const [submenu] = menuItems();
			const nested = submenu instanceof SubmenuView ? Array.from(submenu.panelView.items) : [];

			expect(nested.map(isSeparator)).toEqual([false, true, false]);
		});

		it('do not keep the native menu from showing', async () => {
			await setUp(() => ['|']);

			expect(plugin.open(child(1), new DOMRect())).toBe(false);
		});
	});

	describe('open()', () => {
		it('uses the given items callback instead of the config option', async () => {
			await setUp();

			const items = vi.fn<ElementContextMenuItems>(() => [{ title: 'More', items: [containerCommand] }]);

			plugin.open(child(1), new DOMRect(), items);

			expect(items).toHaveBeenCalledWith(child(1), editor);
			expect(menuItems()[0]).toBeInstanceOf(SubmenuView);
		});

		it('returns whether the menu was opened', async () => {
			await setUp(element => (element.is('element', 'container') ? [containerCommand] : []));

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

		it('closes when a shown view is executed', async () => {
			await setUp();

			const button = new ButtonView();

			plugin.show([button], new DOMRect());
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
