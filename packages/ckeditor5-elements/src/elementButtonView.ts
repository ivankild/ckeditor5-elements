import { ButtonView, type Locale } from 'ckeditor5';
import type ElementCommand from './elementCommand.js';

/**
 * A button that reflects the state of an {@link ElementCommand} and executes it when clicked.
 */
export default class ElementButtonView extends ButtonView {
	/**
	 * The command this button reflects.
	 */
	public readonly command: ElementCommand;

	constructor(locale: Locale, command: ElementCommand) {
		super(locale);

		this.command = command;

		this.bind('isOn', 'isEnabled', 'icon', 'label', 'tooltip').to(
			command,
			'isOn',
			'isEnabled',
			'icon',
			'title',
			'tooltip'
		);

		this.on('execute', () => {
			command.execute();
			command.editor.editing.view.focus();
		});
	}
}
