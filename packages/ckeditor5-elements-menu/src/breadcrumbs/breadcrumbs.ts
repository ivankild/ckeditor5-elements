import {
	Plugin,
	type DifferItem,
	type Editor,
	type Locale,
	type ModelDocumentChangeEvent,
	type ModelDocumentFragment,
	type ModelElement,
	type ModelRootElement,
	type ViewDocumentFragment,
	type ViewElement,
	type ViewNode
} from 'ckeditor5';
import { isInDocument } from 'ckeditor5-elements-core';
import ElementMenu, { type ElementMenuConfig } from '../elementMenu.js';
import { type BreadcrumbItem, type default as BreadcrumbItemView } from './breadcrumbItemView.js';
import BreadcrumbsView, { type BreadcrumbsViewExecuteEvent } from './breadcrumbsView.js';

/**
 * Converting the data view of a large document takes a while. When the last conversion took longer than this (in
 * milliseconds), the next one waits for {@link THROTTLE_TIME}, so editing elements quickly does not convert every time.
 */
const SLOW_CONVERSION_TIME = 10;
const THROTTLE_TIME = 250;

/**
 * The configuration of the {@link Breadcrumbs} plugin.
 */
export interface BreadcrumbsConfig {
	/**
	 * Returns the items of the menu that opens when a breadcrumb is clicked, for the element of the breadcrumb: the
	 * same items as in the `elementContextMenu` option (commands, submenus and `'|'` separators), so one callback can
	 * serve both. Without this option, breadcrumbs are labels, and cannot be clicked.
	 */
	menu?: ElementMenuConfig;
}

/**
 * The data view of a root, with the model elements mapped to their view elements and back.
 */
interface DataView {
	root: ModelRootElement;
	viewElements: WeakMap<ModelElement, ViewElement>;
	modelElements: WeakMap<ViewElement, ModelElement>;
}

/**
 * Shows the data view structure at the current selection (the elements of the editor data, as in `getData()`), e.g.
 * `aside.note › p`, `ul › li` or `figure.table › table › tbody › tr › td`.
 *
 * Inline elements are items, as any element. CKEditor's text attributes, marks on the text such as its `<strong>`, are
 * skipped. The selected element, e.g. an image, is the innermost item.
 *
 * Place them in a toolbar as the `breadcrumbs` component, or anywhere else using a view from {@link createView}.
 *
 * Clicking is configured only by the `breadcrumbs.menu` editor config option (see {@link BreadcrumbsConfig}): with it,
 * the items are buttons that open the menu of their element, with `ElementMenu`, as the context menu does; without it,
 * they are labels.
 *
 * The data view is converted again only when elements change, not when typing or moving the cursor. For a large
 * document, that happens at most every 250 ms.
 */
export default class Breadcrumbs extends Plugin {
	/**
	 * The elements at the current selection, from the outermost to the innermost one.
	 *
	 * @observable
	 */
	declare public items: readonly BreadcrumbItem[];

	private _dataView: DataView | null = null;
	private _isDataViewOutdated = true;
	private _isConversionSlow = false;
	private _conversionTimeout: ReturnType<typeof setTimeout> | null = null;

	public static get pluginName(): 'Breadcrumbs' {
		return 'Breadcrumbs' as const;
	}

	public static get requires(): readonly [typeof ElementMenu] {
		return [ElementMenu] as const;
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

		// Both selection and data changes.
		this.listenTo<ModelDocumentChangeEvent>(editor.model.document, 'change', () => {
			if (hasElementChanges(editor.model.document.differ.getChanges())) {
				this._isDataViewOutdated = true;
			}

			this._update();
		});
	}

