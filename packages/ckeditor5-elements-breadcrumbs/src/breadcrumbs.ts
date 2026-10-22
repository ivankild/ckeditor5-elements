import {
	Plugin,
	type Editor,
	type Locale,
	type ModelElement,
	type RectSource,
	type ViewDocumentFragment,
	type ViewElement,
	type ViewNode
} from 'ckeditor5';
import { type BreadcrumbItem, type default as BreadcrumbItemView } from './breadcrumbItemView.js';
import BreadcrumbsView, { type BreadcrumbsViewExecuteEvent } from './breadcrumbsView.js';

/**
 * The configuration of the {@link Breadcrumbs} plugin.
 */
export interface BreadcrumbsConfig {
	/**
	 * Returns the items of the menu that opens when a breadcrumb is clicked, for the element of the breadcrumb: the
	 * same items as in the `elementContextMenu` option (commands, submenus and `'|'` separators; see `ElementMenuConfig`
	 * in `ckeditor5-elements-core`), so one callback can serve both. Without this option, or without a loaded
	 * `ElementMenu` plugin, breadcrumbs cannot be clicked.
	 */
	menu?: BreadcrumbsMenuItems;
}

/**
 * Shows the view element structure at the current selection, e.g. `section.title › p`.
 *
 * Attribute elements (text attributes such as `<strong>`) and the editable root are skipped.
 *
 * Place them in a toolbar as the `breadcrumbs` component, or anywhere else using a view from {@link createView}.
 *
 * Clicking is configured only by the `breadcrumbs.menu` editor config option (see {@link BreadcrumbsConfig}): with it,
 * the items are buttons that open a menu of their element; without it, they are labels. The menu is shown by the
 * `ElementMenu` plugin from `ckeditor5-elements-core` (also loaded by `ElementContextMenu`), which is used through the
 * {@link BreadcrumbsMenu} interface, without a dependency on that package.
 */
export default class Breadcrumbs extends Plugin {
	/**
	 * The elements at the current selection, from the outermost to the innermost one.
	 *
	 * @observable
	 */
	declare public items: readonly BreadcrumbItem[];

	public static get pluginName(): 'Breadcrumbs' {
		return 'Breadcrumbs' as const;
	}

	constructor(editor: Editor) {
		super(editor);

		this.set('items', []);
	}

	public init(): void {
		const editor = this.editor;

		editor.ui.componentFactory.add('breadcrumbs', locale => this.createView(locale));

		this.listenTo(editor.ui, 'ready', () => {
			this.refresh();
		});

		this.listenTo(editor.editing.view, 'render', () => {
			this.refresh();
		});
	}

	/**
	 * Creates a breadcrumbs view that follows {@link items}.
	 */
	public createView(locale: Locale = this.editor.locale): BreadcrumbsView {
		const isClickable = typeof this.editor.config.get('breadcrumbs')?.menu === 'function' && !!this._getMenu();
		const view = new BreadcrumbsView(locale, { isClickable });

		view.setItems(this.items);
		view.listenTo(this, 'change:items', () => {
			view.setItems(this.items);
		});

		view.on<BreadcrumbsViewExecuteEvent>('execute', (evt, item) => {
			this._openMenu(item);
		});

		return view;
	}

	/**
	 * Updates {@link items} from the current view selection.
	 */
	public refresh(): void {
		const position = this.editor.editing.view.document.selection.getFirstPosition();
		const elements = position ? position.getAncestors().filter(isStructuralElement) : [];
		const items = elements.map(viewElement => ({ label: getLabel(viewElement), viewElement }));

		if (!areEqual(items, this.items)) {
			this.items = items;
		}
	}

	private _openMenu(item: BreadcrumbItemView): void {
		const menuItems = this.editor.config.get('breadcrumbs')?.menu;
		const menu = this._getMenu();
		const element = this._getModelElement(item.viewElement);

		if (menuItems && menu && item.element && element) {
			menu.open(element, item.element, menuItems);
		}
	}

	/**
	 * Returns the plugin that shows menus: `ElementMenu`, when it is loaded.
	 */
	private _getMenu(): BreadcrumbsMenu | null {
		const plugins = this.editor.plugins;
		const plugin = plugins.has('ElementMenu') ? plugins.get('ElementMenu') : null;

		return plugin && isBreadcrumbsMenu(plugin) ? plugin : null;
	}

	/**
	 * Returns the closest model element mapped to the view element or its ancestors, skipping the root.
	 */
	private _getModelElement(viewElement: ViewElement): ModelElement | null {
		const mapper = this.editor.editing.mapper;

		for (let node: ViewElement | null = viewElement; node; node = node.parent?.is('element') ? node.parent : null) {
			const element = mapper.toModelElement(node);

			if (element) {
				return element.is('rootElement') ? null : element;
			}
		}

		return null;
	}
}

/**
 * The part of the `ElementMenu` plugin (from `ckeditor5-elements-core`) the breadcrumbs use.
 * The breadcrumbs do not depend on that package: the plugin is looked up by name and checked against this interface.
 */
export interface BreadcrumbsMenu {
	open(element: ModelElement, target: RectSource, items: BreadcrumbsMenuItems): boolean;
}

/**
 * Returns the items of the menu of an element. The breadcrumbs pass them to the menu plugin as they are; for
 * `ElementMenu`, they are commands, submenus and `'|'` separators.
 */
export type BreadcrumbsMenuItems = (element: ModelElement, editor: Editor) => readonly unknown[];

function isBreadcrumbsMenu(plugin: object): plugin is BreadcrumbsMenu {
	return 'open' in plugin && typeof plugin.open === 'function';
}

function isStructuralElement(node: ViewNode | ViewDocumentFragment): node is ViewElement {
	return node.is('element') && !node.is('attributeElement') && !node.is('rootElement');
}

function getLabel(element: ViewElement): string {
	return [element.name, ...element.getClassNames()].join('.');
}

function areEqual(a: readonly BreadcrumbItem[], b: readonly BreadcrumbItem[]): boolean {
	return (
		a.length === b.length &&
		a.every((item, index) => item.label === b[index]?.label && item.viewElement === b[index].viewElement)
	);
}
