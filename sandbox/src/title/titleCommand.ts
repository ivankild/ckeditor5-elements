import { type Editor } from 'ckeditor5';
import { ElementCommand } from 'ckeditor5-elements-ui';

const icon =
	'<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
	'<path d="M4 3h12v3h-1.5V4.5h-3.75v11H12V17H8v-1.5h1.25v-11H5.5V6H4z"/></svg>';

/**
 * Wraps the selected block with the `title` element, or unwraps it.
 */
export default class TitleCommand extends ElementCommand {
	constructor(editor: Editor) {
		super(editor);

		this.elementName = 'title';

		this.set({
			title: editor.t('Title'),
			icon
		});
	}
}
