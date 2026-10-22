import {
	ContextualBalloon,
	Plugin,
	clickOutsideHandler,
	type Editor,
	type ModelElement,
	type RectSource,
	type View,
	type ViewElement
} from 'ckeditor5';
import ContextMenuObserver, { type ViewDocumentContextMenuEvent } from './contextMenuObserver.js';
import ElementClipboard from './clipboard/elementClipboard.js';
import { createElementClipboardItems } from './clipboard/elementClipboardItems.js';
import ElementContextMenuView from './elementContextMenuView.js';

/**
 * Returns the views shown in the context menu of the given element. An empty array means the native context menu.
 */
export type ElementContextMenuItems = (element: ModelElement, editor: Editor) => View[];

/**
 * Shows a context menu for the model element the user right-clicked.
 *
 * By default, the menu shows the items added by other plugins with {@link #addItems} (e.g. "Insert" from quick insert),
 * followed by the clipboard actions. The `elementContextMenu` editor config option replaces them; use
 * {@link #getDefaultItems} in it to extend the defaults instead.
 *
 * Items that fire `execute` (e.g. buttons) close the menu.
 */
export default class ElementContextMenu extends Plugin {
	/**
	 * The currently open menu, if any.
	 */
	public view: ElementContextMenuView | null = null;

	private readonly _itemProviders: ElementContextMenuItems[] = [];

	public static get requires(): readonly [typeof ContextualBalloon, typeof ElementClipboard] {
		return [ContextualBalloon, ElementClipboard] as const;
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
	 * Adds items to the default menu. The callbacks are called in the order they were added, before the clipboard
	 * actions.
	 */
	public addItems(callback: ElementContextMenuItems): void {
		this._itemProviders.push(callback);
	}

	/**
	 * Returns the default items for the element: the ones added with {@link #addItems}, then the clipboard actions.
	 */
	public getDefaultItems(element: ModelElement): View[] {
		return [
			...this._itemProviders.flatMap(callback => callback(element, this.editor)),
			...createElementClipboardItems(element, this.editor)
		];
	}

	/**
	 * Opens the menu of the given element next to the target (e.g. a button, or a `DOMRect` in viewport coordinates),
	 * with the items from the `elementContextMenu` config option, or the {@link #getDefaultItems default items}.
	 *
	 * Returns `false` when there are no items, so the caller can let the native context menu show instead.
	 */
	public open(element: ModelElement, target: RectSource): boolean {
		const config = this.editor.config.get('elementContextMenu');
		const items = typeof config === 'function' ? config(element, this.editor) : this.getDefaultItems(element);

		if (!items.length) {
			return false;
		}

		this.show(items, target);

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

	private get _balloon(): ContextualBalloon {
		return this.editor.plugins.get(ContextualBalloon);
	}
}
