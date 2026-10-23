import { Plugin } from 'ckeditor5';
import ElementDeleteCommand from './elementDeleteCommand.js';
import ElementDuplicateCommand from './elementDuplicateCommand.js';
import ElementMoveCommand from './elementMoveCommand.js';

/**
 * Registers commands that act on an element: `moveElementUp`, `moveElementDown`, `duplicateElement` and
 * `deleteElement`.
 *
 * ```ts
 * editor.execute('duplicateElement'); // The element at the selection.
 * editor.commands.get('moveElementUp').executeFor(element); // The given element.
 * ```
 *
 * The commands have titles and icons, so they can be menu items (e.g. in the `elementContextMenu` config of
 * `ElementContextMenu`) and buttons.
 */
export default class ElementActions extends Plugin {
	public static get pluginName(): 'ElementActions' {
		return 'ElementActions' as const;
	}

	public init(): void {
		const editor = this.editor;

		editor.commands.add('moveElementUp', new ElementMoveCommand(editor, 'up'));
		editor.commands.add('moveElementDown', new ElementMoveCommand(editor, 'down'));
		editor.commands.add('duplicateElement', new ElementDuplicateCommand(editor));
		editor.commands.add('deleteElement', new ElementDeleteCommand(editor));
	}
}
