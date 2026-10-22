import {
	ButtonView,
	ListItemView,
	ListView,
	type FilteredView,
	type FilteredViewExecuteEvent,
	type Locale
} from 'ckeditor5';

/**
 * An element that can be inserted: its model name and the label shown in the list.
 */
export interface QuickInsertItem {
	name: string;
	label: string;
}

/**
 * A list of insertable elements that can be filtered by a search query.
 *
 * Fires `execute` with `{ value: name }` when an item is chosen.
 */
export default class QuickInsertListView extends ListView implements FilteredView {
	private readonly _entries: { item: QuickInsertItem; view: ListItemView; button: ButtonView }[];

	constructor(locale: Locale, items: readonly QuickInsertItem[]) {
		super(locale);

		this.role = 'listbox';

		this._entries = items.map(item => {
			const view = new ListItemView(locale);
			const button = new ButtonView(locale);

			button.set({ label: item.label, withText: true, role: 'option' });
			button.on('execute', () => {
				this.fire<FilteredViewExecuteEvent>('execute', { value: item.name });
			});

			view.children.add(button);

			return { item, view, button };
		});

		this.items.addMany(this._entries.map(entry => entry.view));
	}

	/**
	 * Shows only the items whose label or name matches the expression. `null` shows all items.
	 */
	public filter(regExp: RegExp | null): { resultsCount: number; totalItemsCount: number } {
		let resultsCount = 0;

		for (const { item, view } of this._entries) {
			view.isVisible = !regExp || regExp.test(item.label) || regExp.test(item.name);

			if (view.isVisible) {
				resultsCount++;
			}
		}

		return { resultsCount, totalItemsCount: this._entries.length };
	}

	/**
	 * Returns the first item that is not filtered out.
	 */
	public getFirstVisibleItem(): QuickInsertItem | null {
		return this._entries.find(entry => entry.view.isVisible)?.item ?? null;
	}
}
