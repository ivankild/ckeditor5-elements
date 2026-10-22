import { ButtonView, type Locale, type ViewElement } from 'ckeditor5';

/**
 * A single breadcrumb that can be clicked: a button labelled with one view element, e.g. `section.title`.
 */
export default class BreadcrumbItemView extends ButtonView {
	/**
	 * The view element this item stands for.
	 */
	public readonly viewElement: ViewElement;

	constructor(
		locale: Locale | undefined,
		{ label, viewElement }: BreadcrumbItem,
		{ isCurrent = false }: BreadcrumbItemViewOptions = {}
	) {
		super(locale);

		this.viewElement = viewElement;

		this.set({ label, withText: true });

		this.extendTemplate({
			attributes: {
				class: 'ck-elements-breadcrumbs__item',
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
 * A breadcrumb: a view element and its label.
 */
export interface BreadcrumbItem {
	label: string;
	viewElement: ViewElement;
}
