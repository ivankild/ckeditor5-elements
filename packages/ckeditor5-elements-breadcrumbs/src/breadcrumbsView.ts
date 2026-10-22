import { View, type Locale, type ViewCollection } from 'ckeditor5';
import BreadcrumbItemView, { type BreadcrumbItem } from './breadcrumbItemView.js';

/**
 * Shows a path of element buttons, from the outermost to the innermost one.
 *
 * Fires `execute` with the item when one of the buttons is clicked.
 */
export default class BreadcrumbsView extends View {
	/**
	 * The breadcrumb items.
	 */
	public readonly items: ViewCollection<BreadcrumbItemView>;

	constructor(locale?: Locale) {
		super(locale);

		this.items = this.createCollection();

		this.setTemplate({
			tag: 'nav',
			attributes: {
				class: ['ck', 'ck-elements-breadcrumbs'],
				'aria-label': locale?.t('Element path') ?? 'Element path'
			},
			children: [
				{
					tag: 'div',
					attributes: {
						class: ['ck', 'ck-elements-breadcrumbs__list']
					},
					children: this.items
				}
			]
		});
	}

	/**
	 * Replaces the items.
	 */
	public setItems(items: readonly BreadcrumbItem[]): void {
		this.items.clear();
		this.items.addMany(
			items.map(item => {
				const view = new BreadcrumbItemView(this.locale, item);

				view.on('execute', () => {
					this.fire<BreadcrumbsViewExecuteEvent>('execute', view);
				});

				return view;
			})
		);
	}

	/**
	 * Focuses the innermost item.
	 */
	public focus(): void {
		this.items.last?.focus();
	}
}

/**
 * Fired by {@link BreadcrumbsView} when one of its buttons is clicked.
 */
export interface BreadcrumbsViewExecuteEvent {
	name: 'execute';
	args: [item: BreadcrumbItemView];
}
