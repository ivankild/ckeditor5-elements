import { Dialog, Plugin } from 'ckeditor5';
import ElementAttributesCommand from './elementAttributesCommand.js';

/**
 * Registers the `showElementAttributes` command, which shows the attributes of an element, as key-value pairs, in a
 * modal dialog.
 *
 * ```ts
 * editor.commands.get('showElementAttributes').executeFor(element);
 * ```
 *
 * The command has a title and an icon, so it can be a menu item (e.g. in the `elementContextMenu` config of
 * `ElementContextMenu`), a toolbar button, or the callback of a clickable element (see `ElementClickable`).
 */
export default class ElementAttributes extends Plugin {
	public static get requires(): readonly [typeof Dialog] {
		return [Dialog] as const;
	}

	public static get pluginName(): 'ElementAttributes' {
		return 'ElementAttributes' as const;
	}

	public init(): void {
		this.editor.commands.add('showElementAttributes', new ElementAttributesCommand(this.editor));
	}
}
