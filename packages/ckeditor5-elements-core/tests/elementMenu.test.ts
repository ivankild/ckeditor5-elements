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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementCommand from '../src/elementCommand.js';
import ElementMenu, { type ElementMenuConfig } from '../src/elementMenu.js';
import ElementMenuView from '../src/elementMenuView.js';
import MenuSeparatorView from '../src/menuSeparatorView.js';
import SubmenuView from '../src/submenuView.js';

describe('ElementMenu', () => {
	let editor: ClassicEditor;
	let menu: ElementMenu;
	let balloon: ContextualBalloon;
	let containerCommand: ElementCommand;
	let config: ElementMenuConfig;

	/**
	 * Creates the editor with a `container` toggle command (titled "Container"). The menu config defaults to just that
	 * command. The selection is in the paragraph inside the container; the second paragraph has bold text.
	 */
	async function setUp(menuConfig: ElementMenuConfig = () => [containerCommand]): Promise<void> {
		editor = await createEditor({ plugins: [Paragraph, Bold, Container, ElementMenu] });

		menu = editor.plugins.get('ElementMenu');
		balloon = editor.plugins.get(ContextualBalloon);
		config = menuConfig;

		containerCommand = new ElementCommand(editor);
		containerCommand.elementName = 'container';
		containerCommand.set({ title: 'Container', icon: '<svg></svg>' });
		editor.commands.add('container', containerCommand);

		_setModelData(
			editor.model,
			'<container><paragraph>f[]oo</paragraph></container><paragraph><$text bold="true">bar</$text></paragraph>'
		);
	}

	const open = (element: ModelElement): boolean => menu.open(element, new DOMRect(), config);
	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;
	const menuItems = (): View[] => Array.from(menu.view?.items ?? []);
	const buttons = (): ButtonView[] => menuItems().filter(item => item instanceof ButtonView);
	const labels = (): string[] => buttons().map(button => button.label ?? '');

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name and loads the balloon and notifications', async () => {
		await setUp();

		expect(ElementMenu.pluginName).toBe('ElementMenu');
		expect(editor.plugins.has(ContextualBalloon)).toBe(true);
		expect(editor.plugins.has('Notification')).toBe(true);
	});

	it('passes the element and the editor to the config callback', async () => {
		const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

		await setUp(items);
		open(child(1));

		expect(items).toHaveBeenCalledWith(child(1), editor);
		expect(menu.view).toBeInstanceOf(ElementMenuView);
		expect(balloon.visibleView).toBe(menu.view);
	});

	describe('accessible name', () => {
		it('is "Element menu" by default', async () => {
			await setUp();
			open(child(1));

			expect(menu.view?.element?.getAttribute('aria-label')).toBe('Element menu');
		});

		it('can be given', async () => {
			await setUp();
			menu.open(child(1), new DOMRect(), config, { label: 'Paragraph menu' });

			expect(menu.view?.element?.getAttribute('aria-label')).toBe('Paragraph menu');
		});
	});

	describe('closing on changes', () => {
		it('closes when the element is removed', async () => {
			await setUp();
			open(child(1));

			editor.model.change(writer => {
				writer.remove(child(1));
			});

			expect(menu.view).toBeNull();
		});

		it('stays open when other content changes', async () => {
			await setUp();
			open(child(1));

			editor.model.change(writer => {
				writer.insertText('x', child(0).getChild(0) as ModelElement, 0);
			});

			expect(menu.view).not.toBeNull();
		});

		it('closes when `isObsolete` returns true', async () => {
			await setUp();

			let isObsolete = false;

			menu.show([new ButtonView()], new DOMRect(), { isObsolete: () => isObsolete });

			editor.model.change(writer => {
				writer.insertText('x', child(1), 0);
			});
			expect(menu.view).not.toBeNull();

			isObsolete = true;
			editor.model.change(writer => {
				writer.insertText('y', child(1), 0);
			});
			expect(menu.view).toBeNull();
		});
	});

	describe('command items', () => {
		it('show the title and icon of the command, and its state for the element', async () => {
			await setUp(() => [containerCommand]);

			// The selection is in the container, but the menu is for the second paragraph.
			expect(containerCommand.isOn).toBe(true);
			open(child(1));

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

			open(child(1));

			expect(buttons()[0]?.isEnabled).toBe(false);
		});

		it('are disabled for a force-disabled command', async () => {
			await setUp(() => [containerCommand]);
			containerCommand.forceDisabled('test');

			open(child(1));

			expect(buttons()[0]?.isEnabled).toBe(false);
		});

		it('are checkable menu items for toggleable commands, so assistive technology knows they are on', async () => {
			await setUp(() => [containerCommand]);

			open(child(0));
			expect(buttons()[0]?.element?.getAttribute('role')).toBe('menuitemcheckbox');
			expect(buttons()[0]?.element?.getAttribute('aria-checked')).toBe('true');

			open(child(1));
			expect(buttons()[0]?.element?.getAttribute('aria-checked')).toBe('false');
		});

		it('are plain menu items for other commands', async () => {
			await setUp();

			const plain = new ElementCommand(editor);

			plain.isToggleable = false;
			menu.open(child(0), new DOMRect(), () => [plain]);

			expect(buttons()[0]?.element?.getAttribute('role')).toBe('menuitem');
			expect(buttons()[0]?.element?.hasAttribute('aria-checked')).toBe(false);
		});

		it('execute the command for the element, close the menu and focus the editor', async () => {
			await setUp(() => [containerCommand]);
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			open(child(1));
			buttons()[0].fire('execute');

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><container><paragraph><$text bold="true">bar</$text></paragraph></container>'
			);
			expect(menu.view).toBeNull();
			expect(focusSpy).toHaveBeenCalled();
			expect(containerCommand.isOn).toBe(true);
		});

		it('skip missing items', async () => {
			await setUp(() => [undefined, null, containerCommand]);

			open(child(1));

			expect(labels()).toEqual(['Container']);
		});
	});

	describe('submenus', () => {
		it('are shown as submenus with the views of their items', async () => {
			await setUp(() => [
				{ title: 'More', items: [containerCommand, { title: 'Even more', items: [containerCommand] }] }
			]);

			open(child(1));

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

		it('show their icon', async () => {
			await setUp(() => [{ title: 'More', icon: '<svg id="more"></svg>', items: [containerCommand] }]);

			open(child(1));

			const [submenu] = menuItems();

			expect(submenu instanceof SubmenuView && submenu.buttonView.icon).toBe('<svg id="more"></svg>');
		});

		it('are disabled when none of their items is enabled', async () => {
			await setUp(() => [{ title: 'More', items: [{ title: 'Even more', items: [containerCommand] }] }]);
			editor.enableReadOnlyMode('test');

			open(child(1));

			const [submenu] = menuItems();

			expect(submenu instanceof SubmenuView && submenu.buttonView.isEnabled).toBe(false);
		});

		it('are skipped when they have no items', async () => {
			await setUp(() => [{ title: 'Empty', items: [] }, containerCommand]);

			open(child(1));

			expect(menuItems()).toHaveLength(1);
			expect(menuItems()[0]).toBeInstanceOf(ButtonView);
		});

		it('close the whole menu when a nested item is executed', async () => {
			await setUp(() => [{ title: 'More', items: [containerCommand] }]);

			open(child(1));

			const [submenu] = menuItems();

			if (submenu instanceof SubmenuView) {
				submenu.panelView.items.first?.fire('execute');
			}

			expect(menu.view).toBeNull();
		});
	});

	describe('separators', () => {
		const isSeparator = (view: View | undefined): boolean => view instanceof MenuSeparatorView;

		it('are shown between items', async () => {
			await setUp(() => [containerCommand, '|', { title: 'More', items: [containerCommand] }]);

			open(child(1));

			expect(menuItems().map(isSeparator)).toEqual([false, true, false]);
			expect(menuItems()[1]?.element?.getAttribute('role')).toBe('separator');
		});

		it('are not shown at the start or the end, or repeated', async () => {
			await setUp(() => ['|', '|', containerCommand, '|', null, '|', containerCommand, '|']);

			open(child(1));

			expect(menuItems().map(isSeparator)).toEqual([false, true, false]);
		});

		it('are not shown next to skipped items', async () => {
			await setUp(() => [containerCommand, '|', { title: 'Empty', items: ['|'] }, '|']);

			open(child(1));

			expect(menuItems().map(isSeparator)).toEqual([false]);
		});

		it('work in submenus', async () => {
			await setUp(() => [{ title: 'More', items: ['|', containerCommand, '|', containerCommand] }]);

			open(child(1));

			const [submenu] = menuItems();
			const nested = submenu instanceof SubmenuView ? Array.from(submenu.panelView.items) : [];

			expect(nested.map(isSeparator)).toEqual([false, true, false]);
		});

		it('do not keep the native menu from showing', async () => {
			await setUp(() => ['|']);

			expect(open(child(1))).toBe(false);
		});
	});

	describe('open()', () => {
		it('returns whether the menu was opened', async () => {
			await setUp(element => (element.is('element', 'container') ? [containerCommand] : []));

			expect(open(child(1))).toBe(false);
			expect(open(child(0))).toBe(true);
		});
	});

	describe('show() and hide()', () => {
		it('focuses the first focusable item', async () => {
			await setUp();

			open(child(1));

			expect(document.activeElement).toBe(menu.view!.items.first!.element);
		});

		it('replaces the open menu', async () => {
			await setUp();

			open(child(0));
			const first = menu.view;

			open(child(1));

			expect(menu.view).not.toBe(first);
			expect(balloon.hasView(first!)).toBe(false);
		});

		it('closes when a shown view is executed', async () => {
			await setUp();

			const button = new ButtonView();

			menu.show([button], new DOMRect());
			button.fire('execute');

			expect(menu.view).toBeNull();
			expect(balloon.visibleView).toBeNull();
		});

		it('closes on Esc and focuses the editor', async () => {
			await setUp();
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			open(child(0));
			menu.view!.fire('cancel');

			expect(menu.view).toBeNull();
			expect(focusSpy).toHaveBeenCalled();
		});

		it('closes on Esc and focuses `returnFocusTo`', async () => {
			await setUp();
			const opener = { focus: vi.fn() };
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			menu.open(child(0), new DOMRect(), config, { returnFocusTo: opener });
			menu.view!.fire('cancel');

			expect(opener.focus).toHaveBeenCalled();
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it('calls `onHide` once when the menu closes, for any reason', async () => {
			await setUp();
			const onHide = vi.fn();

			menu.open(child(0), new DOMRect(), config, { onHide });
			expect(onHide).not.toHaveBeenCalled();

			// Another menu replaces it.
			open(child(1));
			expect(onHide).toHaveBeenCalledTimes(1);

			menu.open(child(0), new DOMRect(), config, { onHide });
			menu.view!.fire('cancel');
			expect(onHide).toHaveBeenCalledTimes(2);

			menu.open(child(0), new DOMRect(), config, { onHide });
			document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
			expect(onHide).toHaveBeenCalledTimes(3);

			menu.hide();
			expect(onHide).toHaveBeenCalledTimes(3);
		});

		it('closes when clicking outside', async () => {
			await setUp();

			open(child(0));
			document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

			expect(menu.view).toBeNull();
		});

		it('stays open when clicking inside', async () => {
			await setUp();

			open(child(0));
			menu.view!.element!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

			expect(menu.view).not.toBeNull();
		});

		it('hide() does nothing when no menu is open', async () => {
			await setUp();

			expect(() => {
				menu.hide();
			}).not.toThrow();
		});

		it('hides the menu when the editor is destroyed', async () => {
			await setUp();

			open(child(0));
			const view = menu.view!;
			const destroySpy = vi.spyOn(view, 'destroy');

			menu.destroy();

			expect(destroySpy).toHaveBeenCalled();
			expect(menu.view).toBeNull();
		});
	});
});
