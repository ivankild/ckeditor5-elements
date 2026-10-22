import {
	FocusCycler,
	FocusTracker,
	KeystrokeHandler,
	View,
	isFocusable,
	type FocusableView,
	type Locale,
	type ViewCollection
} from 'ckeditor5';

/**
 * The options of {@link ElementMenuView}.
 */
export interface ElementMenuViewOptions {
	/**
	 * The accessible name of the menu (`aria-label`).
	 */
	label?: string;
}

/**
 * A vertical menu of views. Arrow keys and Tab move the focus between focusable items, Esc fires `cancel`.
 *
 * Only one submenu (an item with an observable `isOpen`, such as {@link SubmenuView}) is open at a time: opening one
 * closes the others. Right-clicking the menu does not open the native context menu.
 */
export default class ElementMenuView extends View {
	/**
	 * The menu items.
	 */
	public readonly items: ViewCollection;

	/**
	 * Tracks the focus within the menu.
	 */
	public readonly focusTracker = new FocusTracker();

	/**
	 * Handles the keystrokes within the menu.
	 */
	public readonly keystrokes = new KeystrokeHandler();

	private readonly _focusables: ViewCollection<FocusableView>;
	private readonly _focusCycler: FocusCycler;

	constructor(locale?: Locale, { label }: ElementMenuViewOptions = {}) {
		super(locale);

		this.items = this.createCollection();
		this._focusables = this.createCollection();

		this._focusCycler = new FocusCycler({
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: ['arrowup', 'shift+tab'],
				focusNext: ['arrowdown', 'tab']
			}
		});

		this.keystrokes.set('Esc', (data, cancel) => {
			this.fire('cancel');
			cancel();
		});

		this.setTemplate({
			tag: 'div',
			attributes: {
				class: ['ck', 'ck-elements-menu'],
				role: 'menu',
				tabindex: '-1',
				...(label ? { 'aria-label': label } : {})
			},
			children: this.items,
			on: {
				// A menu inside a menu would be confusing. This also covers the keyboard (the menu key, Shift+F10), which
				// fires `contextmenu` on the focused menu item.
				contextmenu: this.bindTemplate.to(domEvent => {
					domEvent.preventDefault();
				})
			}
		});
	}

	/**
	 * Renders the menu and registers its items for focus tracking and keyboard navigation.
	 */
	public override render(): void {
		super.render();

		for (const item of this.items) {
			this._registerItem(item);
		}

		this.items.on('add', (evt, item: View) => {
			this._registerItem(item);
		});

		if (this.element) {
			this.keystrokes.listenTo(this.element);
		}
	}

	/**
	 * Focuses the first focusable item.
	 */
	public focus(): void {
		// Not `focusFirst()`: it does nothing while the focus tracker (which notices blur asynchronously) still considers
		// the first item focused, e.g. right after the focus moved out of the menu and back.
		this._focusCycler.first?.focus();
	}

	/**
	 * Destroys the menu, its focus tracker and keystroke handler.
	 */
	public override destroy(): void {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	private _registerItem(item: View): void {
		if (isFocusable(item)) {
			this._focusables.add(item);
		}

		if (item.element) {
			this.focusTracker.add(item.element);
		}

		if (isSubmenu(item)) {
			this.listenTo(item, 'change:isOpen', (evt, name, isOpen: boolean) => {
				if (isOpen) {
					this._closeSubmenus(item);
				}
			});
		}
	}

	/**
	 * Closes the open submenus, except the given one.
	 */
	private _closeSubmenus(except: View): void {
		for (const item of this.items) {
			if (item !== except && isSubmenu(item)) {
				item.isOpen = false;
			}
		}
	}
}

/**
 * Whether the item opens a nested menu, like {@link SubmenuView} (not imported here, as it uses this view).
 */
function isSubmenu(item: View): item is View & { isOpen: boolean } {
	return 'isOpen' in item && typeof item.isOpen === 'boolean';
}
