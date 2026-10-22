import { View, type Locale } from 'ckeditor5';

/**
 * A line between groups of menu items.
 */
export default class MenuSeparatorView extends View {
	constructor(locale?: Locale) {
		super(locale);

		this.setTemplate({
			tag: 'div',
			attributes: {
				class: ['ck', 'ck-elements-context-menu__separator'],
				role: 'separator'
			}
		});
	}
}
