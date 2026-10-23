import { View, type Locale } from 'ckeditor5';

/**
 * The content of the attributes dialog: a table of the attributes of an element, a row for each, with the key and the
 * value as text.
 */
export default class ElementAttributesView extends View {
	constructor(locale: Locale, attributes: readonly (readonly [key: string, value: string])[], emptyText: string) {
		super(locale);

		const rows = attributes.length
			? attributes.map(([key, value]) => ({
					tag: 'tr',
					children: [
						{ tag: 'th', attributes: { scope: 'row' }, children: [{ text: key }] },
						{ tag: 'td', children: [{ text: value }] }
					]
				}))
			: [
					{
						tag: 'tr',
						children: [
							{
								tag: 'td',
								attributes: { class: 'ck-elements-attributes__empty' },
								children: [{ text: emptyText }]
							}
						]
					}
				];

		// CKEditor's reset styles all elements of its UI; `ck-reset_all-excluded` leaves the table in it to our styles.
		this.setTemplate({
			tag: 'div',
			attributes: { class: ['ck-reset_all-excluded', 'ck-elements-attributes'] },
			children: [{ tag: 'table', children: rows }]
		});
	}
}
