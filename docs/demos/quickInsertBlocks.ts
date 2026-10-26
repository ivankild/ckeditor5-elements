import { Essentials, Heading, Paragraph, Plugin, SourceEditing } from 'ckeditor5';
import { ElementContextMenu, ElementOrPositionButtonView, insertIcon, ElementQuickInsert } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

/**
 * Toolbar buttons for the `quickInsertBefore` and `quickInsertAfter` commands: they open the quick insert menu before
 * or after the block with the cursor.
 */
class InsertButtons extends Plugin {
	public static get requires(): readonly [typeof ElementQuickInsert] {
		return [ElementQuickInsert] as const;
	}

	public init(): void {
		const editor = this.editor;

		for (const name of ['quickInsertBefore', 'quickInsertAfter'] as const) {
			const command = editor.commands.get(name);

			if (command) {
				editor.ui.componentFactory.add(
					name,
					locale => new ElementOrPositionButtonView(locale, command, { withText: true })
				);
			}
		}
	}
}

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, Note, ElementContextMenu, InsertButtons],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', '|', 'quickInsertBefore', 'quickInsertAfter'],
		// The same commands in the context menu.
		elementContextMenu: (element, editor) => [
			{
				title: 'Insert',
				icon: insertIcon,
				items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
			}
		],
		elementQuickInsert: {
			labels: { paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', note: 'Note' },
			exclude: ['heading3']
		}
	},
	data:
		'<h2>Insert next to a block</h2>' +
		'<p>Put the cursor here and click <b>Insert after</b>, or right-click and choose <b>Insert › Insert after</b>.</p>' +
		'<aside class="note"><p>Inside a note, blocks can be inserted next to this paragraph too.</p></aside>'
} satisfies Demo;
