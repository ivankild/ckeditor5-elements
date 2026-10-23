import {
	ButtonView,
	ContextualBalloon,
	Paragraph,
	_setModelData,
	keyCodes,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import { describeItems, keystroke } from '../../../testUtils/menu.js';
import ElementCommand from '../src/elementCommand.js';
import ElementMenu, { type ElementMenuConfig } from '../src/elementMenu.js';
import ElementMenuView from '../src/elementMenuView.js';

/**
 * Creates a `keydown` event, as the browser fires it.
 */
function keydown(keyCode: number): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });

	// CKEditor reads the key code.
	Object.defineProperty(event, 'keyCode', { value: keyCode });

	return event;
}

describe('ElementMenu', () => {
	let editor: ClassicEditor;
	let menu: ElementMenu;
	let balloon: ContextualBalloon;
	let containerCommand: ElementCommand;
	let config: ElementMenuConfig;

	/**
	 * Creates the editor with a `container` toggle command (titled "Container"). The menu config defaults to just that
	 * command. The selection is in the paragraph inside the container.
	 */
	async function setUp(menuConfig: ElementMenuConfig = () => [containerCommand]): Promise<void> {
		editor = await createEditor({ plugins: [Paragraph, Container, ElementMenu] });

		menu = editor.plugins.get('ElementMenu');
		balloon = editor.plugins.get(ContextualBalloon);
		config = menuConfig;

		containerCommand = new ElementCommand(editor);
		containerCommand.elementName = 'container';
		containerCommand.set({ title: 'Container', icon: '<svg></svg>' });
		editor.commands.add('container', containerCommand);

		_setModelData(editor.model, '<container><paragraph>f[]oo</paragraph></container><paragraph>bar</paragraph>');
	}

	const open = (element: ModelElement): boolean => menu.open(element, new DOMRect(), config);
	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;
	const menuView = (): ElementMenuView => menu.view as ElementMenuView;
	const pressEsc = (): void => {
		menu.view!.element!.dispatchEvent(keydown(keyCodes.esc));
	};

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name and loads the balloon and notifications', async () => {
		await setUp();

		expect(ElementMenu.pluginName).toBe('ElementMenu');
		expect(editor.plugins.has(ContextualBalloon)).toBe(true);
		expect(editor.plugins.has('Notification')).toBe(true);
	});

	describe('open()', () => {
		it('shows the menu of the element in the balloon, with the items of the config callback', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);

			expect(open(child(1))).toBe(true);
			expect(items).toHaveBeenCalledWith(child(1), editor);
			expect(menu.view).toBeInstanceOf(ElementMenuView);
			expect(menuView().target).toBe(child(1));
			expect(balloon.visibleView).toBe(menu.view);
			expect(describeItems(menuView())).toEqual(['Container']);
		});

		it('focuses the first item', async () => {
			await setUp();
			open(child(1));

			expect(document.activeElement).toBe(menuView().buttons[0]?.element);
		});

		it('names the menu "Element menu", or with the given label', async () => {
			await setUp();

			open(child(1));
			expect(menuView().element?.getAttribute('aria-label')).toBe('Element menu');

			menu.open(child(1), new DOMRect(), config, { label: 'Paragraph menu' });
			expect(menuView().element?.getAttribute('aria-label')).toBe('Paragraph menu');
		});

		it('returns false, and shows nothing, without items', async () => {
			await setUp(() => [undefined, null, '|', { title: 'Empty', items: ['|'] }]);

			expect(open(child(1))).toBe(false);
			expect(menu.view).toBeNull();
		});

		it('skips missing items, submenus without items, and separators at the start or the end, or repeated', async () => {
			await setUp(() => [
				'|',
				null,
				containerCommand,
				'|',
				{ title: 'Empty', items: [undefined] },
				'|',
				{ title: 'More', items: ['|', containerCommand, '|', '|', containerCommand, '|'] },
				'|'
			]);
			open(child(1));

			expect(describeItems(menuView())).toEqual(['Container', '|', 'More ›']);
			expect(describeItems(menuView().menus[0].listView)).toEqual(['Container', '|', 'Container']);
		});

		it('replaces the open menu', async () => {
			await setUp();

			open(child(0));
			const first = menu.view;

			open(child(1));

			expect(menu.view).not.toBe(first);
			expect(balloon.hasView(first!)).toBe(false);
		});
	});

	describe('closing', () => {
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

		it('closes when an item is executed, also in a nested menu, and the editor gets the focus', async () => {
			await setUp(() => [{ title: 'More', items: [containerCommand] }]);
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			open(child(1));
			menuView().menus[0].isOpen = true;
			menuView().buttons[0].element!.click();

			expect(menu.view).toBeNull();
			expect(balloon.visibleView).toBeNull();
			expect(focusSpy).toHaveBeenCalled();
		});

		it('closes on Esc and focuses the editor, or `returnFocusTo`', async () => {
			await setUp();
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');
			const opener = { focus: vi.fn() };

			open(child(1));
			pressEsc();
			expect(menu.view).toBeNull();
			expect(focusSpy).toHaveBeenCalled();

			menu.open(child(1), new DOMRect(), config, { returnFocusTo: opener });
			focusSpy.mockClear();
			pressEsc();
			expect(opener.focus).toHaveBeenCalled();
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it('Esc in a nested menu closes only that menu', async () => {
			await setUp(() => [{ title: 'More', items: [containerCommand] }]);
			open(child(1));

			const [more] = menuView().menus;

			more.isOpen = true;
			more.keystrokes.press(keystroke(keyCodes.esc));

			expect(more.isOpen).toBe(false);
			expect(menu.view).not.toBeNull();
		});

		it('closes when clicking outside, but not inside the balloon or an open nested menu', async () => {
			await setUp(() => [{ title: 'More', items: [{ title: 'Even more', items: [containerCommand] }] }]);
			open(child(1));

			const [more, evenMore] = menuView().menus;

			more.isOpen = true;
			evenMore.isOpen = true;

			for (const element of [balloon.view.element!, more.panelView.element!, evenMore.panelView.element!]) {
				element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
				expect(menu.view).not.toBeNull();
			}

			document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
			expect(menu.view).toBeNull();
		});

		it('removes the panels of nested menus from the body collection', async () => {
			await setUp(() => [{ title: 'More', items: [containerCommand] }]);
			open(child(1));

			const [more] = menuView().menus;

			more.isOpen = true;
			expect(editor.ui.view.body.has(more.panelView)).toBe(true);

			menu.hide();
			expect(editor.ui.view.body.has(more.panelView)).toBe(false);
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
			pressEsc();
			expect(onHide).toHaveBeenCalledTimes(2);

			menu.open(child(0), new DOMRect(), config, { onHide });
			document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
			expect(onHide).toHaveBeenCalledTimes(3);

			menu.hide();
			expect(onHide).toHaveBeenCalledTimes(3);
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
			const destroySpy = vi.spyOn(menu.view!, 'destroy');

			menu.destroy();

			expect(destroySpy).toHaveBeenCalled();
			expect(menu.view).toBeNull();
		});
	});

	describe('show()', () => {
		it('shows any view in the balloon, focuses it, and closes when it fires `execute`', async () => {
			await setUp();
			const button = new ButtonView();

			menu.show(button, new DOMRect());

			expect(balloon.visibleView).toBe(button);
			expect(document.activeElement).toBe(button.element);

			button.fire('execute');

			expect(menu.view).toBeNull();
		});

		it('closes on Esc in the view', async () => {
			await setUp();
			const button = new ButtonView();

			menu.show(button, new DOMRect());
			button.element!.dispatchEvent(keydown(keyCodes.esc));

			expect(menu.view).toBeNull();
		});

		it('closes when `isObsolete` returns true after a change', async () => {
			await setUp();

			let isObsolete = false;

			menu.show(new ButtonView(), new DOMRect(), { isObsolete: () => isObsolete });

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

		it('keeps a menu that an executed item opened', async () => {
			await setUp();
			const button = new ButtonView();
			const other = new ButtonView();

			menu.show(button, new DOMRect());
			button.on('execute', () => {
				menu.show(other, new DOMRect());
			});
			button.fire('execute');

			expect(menu.view).toBe(other);
		});
	});
});
