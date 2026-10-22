import { View, type Locale, type ViewCollection } from 'ckeditor5';
import BreadcrumbItemView, { type BreadcrumbItem } from './breadcrumbItemView.js';
import BreadcrumbLabelView from './breadcrumbLabelView.js';

/**
 * The options of {@link BreadcrumbsView}.
 */
export interface BreadcrumbsViewOptions {
	/**
	 * Whether the items are buttons that can be clicked, or labels. Defaults to `false`.
	 */
	isClickable?: boolean;
}

/**
 * Shows a path of elements, from the outermost to the innermost one: buttons when the items can be clicked,
 * labels otherwise.
 *
 * Fires `execute` with the item when one of the buttons is clicked.
 */
export default class BreadcrumbsView extends View {
	/**
	 * The breadcrumb items.
	 */
	public readonly items: ViewCollection<BreadcrumbItemView | BreadcrumbLabelView>;

	/**
	 * Whether the items are buttons that can be clicked, or labels.
	 */
	public readonly isClickable: boolean;

	constructor(locale?: Locale, { isClickable = false }: BreadcrumbsViewOptions = {}) {
		super(locale);

		this.items = this.createCollection();
		this.isClickable = isClickable;

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
				if (!this.isClickable) {
					return new BreadcrumbLabelView(this.locale, item);
				}

				const view = new BreadcrumbItemView(this.locale, item);

				view.on('execute', () => {
					this.fire<BreadcrumbsViewExecuteEvent>('execute', view);
				});

				return view;
			})
		);
	}

	/**
	 * Focuses the innermost item, when the items can be clicked.
	 */
	public focus(): void {
		const last = this.items.last;

		if (last instanceof BreadcrumbItemView) {
			last.focus();
		}
	}
}

/**
 * Fired by {@link BreadcrumbsView} when one of its buttons is clicked.
 */
export interface BreadcrumbsViewExecuteEvent {
	name: 'execute';
	args: [item: BreadcrumbItemView];
}
