import { ButtonView, type Locale } from 'ckeditor5';
import type ElementOrPositionCommand from './elementOrPositionCommand.js';
import { type PositionOrElement } from './elementOrPositionCommand.js';

/**
 * The options of {@link ElementOrPositionButtonView}.
 */
export interface ElementOrPositionButtonViewOptions {
	/**
	 * Whether the command title is rendered next to the icon. When it is, there is no tooltip. Defaults to `false`.
	 */
	withText?: boolean;

	/**
	 * The position or element the button acts on. Without it, the button follows the command state for the selection
	 * and executes the command for the selection.
	 */
	target?: PositionOrElement;
}

/**
 * A button that reflects an {@link ElementOrPositionCommand} and executes it when clicked.
 *
 * The label, icon and tooltip are the command `title`, `icon` and `tooltip`. Without a target, the button is enabled
 * when the command is. With a target (e.g. in a context menu of an element), it is enabled and "on" according to the
 * command {@link ElementOrPositionCommand#getState state} for that target, kept up to date as the document changes.
 */
export default class ElementOrPositionButtonView extends ButtonView {
	/**
	 * The command this button reflects.
	 */
	public readonly command: ElementOrPositionCommand;

	/**
	 * The position or element the button acts on, if any.
	 */
	public readonly target: PositionOrElement | undefined;

	constructor(
		locale: Locale | undefined,
		command: ElementOrPositionCommand,
		{ withText = false, target }: ElementOrPositionButtonViewOptions = {}
	) {
		super(locale);

		this.command = command;
		this.target = target;

		this.set('withText', withText);
		this.bind('label', 'icon').to(command, 'title', 'icon');

		if (withText) {
			this.tooltip = false;
		} else {
			this.bind('tooltip').to(command, 'tooltip');
		}

		if (target) {
			this._updateState(target);

			this.listenTo(command.editor.model.document, 'change', () => {
				this._updateState(target);
			});
			this.listenTo(command.editor, 'change:isReadOnly', () => {
				this._updateState(target);
			});
		} else {
			this.bind('isEnabled').to(command, 'isEnabled');
		}

		this.on('execute', () => {
			// Focus first: focusing reads the DOM selection, which would override a selection set by the command.
			command.editor.editing.view.focus();

			if (target) {
				void command.executeFor(target);
			} else {
				void command.execute();
			}
		});
	}

	private _updateState(target: PositionOrElement): void {
		const { isEnabled, isOn } = this.command.getState(target);

		this.isEnabled = isEnabled;
		this.isOn = isOn;
	}
}
