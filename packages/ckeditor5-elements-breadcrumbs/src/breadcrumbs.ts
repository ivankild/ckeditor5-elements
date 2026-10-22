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
 * Shows the view element structure at the current selection, e.g. `section.title › p`.
 *
 * Attribute elements (text attributes such as `<strong>`) and the editable root are skipped.
 *
 * Place them in a toolbar as the `breadcrumbs` component, or anywhere else using a view from {@link #createView}.
 *
 * Each item is a button. When the `ElementContextMenu` plugin (from `ckeditor5-elements-context-menu`) is loaded,
 * clicking it opens the menu of its element. There is no dependency on that package: the plugin is looked up by name.
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
	 * Creates a breadcrumbs view that follows {@link #items}.
	 */
	public createView(locale: Locale = this.editor.locale): BreadcrumbsView {
		const view = new BreadcrumbsView(locale);

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
	 * Updates {@link #items} from the current view selection.
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
		const plugins = this.editor.plugins;
		const contextMenu = plugins.has('ElementContextMenu') ? plugins.get('ElementContextMenu') : null;
		const element = this._getModelElement(item.viewElement);

		if (item.element && element && contextMenu && isElementMenu(contextMenu)) {
			contextMenu.open(element, item.element);
		}
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
 * The part of the `ElementContextMenu` plugin the breadcrumbs use.
 */
interface ElementMenu {
	open(element: ModelElement, target: RectSource): boolean;
}

function isElementMenu(plugin: object): plugin is ElementMenu {
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
