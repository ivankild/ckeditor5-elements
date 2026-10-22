import { View, type Locale } from 'ckeditor5';

/**
 * An empty view that makes the following toolbar items start on a new line.
 *
 * It works only in toolbars that wrap their items, i.e. with `shouldNotGroupWhenFull: true`.
 * In a grouping toolbar it is hidden.
 */
export default class EndOfLineView extends View {
	constructor(locale?: Locale) {
		super(locale);

		this.setTemplate({
			tag: 'span',
			attributes: {
				class: ['ck', 'ck-elements-end-of-line'],
				'aria-hidden': 'true'
			}
		});
	}
}
