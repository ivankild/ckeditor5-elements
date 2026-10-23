import { Essentials, List, Paragraph, Plugin } from 'ckeditor5';
import { ElementActions, ElementContextMenu, ElementOrPositionButtonView } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

const ACTIONS = ['moveElementUp', 'moveElementDown', 'duplicateElement', 'deleteElement'] as const;

/**
 * Toolbar buttons for the element actions. Without a target, they act on the element with the cursor.
 */
class ActionButtons extends Plugin {
	public static get requires(): readonly [typeof ElementActions] {
		return [ElementActions] as const;
	}

	public init(): void {
		const editor = this.editor;

		for (const name of ACTIONS) {
			const command = editor.commands.get(name);

			if (command) {
				editor.ui.componentFactory.add(name, locale => new ElementOrPositionButtonView(locale, command));
			}
		}
	}
}

export default {
	config: {
		plugins: [Essentials, Paragraph, List, Note, ActionButtons, ElementContextMenu],
		toolbar: ['undo', 'redo', '|', 'note', 'bulletedList', '|', ...ACTIONS],
		// The same commands in the context menu of the right-clicked element.
		elementContextMenu: (element, editor) => [
			editor.commands.get('moveElementUp'),
			editor.commands.get('moveElementDown'),
			'|',
			editor.commands.get('duplicateElement'),
			editor.commands.get('deleteElement')
		]
	},
	data:
		'<p>Put the cursor here and move this paragraph down, or right-click it.</p>' +
		'<aside class="note"><p>The first block of a note cannot move up.</p><p>Duplicate this one: you get an empty paragraph below.</p></aside>' +
		'<ul><li>Duplicate a list item: you get a new one.</li><li>Delete this one.</li></ul>' +
		'<p>The last block cannot move down.</p>'
} satisfies Demo;
