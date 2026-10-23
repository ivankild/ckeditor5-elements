import {
	DropdownMenuRootListView,
	ListSeparatorView,
	type BodyCollection,
	type DropdownMenuDefinition,
	type ListView,
	type Locale
} from 'ckeditor5';
import { type ElementMenuItem, type ElementSubmenu } from './elementMenu.js';
import { bindButtonToCommand } from './elementOrPositionButtonView.js';
import ElementOrPositionCommand, { type ElementOrPosition } from './elementOrPositionCommand.js';

/**
 * The menu of an element: CKEditor's dropdown menu (`DropdownMenuRootListView`), built from commands, submenus and
 * separators.
 *
 * CKEditor builds the menu and handles it: the nested menus (opened on click, hover, or the right arrow; placed where
 * they fit), the keyboard, and right-to-left languages. This view only connects the buttons to the commands: they
 * reflect the command title, icon and {@link ElementOrPositionCommand#getState state} for the target, and execute the
 * command for it. It also adds the separators, which CKEditor's menu definitions do not have.
 *
 * Submenus are enabled when one of their items is. Right-clicking the menu does not open the native context menu.
 */
export default class ElementMenuView extends DropdownMenuRootListView {
	/**
	 * The element or position the commands are executed for.
	 */
	public readonly target: ElementOrPosition;

	private readonly _commands: Map<string, ElementOrPositionCommand>;
	private readonly _submenus: Map<string, ElementSubmenu>;

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

		super(locale, bodyCollection, createDefinitions(items, '', maps));

		this.target = target;
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

	private _isEnabled(item: ElementMenuItem): boolean {
		if (item === '|') {
			return false;
		}

		return item instanceof ElementOrPositionCommand
			? item.getState(this.target).isEnabled
			: item.items.some(child => !!child && this._isEnabled(child));
	}
}

interface DefinitionMaps {
	commands: Map<string, ElementOrPositionCommand>;
	submenus: Map<string, ElementSubmenu>;
	separators: Map<string, number[]>;
}

/**
 * Creates CKEditor's menu definitions for the items. The ids are paths of positions (e.g. `'2.0'`). Collects the
 * commands and submenus by id, and the positions of the separators by the id of their submenu.
 */
function createDefinitions(
	items: readonly (ElementMenuItem | null | undefined)[],
	parentId: string,
	maps: DefinitionMaps
): DropdownMenuDefinition {
	const definitions: DropdownMenuDefinition = [];
	let position = 0;

	for (const item of items) {
		const id = parentId ? `${parentId}.${String(position)}` : String(position);

		if (!item) {
			continue;
		}

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
