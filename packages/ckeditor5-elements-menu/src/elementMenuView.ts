import {
	DropdownMenuRootListView,
	ListSeparatorView,
	type BodyCollection,
	type DropdownMenuDefinition,
	type ListView,
	type Locale
} from 'ckeditor5';
import { ElementOrPositionCommand, bindButtonToCommand, type ElementOrPosition } from 'ckeditor5-elements-core';
import { type ElementMenuItem, type ElementSubmenu } from './elementMenu.js';

/**
 * The menu of an element: CKEditor's dropdown menu (`DropdownMenuRootListView`), built from commands, submenus and
 * separators.
 *
 * CKEditor builds the menu and handles it: the nested menus (opened on click, hover, or the right arrow; placed where
 * they fit), the keyboard, and right-to-left languages. This view only connects the buttons to the commands: they
 * reflect the command title, icon and {@link ElementOrPositionCommand#getState state} for the target, and execute the
 * command for it. It also adds the separators, which CKEditor's menu definitions do not have.
 *
 * Missing items are skipped, and submenus without items, and separators at the start or the end, or repeated ones.
 * Submenus are enabled when one of their items is. Right-clicking the menu does not open the native context menu.
 */
export default class ElementMenuView extends DropdownMenuRootListView {
	/**
	 * The element or position the commands are executed for.
	 */
	public readonly target: ElementOrPosition;

	/**
	 * Whether the menu has no items: all were missing.
	 */
	public readonly isEmpty: boolean;

	private readonly _commands: Map<string, ElementOrPositionCommand>;
	private readonly _submenus: Map<string, MenuSubmenu>;

	/**
	 * The positions of the separators in each list, by the id of the submenu (`''` for the menu itself).
	 */
	private readonly _separators: Map<string, number[]>;

	constructor(
		locale: Locale,
		bodyCollection: BodyCollection,
		items: readonly (ElementMenuItem | null | undefined)[],
		target: ElementOrPosition
	) {
		const maps: DefinitionMaps = { commands: new Map(), submenus: new Map(), separators: new Map() };
		const menuItems = cleanItems(items);

		super(locale, bodyCollection, createDefinitions(menuItems, '', maps));

		this.target = target;
		this.isEmpty = !menuItems.length;
		this._commands = maps.commands;
		this._submenus = maps.submenus;
		this._separators = maps.separators;
		this.menuPanelClass = 'ck-elements-menu__panel';

		this.extendTemplate({
			attributes: { class: 'ck-elements-menu' },
			on: { contextmenu: this.bindTemplate.to(preventDefault) }
		});
	}

	/**
	 * Renders the menu: CKEditor builds it from the definitions; then the buttons are connected to the commands, and the
	 * separators are added.
	 */
	public override render(): void {
		super.render();

		for (const button of this.buttons) {
			const command = this._commands.get(button.id);

			if (command) {
				bindButtonToCommand(button, command, { withText: true, target: this.target });

				// A toggleable button with a checkable role tells assistive technology whether it is "on" with `aria-checked`.
				button.role = command.isToggleable ? 'menuitemcheckbox' : 'menuitem';
			}
		}

		for (const menu of this.menus) {
			const submenu = this._submenus.get(menu.id);

			if (submenu) {
				menu.buttonView.icon = submenu.icon;
				menu.isEnabled = this._isEnabled(submenu);
			}

			// The panels of nested menus are not inside the menu.
			if (menu.panelView.element) {
				this.listenTo(menu.panelView.element, 'contextmenu', (evt, domEvent: Event) => {
					preventDefault(domEvent);
				});
			}
		}

		this._addSeparators('', this);

		for (const menu of this.menus) {
			this._addSeparators(menu.id, menu.listView);
		}
	}

	private _addSeparators(id: string, list: ListView): void {
		for (const position of this._separators.get(id) ?? []) {
			const separator = new ListSeparatorView(this.locale);

			separator.extendTemplate({ attributes: { role: 'separator' } });
			list.items.add(separator, position);
		}
	}

	private _isEnabled(item: MenuItem): boolean {
		if (item === '|') {
			return false;
		}

		return item instanceof ElementOrPositionCommand
			? item.getState(this.target).isEnabled
			: item.items.some(child => this._isEnabled(child));
	}
}

/**
 * An item of the menu, as it is shown: none is missing.
 */
type MenuItem = ElementOrPositionCommand | MenuSubmenu | '|';

interface MenuSubmenu extends Omit<ElementSubmenu, 'items'> {
	items: MenuItem[];
}

interface DefinitionMaps {
	commands: Map<string, ElementOrPositionCommand>;
	submenus: Map<string, MenuSubmenu>;
	separators: Map<string, number[]>;
}

/**
 * Returns the items without missing ones, submenus without items, and separators at the start or the end, or
 * repeated ones.
 */
function cleanItems(items: readonly (ElementMenuItem | null | undefined)[]): MenuItem[] {
	const result: MenuItem[] = [];

	for (const item of items) {
		const cleaned = item === '|' || item instanceof ElementOrPositionCommand || !item ? item : cleanSubmenu(item);

		if (!cleaned || (cleaned === '|' && (!result.length || result.at(-1) === '|'))) {
			continue;
		}

		result.push(cleaned);
	}

	if (result.at(-1) === '|') {
		result.pop();
	}

	return result;
}

function cleanSubmenu(submenu: ElementSubmenu): MenuSubmenu | null {
	const items = cleanItems(submenu.items);

	return items.length ? { ...submenu, items } : null;
}

/**
 * Creates CKEditor's menu definitions for the items. The ids are paths of positions (e.g. `'2.0'`). Collects the
 * commands and submenus by id, and the positions of the separators by the id of their submenu.
 */
function createDefinitions(items: readonly MenuItem[], parentId: string, maps: DefinitionMaps): DropdownMenuDefinition {
	const definitions: DropdownMenuDefinition = [];
	let position = 0;

	for (const item of items) {
		const id = parentId ? `${parentId}.${String(position)}` : String(position);

		if (item === '|') {
			maps.separators.set(parentId, [...(maps.separators.get(parentId) ?? []), position]);
		} else if (item instanceof ElementOrPositionCommand) {
			maps.commands.set(id, item);
			definitions.push({ id, label: item.title });
		} else {
			maps.submenus.set(id, item);
			definitions.push({ id, menu: item.title, children: createDefinitions(item.items, id, maps) });
		}

		position++;
	}

	return definitions;
}

function preventDefault(domEvent: Event): void {
	domEvent.preventDefault();
}
