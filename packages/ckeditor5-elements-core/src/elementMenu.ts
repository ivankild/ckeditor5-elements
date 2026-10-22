import {
	ButtonView,
	ContextualBalloon,
	Notification,
	Plugin,
	clickOutsideHandler,
	type Editor,
	type ModelElement,
	type RectSource,
	type View
} from 'ckeditor5';
import ElementMenuView from './elementMenuView.js';
import ElementOrPositionButtonView from './elementOrPositionButtonView.js';
import ElementOrPositionCommand from './elementOrPositionCommand.js';
import MenuSeparatorView from './menuSeparatorView.js';
import SubmenuView from './submenuView.js';
import { isInDocument } from './utils.js';

/**
 * A submenu of an element menu. Missing items are skipped, as in the menu.
 */
export interface ElementSubmenu {
	title: string;

	/**
	 * The icon (SVG string) shown next to the title.
	 */
	icon?: string;

	items: (ElementMenuItem | null | undefined)[];
}

/**
 * An item of an element menu:
 *
 * * a command, shown as a button with its `title` and `icon`, enabled and "on" according to its
 *   {@link ElementOrPositionCommand#getState state} for the element,
 * * a submenu,
 * * `'|'`, a separator. Separators at the start or the end of a menu, and repeated ones, are not shown, so a group of
 *   items can start with one.
 */
export type ElementMenuItem = ElementOrPositionCommand | ElementSubmenu | '|';

/**
 * Returns the items of the menu of the given element, e.g. as the `elementContextMenu` or `breadcrumbs.menu` editor
 * config option. Missing items (e.g. commands that are not registered) are skipped. No items means no menu.
 */
export type ElementMenuConfig = (element: ModelElement, editor: Editor) => (ElementMenuItem | null | undefined)[];

/**
 * The options of {@link ElementMenu#show}.
 */
export interface ElementMenuShowOptions {
	/**
	 * The accessible name of the menu.
	 */
	label?: string;

	/**
	 * Called when the document data changes while the menu is open. When it returns `true`, the menu closes, e.g.
	 * because the element it is for was removed.
	 */
	isObsolete?: () => boolean;
}

/**
 * Shows menus in a balloon: the menu of an element, built from commands, submenus and separators (see {@link open}),
 * or a menu of any views (see {@link show}).
 *
 * The element context menu, the breadcrumbs and quick insert show their menus with it.
 *
 * Items that fire `execute` (e.g. buttons) close the menu. Esc and clicking outside close it too.
 */
export default class ElementMenu extends Plugin {
	/**
	 * The currently open menu, if any.
	 */
	public view: ElementMenuView | null = null;

	private _isObsolete: (() => boolean) | null = null;

	public static get requires(): readonly [typeof ContextualBalloon, typeof Notification] {
		// The buttons of the menu report failed commands with notifications.
		return [ContextualBalloon, Notification] as const;
	}

	public static get pluginName(): 'ElementMenu' {
		return 'ElementMenu' as const;
	}

	public init(): void {
		this.listenTo(this.editor.model.document, 'change:data', () => {
			if (this._isObsolete?.()) {
				this.hide();
			}
		});
	}

	/**
	 * Opens the menu of the element next to the target (e.g. a button, or a `DOMRect` in viewport coordinates), with
	 * the items from the config callback. The menu closes when the element is removed.
	 *
	 * Returns `false` when there are no items.
	 */
	public open(
		element: ModelElement,
		target: RectSource,
		config: ElementMenuConfig,
		{ label = this.editor.t('Element menu'), isObsolete }: ElementMenuShowOptions = {}
	): boolean {
		const views = this._createItemViews(config(element, this.editor), element);

		if (!views.length) {
			return false;
		}

		this.show(views, target, { label, isObsolete: () => !isInDocument(element) || !!isObsolete?.() });

		return true;
	}

	/**
	 * Shows a menu with the given views next to the target (e.g. a button, or a `DOMRect` in viewport coordinates).
	 */
	public show(items: View[], target: RectSource, { label, isObsolete }: ElementMenuShowOptions = {}): void {
		this.hide();

		const view = new ElementMenuView(this.editor.locale, { label });

		view.items.addMany(items);

		for (const item of items) {
			this.listenTo(item, 'execute', () => {
				// The item may have opened another menu already (e.g. "Insert before" opens quick insert).
				if (this.view === view) {
					this.hide();
				}
			});
		}

		this.listenTo(view, 'cancel', () => {
			this.hide();
			this.editor.editing.view.focus();
		});

		clickOutsideHandler({
			emitter: view,
			activator: () => this._balloon.visibleView === view,
			contextElements: () => (this._balloon.view.element ? [this._balloon.view.element] : []),
			callback: () => {
				this.hide();
			}
		});

		this._balloon.add({
			view,
			position: { target },
			withArrow: false,
			singleViewMode: true
		});

		this.view = view;
		this._isObsolete = isObsolete ?? null;
		view.focus();
	}

	/**
	 * Hides the open menu, if any.
	 */
	public hide(): void {
		const view = this.view;

		if (!view) {
			return;
		}

		this.view = null;
		this._isObsolete = null;

		for (const item of view.items) {
			this.stopListening(item);
		}

		this.stopListening(view);

		if (this._balloon.hasView(view)) {
			this._balloon.remove(view);
		}

		view.destroy();
	}

	public override destroy(): void {
		this.hide();
		super.destroy();
	}

	/**
	 * Creates the views of menu items, without separators at the start or the end, or repeated ones.
	 */
	private _createItemViews(items: readonly (ElementMenuItem | null | undefined)[], element: ModelElement): View[] {
		const views: View[] = [];

		for (const item of compact(items)) {
			const view = this._createItemView(item, element);
			const previous = views.at(-1);

			if (!view || (view instanceof MenuSeparatorView && (!previous || previous instanceof MenuSeparatorView))) {
				continue;
			}

			views.push(view);
		}

		if (views.at(-1) instanceof MenuSeparatorView) {
			views.pop();
		}

		return views;
	}

	/**
	 * Creates the view of a menu item: a separator; a button for a command; a submenu (with an enabled button only when
	 * one of its items is enabled) for a submenu. Returns `null` for a submenu without items.
	 */
	private _createItemView(item: ElementMenuItem, element: ModelElement): View | null {
		const locale = this.editor.locale;

		if (item === '|') {
			return new MenuSeparatorView(locale);
		}

		if (!(item instanceof ElementOrPositionCommand)) {
			const views = this._createItemViews(item.items, element);

			if (!views.length) {
				return null;
			}

			const submenu = new SubmenuView(locale, item.title, views, { icon: item.icon });

			submenu.buttonView.isEnabled = views.some(
				view =>
					(view instanceof SubmenuView && view.buttonView.isEnabled) ||
					(view instanceof ButtonView && view.isEnabled)
			);

			return submenu;
		}

		const button = new ElementOrPositionButtonView(locale, item, { withText: true, target: element });

		button.role = 'menuitem';

		return button;
	}

	private get _balloon(): ContextualBalloon {
		return this.editor.plugins.get(ContextualBalloon);
	}
}

function compact<T>(items: readonly (T | null | undefined)[]): T[] {
	return items.filter((item): item is T => item !== null && item !== undefined);
}
