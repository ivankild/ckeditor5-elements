import { View, type Locale, type ModelElement, type ViewElement } from 'ckeditor5';
import { type BreadcrumbItem, type BreadcrumbItemViewOptions } from './breadcrumbItemView.js';

/**
 * A single breadcrumb that cannot be clicked: the label of one element of the data view, e.g. `section.title`.
 *
 * It can be focused (but is not in the Tab order), so keyboard users can reach it in a toolbar.
 */
export default class BreadcrumbLabelView extends View {
	/**
	 * The data view element this item stands for.
	 */
	public readonly viewElement: ViewElement;

	/**
	 * The model element of the view element, if any.
	 */
	public readonly modelElement: ModelElement | null;

	/**
	 * The label of the element.
	 *
	 * @observable
	 */
	declare public label: string;

	constructor(
		locale: Locale | undefined,
		{ label, viewElement, modelElement }: BreadcrumbItem,
		{ isCurrent = false }: BreadcrumbItemViewOptions = {}
	) {
		super(locale);

		this.viewElement = viewElement;
		this.modelElement = modelElement;
		this.set('label', label);

		this.setTemplate({
			tag: 'span',
			attributes: {
				class: ['ck', 'ck-elements-breadcrumbs__item', 'ck-elements-breadcrumbs__label'],
				tabindex: '-1',
				...(isCurrent ? { 'aria-current': 'location' } : {})
			},
			children: [{ text: this.bindTemplate.to('label') }]
		});
	}

	/**
	 * Focuses the label.
	 */
	public focus(): void {
		this.element?.focus();
	}
}
