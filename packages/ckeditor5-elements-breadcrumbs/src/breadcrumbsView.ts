import { KeystrokeHandler, View, ViewCollection, type Locale } from 'ckeditor5';
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
 * when the items can be clicked, labels otherwise. Items without a model element (list items) are labels too. The
 * innermost item is marked with `aria-current="location"`.
 *
 * The left and right arrows move the focus between the items; past the first or the last one, they are left to the
 * toolbar the view is in. Fires `execute` with the item when one of the buttons is clicked.
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
	 * Handles the keystrokes within the breadcrumbs.
	 */
	public readonly keystrokes = new KeystrokeHandler();

	/**
	 * The list items (`<li>`) that hold the {@link items}.
	 */
	private readonly _listItems: ViewCollection<BreadcrumbsListItemView>;

	constructor(locale?: Locale, { isClickable = false }: BreadcrumbsViewOptions = {}) {
		super(locale);

		this._listItems = this.createCollection();
		this.isClickable = isClickable;

		const isRtl = locale?.uiLanguageDirection === 'rtl';

		this.keystrokes.set(isRtl ? 'arrowright' : 'arrowleft', (data, cancel) => {
			if (this._focusSibling(-1)) {
				cancel();
			}
		});

		this.keystrokes.set(isRtl ? 'arrowleft' : 'arrowright', (data, cancel) => {
			if (this._focusSibling(1)) {
				cancel();
			}
		});

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
			const view =
				this.isClickable && item.modelElement
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
	 * Renders the view and starts handling the keystrokes.
	 */
	public override render(): void {
		super.render();

		if (this.element) {
			this.keystrokes.listenTo(this.element);
		}
	}

	/**
	 * Focuses an item: the first one when the focus moves forward (`1`, e.g. from the previous toolbar item), the
	 * innermost one otherwise.
	 */
	public focus(direction?: 1 | -1): void {
		(direction === 1 ? this.items.first : this.items.last)?.focus();
	}

	/**
	 * Destroys the view and its keystroke handler.
	 */
	public override destroy(): void {
		super.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the item before (`-1`) or after (`1`) the focused one. Returns `false` when there is none.
	 */
	private _focusSibling(step: 1 | -1): boolean {
		const items = Array.from(this.items);
		const index = items.findIndex(item => item.element === document.activeElement);
		const sibling = index === -1 ? undefined : items[index + step];

		sibling?.focus();

		return !!sibling;
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
