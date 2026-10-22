import { View, type Locale, type ViewElement } from 'ckeditor5';
import { type BreadcrumbItem } from './breadcrumbItemView.js';

/**
 * A single breadcrumb that cannot be clicked: the label of one view element, e.g. `section.title`.
 */
export default class BreadcrumbLabelView extends View {
	/**
	 * The view element this item stands for.
	 */
	public readonly viewElement: ViewElement;

	/**
	 * The label of the element.
	 *
	 * @observable
	 */
	declare public label: string;

	constructor(locale: Locale | undefined, { label, viewElement }: BreadcrumbItem) {
		super(locale);

		this.viewElement = viewElement;
		this.set('label', label);

		this.setTemplate({
			tag: 'span',
			attributes: {
				class: ['ck', 'ck-elements-breadcrumbs__item', 'ck-elements-breadcrumbs__label']
			},
			children: [{ text: this.bindTemplate.to('label') }]
		});
	}
}
