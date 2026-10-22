import { View, ViewCollection, type Locale } from 'ckeditor5';
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
 * Shows a path of elements, from the outermost to the innermost one, as a list (`<ol>`) in a `<nav>` landmark: buttons
 * when the items can be clicked, labels otherwise. The innermost item is marked with `aria-current="location"`.
 *
 * Fires `execute` with the item when one of the buttons is clicked.
 */
export default class BreadcrumbsView extends View {
	/**
	 * The breadcrumb items: the buttons or labels, from the outermost to the innermost one.
	 */
	public readonly items = new ViewCollection<BreadcrumbItemView | BreadcrumbLabelView>();

	/**
	 * Whether the items are buttons that can be clicked, or labels.
	 */
	public readonly isClickable: boolean;

	/**
	 * The list items (`<li>`) that hold the {@link items}.
	 */
	private readonly _listItems: ViewCollection<BreadcrumbsListItemView>;

	constructor(locale?: Locale, { isClickable = false }: BreadcrumbsViewOptions = {}) {
		super(locale);

		this._listItems = this.createCollection();
		this.isClickable = isClickable;

		this.setTemplate({
			tag: 'nav',
			attributes: {
				class: ['ck', 'ck-elements-breadcrumbs'],
				'aria-label': locale?.t('Element path') ?? 'Element path'
			},
			children: [
				{
					tag: 'ol',
					attributes: {
						class: ['ck', 'ck-elements-breadcrumbs__list']
					},
					children: this._listItems
				}
			]
		});
	}

	/**
	 * Replaces the items.
	 */
	public setItems(items: readonly BreadcrumbItem[]): void {
		for (const listItem of this._listItems) {
			listItem.destroy();
		}

		this._listItems.clear();
		this.items.clear();

		items.forEach((item, index) => {
			const isCurrent = index === items.length - 1;
			const view = this.isClickable
				? new BreadcrumbItemView(this.locale, item, { isCurrent })
				: new BreadcrumbLabelView(this.locale, item, { isCurrent });

			if (view instanceof BreadcrumbItemView) {
				view.on('execute', () => {
					this.fire<BreadcrumbsViewExecuteEvent>('execute', view);
				});
			}

			this.items.add(view);
			this._listItems.add(new BreadcrumbsListItemView(this.locale, view));
		});
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

/**
 * A list item (`<li>`) of the breadcrumbs, holding a button or a label.
 */
class BreadcrumbsListItemView extends View {
	constructor(locale: Locale | undefined, item: BreadcrumbItemView | BreadcrumbLabelView) {
		super(locale);

		// Rendering registers the item as a child, so it is destroyed with the list item.
		this.setTemplate({
			tag: 'li',
			attributes: {
				class: ['ck', 'ck-elements-breadcrumbs__list-item']
			},
			children: [item]
		});
	}
}
