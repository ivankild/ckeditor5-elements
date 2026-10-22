import {
	ButtonView,
	ContextualBalloon,
	Plugin,
	clickOutsideHandler,
	type Editor,
	type ModelElement,
	type RectSource,
	type View,
	type ViewElement
} from 'ckeditor5';
import { ElementOrPositionButtonView, ElementOrPositionCommand } from 'ckeditor5-elements-ui';
import ContextMenuObserver, { type ViewDocumentContextMenuEvent } from './contextMenuObserver.js';
import ElementContextMenuView from './elementContextMenuView.js';
import MenuSeparatorView from './menuSeparatorView.js';
import SubmenuView from './submenuView.js';

/**
 * A submenu in the element context menu. Missing items are skipped, as in the menu.
 */
export interface ElementContextSubmenu {
	title: string;
	items: (ElementContextMenuItem | null | undefined)[];
}

/**
 * An item of the element context menu:
 *
 * * a command, shown as a button with its `title` and `icon`, enabled and "on" according to its
 *   {@link ElementOrPositionCommand#getState state} for the element,
 * * a submenu,
 * * `'|'`, a separator. Separators at the start or the end of a menu, and repeated ones, are not shown, so a group of
 *   items can start with one.
 */
export type ElementContextMenuItem = ElementOrPositionCommand | ElementContextSubmenu | '|';

/**
 * The `elementContextMenu` editor config option: returns the items of the context menu of the given element. Missing
 * items (e.g. commands that are not registered) are skipped. No items means the native context menu.
 */
export type ElementContextMenuItems = (
	element: ModelElement,
	editor: Editor
) => (ElementContextMenuItem | null | undefined)[];

/**
 * Shows a context menu for the model element the user right-clicked.
 *
 * The menu items are commands (see {@link ElementContextMenuItem}): the command knows its title, icon and whether it
 * is enabled for the element, and executing the item executes the command for the element.
 *
 * The items come from the `elementContextMenu` editor config option only. Without it, or when it returns no items
 * for an element, the native context menu shows.
 */
export default class ElementContextMenu extends Plugin {
	/**
	 * The currently open menu, if any.
	 */
	public view: ElementContextMenuView | null = null;

	public static get requires(): readonly [typeof ContextualBalloon] {
		return [ContextualBalloon] as const;
	}

	public static get pluginName(): 'ElementContextMenu' {
		return 'ElementContextMenu' as const;
	}

	public init(): void {
		const editor = this.editor;
		const editingView = editor.editing.view;

		editingView.addObserver(ContextMenuObserver);

		this.listenTo<ViewDocumentContextMenuEvent>(editingView.document, 'contextmenu', (evt, data) => {
			const element = this.getModelElement(data.target);

			if (element && this.open(element, new DOMRect(data.domEvent.clientX, data.domEvent.clientY, 0, 0))) {
				data.preventDefault();
			}
		});
	}

	/**
	 * Opens the menu of the given element next to the target (e.g. a button, or a `DOMRect` in viewport coordinates),
	 * with the items from the `elementContextMenu` config option, or from the given callback (e.g. another config
	 * option, such as `breadcrumbs.menu`).
	 *
	 * Returns `false` when there are no items, so the caller can let the native context menu show instead.
	 */
	public open(element: ModelElement, target: RectSource, items?: ElementContextMenuItems): boolean {
		const callback = items ?? this.editor.config.get('elementContextMenu');
		const views =
			typeof callback === 'function' ? this._createItemViews(callback(element, this.editor), element) : [];

		if (!views.length) {
			return false;
		}

		this.show(views, target);

		return true;
	}

	/**
	 * Shows a menu with the given items next to the target (e.g. a button, or a `DOMRect` in viewport coordinates).
	 */
	public show(items: View[], target: RectSource): void {
		this.hide();

		const view = new ElementContextMenuView(this.editor.locale);

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
	 * Returns the closest model element mapped to the given view element or its ancestors, skipping the root.
	 */
	public getModelElement(viewElement: ViewElement): ModelElement | null {
		const mapper = this.editor.editing.mapper;

		for (let node: ViewElement | null = viewElement; node; node = node.parent?.is('element') ? node.parent : null) {
			const element = mapper.toModelElement(node);

			if (element) {
				return element.is('rootElement') ? null : element;
			}
		}

		return null;
	}

	/**
	 * Creates the views of menu items, without separators at the start or the end, or repeated ones.
	 */
	private _createItemViews(
		items: readonly (ElementContextMenuItem | null | undefined)[],
		element: ModelElement
	): View[] {
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
	private _createItemView(item: ElementContextMenuItem, element: ModelElement): View | null {
		const locale = this.editor.locale;

		if (item === '|') {
			return new MenuSeparatorView(locale);
		}

		if (!(item instanceof ElementOrPositionCommand)) {
			const views = this._createItemViews(item.items, element);

			if (!views.length) {
				return null;
			}

			const submenu = new SubmenuView(locale, item.title, views);

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