	/**
	 * Creates a breadcrumbs view that follows {@link items}.
	 */
	public createView(locale: Locale = this.editor.locale): BreadcrumbsView {
		const isClickable = typeof this.editor.config.get('breadcrumbs')?.menu === 'function';
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
	 * Updates {@link items} from the current selection, converting the data view first when elements changed.
	 */
	public refresh(): void {
		const root = this.editor.model.document.selection.getFirstPosition()?.root;

		if (root?.is('rootElement') && (this._isDataViewOutdated || root !== this._dataView?.root)) {
			this._convert(root);
		}

		const items = this._getItems();

		if (!areEqual(items, this.items)) {
			this.items = items;
		}
	}

	public override destroy(): void {
		this._cancelConversion();
		super.destroy();
	}

	/**
	 * Refreshes the items after a change. When converting is slow, the data view is converted later, and the items
	 * follow the outdated data view until then.
	 */
	private _update(): void {
		const root = this.editor.model.document.selection.getFirstPosition()?.root;

		if (this._isDataViewOutdated && this._isConversionSlow && root === this._dataView?.root) {
			this._conversionTimeout ??= setTimeout(() => {
				this._conversionTimeout = null;
				this.refresh();
			}, THROTTLE_TIME);
		}

		if (this._conversionTimeout) {
			const items = this._getItems();

			if (!areEqual(items, this.items)) {
				this.items = items;
			}
		} else {
			this.refresh();
		}
	}

	/**
	 * Converts the root to the data view, and maps its model elements to their view elements.
	 */
	private _convert(root: ModelRootElement): void {
		const data = this.editor.data;
		const start = performance.now();
		const viewElements = new WeakMap<ModelElement, ViewElement>();
		const modelElements = new WeakMap<ViewElement, ModelElement>();

		// The mapper of the data pipeline is cleared by the next conversion (e.g. `getData()`), so keep the mapping.
		data.toView(root);

		for (const { item } of this.editor.model.createRangeIn(root)) {
			const viewElement = item.is('element') ? data.mapper.toViewElement(item) : undefined;

			if (item.is('element') && viewElement) {
				viewElements.set(item, viewElement);
				modelElements.set(viewElement, item);
			}
		}

		this._dataView = { root, viewElements, modelElements };
		this._isDataViewOutdated = false;
		this._isConversionSlow = performance.now() - start > SLOW_CONVERSION_TIME;
		this._cancelConversion();
	}

	private _cancelConversion(): void {
		if (this._conversionTimeout) {
			clearTimeout(this._conversionTimeout);
			this._conversionTimeout = null;
		}
	}

	/**
	 * Returns the data view elements at the selection: the view element of the selected element, or of the innermost
	 * element with the selection, and its ancestors.
	 */
	private _getItems(): BreadcrumbItem[] {
		const dataView = this._dataView;
		const selection = this.editor.model.document.selection;
		const position = selection.getFirstPosition();

		if (!dataView || position?.root !== dataView.root) {
			return [];
		}

		// Elements created since the last conversion are not mapped yet; their closest mapped ancestor is used meanwhile.
		let viewElement: ViewElement | undefined;

		for (
			let element: ModelElement | ModelDocumentFragment | null =
				selection.getSelectedElement() ?? position.parent;
			element?.is('element') && !element.is('rootElement') && !viewElement;
			element = element.parent
		) {
			viewElement = dataView.viewElements.get(element);
		}

		return viewElement ? getPath(viewElement).map(node => createItem(node, dataView)) : [];
	}

	private _openMenu(item: BreadcrumbItemView): void {
		const menuItems = this.editor.config.get('breadcrumbs')?.menu;
		const element = item.modelElement;

		if (!menuItems || !item.element || !element || !isInDocument(element)) {
			return;
		}

		item.isExpanded = this.editor.plugins.get(ElementMenu).open(element, item.element, menuItems, {
			// The breadcrumbs may have been replaced while the menu was open.
			returnFocusTo: {
				focus: () => {
					if (item.element?.isConnected) {
						item.focus();
					} else {
						this.editor.editing.view.focus();
					}
				}
			},
			onHide: () => {
				item.isExpanded = false;
			}
		});
	}
}

/**
 * Whether the changes add, remove or change elements. Typing (text changes) does not change the data view structure.
 */
function hasElementChanges(changes: readonly DifferItem[]): boolean {
	return changes.some(change =>
		change.type === 'attribute'
			? Array.from(change.range.getItems({ shallow: true })).some(item => item.is('element'))
			: change.name !== '$text'
	);
}

/**
 * Returns the view element and its ancestors, outermost first, without:
 *
 * * text attributes (attribute elements without a block inside, such as `<strong>` or `<a>`); list items (`<ul>`,
 *   `<li>`) are attribute elements too, but wrap blocks,
 * * elements that are not rendered in the data, such as the paragraph in a list item or a table cell that has only
 *   one paragraph.
 */
function getPath(viewElement: ViewElement): ViewElement[] {
	const path: ViewElement[] = [];
	let hasBlock = false;

	for (let node: ViewNode | ViewDocumentFragment | null = viewElement; node?.is('element'); node = node.parent) {
		const isTextAttribute = node.is('attributeElement') && !hasBlock;

		if (!isTextAttribute && !node.getCustomProperty('dataPipeline:transparentRendering')) {
			path.unshift(node);
		}

		hasBlock ||= node.is('containerElement');
	}

	return path;
}

/**
 * Creates the item of a view element. Its model element is the mapped one, or the closest mapped ancestor of a part of
 * a structure (e.g. a `tbody` is a part of a table). List items have none: they come from the attributes of the blocks
 * in them, not from an element.
 */
function createItem(viewElement: ViewElement, dataView: DataView): BreadcrumbItem {
	let modelElement: ModelElement | null = null;

	for (
		let node: ViewNode | ViewDocumentFragment | null = viewElement;
		node?.is('element') && !modelElement && !node.is('attributeElement');
		node = node.parent
	) {
		modelElement = dataView.modelElements.get(node) ?? null;
	}

	return { label: [viewElement.name, ...viewElement.getClassNames()].join('.'), viewElement, modelElement };
}

function areEqual(a: readonly BreadcrumbItem[], b: readonly BreadcrumbItem[]): boolean {
	return (
		a.length === b.length &&
		a.every((item, index) => item.label === b[index]?.label && item.modelElement === b[index].modelElement)
	);
}
