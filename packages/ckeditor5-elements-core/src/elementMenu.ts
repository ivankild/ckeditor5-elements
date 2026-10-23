import {
	ContextualBalloon,
	DropdownMenuRootListView,
	KeystrokeHandler,
	Notification,
	Plugin,
	clickOutsideHandler,
	type Editor,
	type FocusableView,
	type ModelElement,
	type RectSource
} from 'ckeditor5';
import ElementMenuView from './elementMenuView.js';
import ElementOrPositionCommand from './elementOrPositionCommand.js';
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
 * The options of {@link ElementMenu#open} and {@link ElementMenu#show}.
 */
export interface ElementMenuShowOptions {
	/**
	 * The accessible name of the menu of an element (see {@link ElementMenu#open}). Defaults to "Element menu".
	 */
	label?: string;

	/**
	 * Called when the document data changes while the menu is open. When it returns `true`, the menu closes, e.g.
	 * because the element it is for was removed.
	 */
	isObsolete?: () => boolean;

	/**
	 * What gets the focus when the menu is closed with Esc, e.g. the button that opened the menu. Defaults to the editor.
	 */
	returnFocusTo?: { focus(): void };

	/**
	 * Called when the menu closes, for any reason: Esc, a click outside, an executed item, or another menu replacing it.
	 */
	onHide?: () => void;
}

/**
 * Shows menus in a balloon: the menu of an element, built from commands, submenus and separators (see {@link open}),
 * or any view, e.g. the quick insert search (see {@link show}).
 *
 * The element context menu, the breadcrumbs and quick insert show their menus with it. The menu of an element is
 * CKEditor's dropdown menu (see {@link ElementMenuView}).
 *
 * Executing an item closes the menu. Esc and clicking outside close it too; Esc returns the focus to the editor, or to
 * {@link ElementMenuShowOptions.returnFocusTo}.
 */
export default class ElementMenu extends Plugin {
	/**
	 * The view in the open menu, if any.
	 */
	public view: FocusableView | null = null;

	private _keystrokes: KeystrokeHandler | null = null;
	private _isObsolete: (() => boolean) | null = null;
	private _onHide: (() => void) | null = null;

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
		{ label = this.editor.t('Element menu'), isObsolete, ...options }: ElementMenuShowOptions = {}
	): boolean {
		const items = cleanItems(config(element, this.editor));

		if (!items.length) {
			return false;
		}

		const view = new ElementMenuView(this.editor.locale, this.editor.ui.view.body, items, element);

		view.ariaLabel = label;

		this.show(view, target, {
			...options,
			isObsolete: () => !isInDocument(element) || !!isObsolete?.()
		});

		return true;
	}

	/**
	 * Shows the view (e.g. a menu) next to the target (e.g. a button, or a `DOMRect` in viewport coordinates), and
	 * focuses it. The menu closes when the view, or an item of CKEditor's dropdown menu in it, fires `execute`.
	 */
	public show(
		view: FocusableView,
		target: RectSource,
		{ isObsolete, returnFocusTo, onHide }: ElementMenuShowOptions = {}
	): void {
		this.hide();

		const close = (): void => {
			// The item may have opened another menu already (e.g. "Insert before" opens quick insert).
			if (this.view === view) {
				this.hide();
			}
		};

		this.listenTo(view, 'execute', close);
		this.listenTo(view, 'menu:execute', close);

		clickOutsideHandler({
			emitter: view,
			activator: () => this._balloon.visibleView === view,
			// The open nested menus are in panels outside the balloon.
			contextElements: () => [this._balloon.view.element, ...getOpenPanels(view)].filter(element => !!element),
			callback: () => {
				this.hide();
			}
		});

		this._balloon.add({
			view,
			position: { target },
			withArrow: false,
			singleViewMode: true,
			// Views that other plugins add to the balloon meanwhile (e.g. an element toolbar, when the selection moves
			// into its element) go to their own stack, so they do not cover the menu.
			stackId: 'elementMenu'
		});

		const keystrokes = new KeystrokeHandler();

		// Esc in a nested menu closes only that menu.
		keystrokes.set('Esc', (data, cancel) => {
			this.hide();
			(returnFocusTo ?? this.editor.editing.view).focus();
			cancel();
		});

		if (view.element) {
			keystrokes.listenTo(view.element);
		}

		this.view = view;
		this._keystrokes = keystrokes;
		this._isObsolete = isObsolete ?? null;
		this._onHide = onHide ?? null;
		view.focus();
	}

	/**
	 * Hides the open menu, if any.
	 */
	public hide(): void {
		const view = this.view;
		const onHide = this._onHide;

		if (!view) {
			return;
		}

		this._keystrokes?.destroy();
		this.view = null;
		this._keystrokes = null;
		this._isObsolete = null;
		this._onHide = null;
		this.stopListening(view);

		if (this._balloon.hasView(view)) {
			this._balloon.remove(view);
		}

		view.destroy();
		onHide?.();
	}

	public override destroy(): void {
		this.hide();
		super.destroy();
	}

	private get _balloon(): ContextualBalloon {
		return this.editor.plugins.get(ContextualBalloon);
	}
}

/**
 * Returns the items without missing ones, submenus without items, and separators at the start or the end, or
 * repeated ones.
 */
function cleanItems(items: readonly (ElementMenuItem | null | undefined)[]): ElementMenuItem[] {
	const result: ElementMenuItem[] = [];

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

function cleanSubmenu(submenu: ElementSubmenu): ElementSubmenu | null {
	const items = cleanItems(submenu.items);

	return items.length ? { ...submenu, items } : null;
}

/**
 * Returns the panels of the open nested menus of CKEditor's dropdown menu.
 */
function getOpenPanels(view: FocusableView): (HTMLElement | null)[] {
	return view instanceof DropdownMenuRootListView
		? view.menus.filter(menu => menu.isOpen).map(menu => menu.panelView.element)
		: [];
}
