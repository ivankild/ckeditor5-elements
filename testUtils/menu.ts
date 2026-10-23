import { DropdownMenuListItemView, DropdownMenuNestedMenuView, ListSeparatorView, type ListView } from 'ckeditor5';

/**
 * Describes the items of a menu list: the labels of buttons, `'Title ›'` for nested menus, `'|'` for separators.
 */
export function describeItems(list: ListView): string[] {
	return Array.from(list.items, item => {
		if (item instanceof ListSeparatorView) {
			return '|';
		}

		const child = item instanceof DropdownMenuListItemView ? item.childView : null;

		if (child instanceof DropdownMenuNestedMenuView) {
			return `${child.buttonView.label ?? ''} ›`;
		}

		return child?.label ?? '?';
	});
}
