import { ButtonView, type Locale, type ModelElement, type ViewElement } from 'ckeditor5';

/**
 * A single breadcrumb that can be clicked: a button labelled with one element of the data view, e.g. `section.title`.
 * It opens the menu of its element (`aria-haspopup`), and is `aria-expanded` while the menu is open.
 */
export default class BreadcrumbItemView extends ButtonView {
	/**
	 * The data view element this item stands for.
	 */
	public readonly viewElement: ViewElement;

	/**
	 * The model element the menu of this item is for.
	 */
	public readonly modelElement: ModelElement | null;

	/**
	 * Whether the menu of this item is open.
	 *
	 * @observable
	 */
	declare public isExpanded: boolean;

	constructor(
		locale: Locale | undefined,
		{ label, viewElement, modelElement }: BreadcrumbItem,
		{ isCurrent = false }: BreadcrumbItemViewOptions = {}
	) {
		super(locale);

		this.viewElement = viewElement;
		this.modelElement = modelElement;

		this.set({ label, withText: true, isExpanded: false });

		this.extendTemplate({
			attributes: {
				class: 'ck-elements-breadcrumbs__item',
				'aria-haspopup': 'menu',
				'aria-expanded': this.bindTemplate.to('isExpanded', value => String(value)),
				...(isCurrent ? { 'aria-current': 'location' } : {})
			}
		});
	}
}

/**
 * The options of {@link BreadcrumbItemView} and {@link BreadcrumbLabelView}.
 */
export interface BreadcrumbItemViewOptions {
	/**
	 * Whether the item is the innermost element (where the cursor is). It is marked with `aria-current="location"`.
	 */
	isCurrent?: boolean;
}

/**
 * A breadcrumb: an element of the data view, its label, and the model element it belongs to.
 */
export interface BreadcrumbItem {
	label: string;

	/**
	 * The data view element (as in the editor data, e.g. `getData()`).
	 */
	viewElement: ViewElement;

	/**
	 * The model element of the view element: the mapped one, or for a part of a structure (e.g. a `tbody`), the closest
	 * mapped ancestor (the table). `null` for list items (`ul`, `li`), which come from block attributes.
	 */
	modelElement: ModelElement | null;
}
