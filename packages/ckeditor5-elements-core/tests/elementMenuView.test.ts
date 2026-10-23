import {
	DropdownMenuRootListView,
	Paragraph,
	_getModelData,
	_setModelData,
	keyCodes,
	type ClassicEditor,
	type DropdownMenuListItemButtonView,
	type Editor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import { keystroke } from '../../../testUtils/keyboard.js';
import { describeItems } from '../../../testUtils/menu.js';
import ElementCommand from '../src/elementCommand.js';
import { type ElementMenuItem } from '../src/elementMenu.js';
import ElementMenuView from '../src/elementMenuView.js';
import ElementOrPositionCommand from '../src/elementOrPositionCommand.js';

/**
 * A command that is always enabled, also in read-only mode.
 */
class AlwaysEnabledCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = 'Always';
		this.affectsData = false;
	}

	protected override _isEnabledFor(): boolean {
		return true;
	}
}

describe('ElementMenuView', () => {
	let editor: ClassicEditor;
	let container: ElementCommand;
	let plain: ElementOrPositionCommand;
	let view: ElementMenuView | undefined;

	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	function createView(items: ElementMenuItem[], target: ModelElement = child(1)): ElementMenuView {
		view?.element?.remove();
		view?.destroy();
		view = new ElementMenuView(editor.locale, editor.ui.view.body, items, target);
		view.render();
		document.body.append(view.element!);

		return view;
	}

	const button = (label: string): DropdownMenuListItemButtonView => view!.buttons.find(item => item.label === label)!;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container] });

		container = new ElementCommand(editor);
		container.elementName = 'container';
		container.set({ title: 'Container', icon: '<svg id="container"></svg>' });
		editor.commands.add('container', container);

		plain = new ElementOrPositionCommand(editor);
		plain.title = 'Plain';

		_setModelData(editor.model, '<container><paragraph>f[]oo</paragraph></container><paragraph>bar</paragraph>');
	});

	afterEach(async () => {
		view?.element?.remove();
		view?.destroy();
		view = undefined;
		await editor.destroy();
	});

	it("is CKEditor's dropdown menu", () => {
		createView([container]);

		expect(view).toBeInstanceOf(DropdownMenuRootListView);
		expect(view!.element?.getAttribute('role')).toBe('menu');
		expect(view!.element?.classList.contains('ck-elements-menu')).toBe(true);
		expect(view!.target).toBe(child(1));
	});

	describe('command buttons', () => {
		it('show the command title and icon, and its state for the target', () => {
			createView([container, plain]);

			expect(describeItems(view!)).toEqual(['Container', 'Plain']);
			expect(button('Container').icon).toBe('<svg id="container"></svg>');
			expect(button('Container').isEnabled).toBe(true);
			expect(button('Container').isOn).toBe(false);
			expect(container.isOn).toBe(true);
		});

		it('are checkable menu items for toggleable commands, plain menu items otherwise', () => {
			createView([container, plain], child(0).getChild(0) as ModelElement);

			expect(button('Container').element?.getAttribute('role')).toBe('menuitemcheckbox');
			expect(button('Container').element?.getAttribute('aria-checked')).toBe('true');
			expect(button('Plain').element?.getAttribute('role')).toBe('menuitem');
			expect(button('Plain').element?.hasAttribute('aria-checked')).toBe(false);
		});

		it('follow the state as it changes', () => {
			createView([container]);

			editor.enableReadOnlyMode('test');

			expect(button('Container').isEnabled).toBe(false);
		});

		it('execute the command for the target, and fire `menu:execute`', () => {
			const executeSpy = vi.fn();

			createView([container]);
			view!.on('menu:execute', executeSpy);
			button('Container').element!.click();

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><container><paragraph>bar</paragraph></container>'
			);
			expect(executeSpy).toHaveBeenCalled();
		});
	});

	describe('submenus', () => {
		it("are CKEditor's nested menus, with their icon", () => {
			createView([
				{
					title: 'More',
					icon: '<svg id="more"></svg>',
					items: [plain, { title: 'Even more', items: [container] }]
				}
			]);

			const [more, evenMore] = view!.menus;

			expect(describeItems(view!)).toEqual(['More ›']);
			expect(describeItems(more.listView)).toEqual(['Plain', 'Even more ›']);
			expect(describeItems(evenMore.listView)).toEqual(['Container']);
			expect(more.buttonView.icon).toBe('<svg id="more"></svg>');
		});

		it('are enabled when one of their items is, also in a nested submenu', () => {
			editor.enableReadOnlyMode('test');
			createView([
				{
					title: 'Enabled',
					items: [container, { title: 'Nested', items: [new AlwaysEnabledCommand(editor)] }]
				},
				{ title: 'Disabled', items: [container] }
			]);

			expect(view!.menus.map(menu => [menu.buttonView.label, menu.isEnabled])).toEqual([
				['Enabled', true],
				['Nested', true],
				['Disabled', false]
			]);
		});

		it('open on hover, next to their item, in a panel in the body collection', () => {
			createView([plain, { title: 'More', items: [container] }]);

			const [more] = view!.menus;

			more.element!.parentElement!.dispatchEvent(new MouseEvent('mouseenter'));

			expect(more.isOpen).toBe(true);
			expect(editor.ui.view.body.has(more.panelView)).toBe(true);
			expect(more.panelView.element?.classList.contains('ck-elements-menu__panel')).toBe(true);
		});

		it('execute a nested command, and fire `menu:execute`', () => {
			const executeSpy = vi.fn();

			const paragraph = child(1);

			createView([{ title: 'More', items: [container] }]);
			view!.on('menu:execute', executeSpy);
			view!.menus[0].isOpen = true;
			button('Container').element!.click();

			expect(paragraph.parent?.is('element', 'container')).toBe(true);
			expect(executeSpy).toHaveBeenCalled();
		});
	});

	describe('separators', () => {
		it('are shown between items, in the menu and in submenus', () => {
			createView([plain, '|', container, '|', { title: 'More', items: [plain, '|', container] }]);

			expect(describeItems(view!)).toEqual(['Plain', '|', 'Container', '|', 'More ›']);
			expect(describeItems(view!.menus[0].listView)).toEqual(['Plain', '|', 'Container']);
			expect(view!.element?.querySelector('.ck-list__separator')?.getAttribute('role')).toBe('separator');
		});

		it('are skipped by the arrow keys', () => {
			createView([plain, '|', container]);

			view!.focus();
			view!.keystrokes.press(keystroke(keyCodes.arrowdown));

			expect(document.activeElement).toBe(button('Container').element);
		});
	});

	it('prevents the native context menu in the menu and in the panels of nested menus', () => {
		createView([{ title: 'More', items: [container] }]);
		view!.menus[0].isOpen = true;

		for (const element of [view!.element!, view!.menus[0].panelView.element!]) {
			const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

			element.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}
	});
});
