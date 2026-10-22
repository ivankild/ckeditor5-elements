import { type Locale } from 'ckeditor5';
import type ElementCommand from './elementCommand.js';
import ElementOrPositionButtonView, { type ElementOrPositionButtonViewOptions } from './elementOrPositionButtonView.js';

/**
 * A button that reflects an {@link ElementCommand}, including whether it is "on", and executes it when clicked.
 */
export default class ElementButtonView extends ElementOrPositionButtonView {
	/**
	 * The command this button reflects.
	 */
	declare public readonly command: ElementCommand;

	constructor(locale: Locale | undefined, command: ElementCommand, options: ElementOrPositionButtonViewOptions = {}) {
		super(locale, command, options);

		if (!options.target) {
			this.bind('isOn').to(command, 'isOn');
		}
	}
}
