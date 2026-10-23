import { ButtonView, Notification, type Locale } from 'ckeditor5';
import type ElementOrPositionCommand from './elementOrPositionCommand.js';
import { type ElementOrPosition } from './elementOrPositionCommand.js';

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
	target?: ElementOrPosition;
}

/**
 * A button that reflects an {@link ElementOrPositionCommand} and executes it when clicked.
 *
 * The label, icon and tooltip are the command `title`, `icon` and `tooltip`. For a
 * {@link ElementOrPositionCommand#isToggleable toggleable} command, the button is toggleable, so assistive technology
 * is told whether it is "on". Without a target, the button is enabled when the command is. With a target (e.g. in a
 * context menu of an element), it is enabled and "on" according to the command
 * {@link ElementOrPositionCommand#getState state} for that target, kept up to date as the document changes.
 *
 * A failed (rejected) command is reported with a warning of the `Notification` plugin.
 */
export default class ElementOrPositionButtonView extends ButtonView {
	/**
	 * The command this button reflects.
	 */
	public readonly command: ElementOrPositionCommand;

	/**
	 * The position or element the button acts on, if any.
	 */
	public readonly target: ElementOrPosition | undefined;

	constructor(
		locale: Locale | undefined,
		command: ElementOrPositionCommand,
		options: ElementOrPositionButtonViewOptions = {}
	) {
		super(locale);

		this.command = command;
		this.target = options.target;

		bindButtonToCommand(this, command, options);
	}
}

/**
 * Makes the button reflect the command and execute it when clicked, as {@link ElementOrPositionButtonView} does. Also
 * used for menu items, which are a different kind of button.
 */
export function bindButtonToCommand(
	button: ButtonView,
	command: ElementOrPositionCommand,
	{ withText = false, target }: ElementOrPositionButtonViewOptions = {}
): void {
	const editor = command.editor;

	button.set({ withText, isToggleable: command.isToggleable });
	button.bind('label', 'icon').to(command, 'title', 'icon');

	if (withText) {
		button.tooltip = false;
	} else {
		button.bind('tooltip').to(command, 'tooltip');
	}

	if (target) {
		const updateState = (): void => {
			const { isEnabled, isOn } = command.getState(target);

			button.isEnabled = isEnabled;
			button.isOn = isOn;
		};

		updateState();
		button.listenTo(editor.model.document, 'change', updateState);
		button.listenTo(editor, 'change:isReadOnly', updateState);
		button.listenTo(command, 'change:isForceDisabled', updateState);
	} else {
		button.bind('isEnabled').to(command, 'isEnabled');
	}

	button.on('execute', () => {
		// Focus first: focusing reads the DOM selection, which would override a selection set by the command.
		editor.editing.view.focus();

		const result = target ? command.executeFor(target) : command.execute();

		if (result instanceof Promise) {
			result.catch((error: unknown) => {
				reportError(command, error);
			});
		}
	});
}

/**
 * Shows a warning about a failed (asynchronous) command, e.g. a clipboard command without the clipboard permission,
 * with the `Notification` plugin. Without that plugin, the error is not handled.
 */
function reportError(command: ElementOrPositionCommand, error: unknown): void {
	const editor = command.editor;

	if (!editor.plugins.has(Notification)) {
		throw error;
	}

	editor.plugins.get(Notification).showWarning(error instanceof Error ? error.message : String(error), {
		title: editor.t('Could not complete "%0".', command.title),
		namespace: 'elementCommand'
	});
}
