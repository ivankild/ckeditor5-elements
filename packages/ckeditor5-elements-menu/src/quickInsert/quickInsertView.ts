import { SearchTextView, type FilteredViewExecuteEvent, type Locale } from 'ckeditor5';
import QuickInsertListView, { type QuickInsertItem } from './quickInsertListView.js';

/**
 * A search field with a filtered list of insertable elements.
 *
 * In the search field, Enter chooses the first matching item and the down arrow moves the focus to the list.
 * Fires `execute` with `{ value: name }` when an item is chosen.
 */
export default class QuickInsertView extends SearchTextView {
	/**
	 * The list of elements.
	 */
	public readonly listView: QuickInsertListView;

	constructor(locale: Locale, items: readonly QuickInsertItem[]) {
		const listView = new QuickInsertListView(locale, items);
		const t = locale.t;

		super(locale, {
			queryView: { label: t('Insert element') },
			filteredView: listView,
			infoView: {
				text: {
					notFound: { primary: t('No matching elements') },
					noSearchableItems: { primary: t('No elements can be inserted here') }
				}
			},
			class: 'ck-elements-quick-insert'
		});

		this.listView = listView;
		listView.delegate('execute').to(this);
	}

	/**
	 * Renders the view and sets up Enter (choose the first match) and the down arrow (go to the list) in the search field.
	 */
	public override render(): void {
		super.render();

		const isInQueryField = (): boolean => this.focusTracker.focusedElement === this.queryView.element;

		this.keystrokes.set('enter', (data, cancel) => {
			const item = isInQueryField() ? this.listView.getFirstVisibleItem() : null;

			if (item) {
				this.fire<FilteredViewExecuteEvent>('execute', { value: item.name });
				cancel();
			}
		});

		this.keystrokes.set(
			'arrowdown',
			(data, cancel) => {
				if (isInQueryField()) {
					this.listView.focusFirst();
					cancel();
				}
			},
			{ priority: 'high' }
		);
	}
}
