import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import {
	ElementActions,
	ElementClipboard,
	ElementContextMenu,
	insertIcon,
	pasteIcon,
	QuickInsert
} from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [
			Essentials,
			SourceEditing,
			Paragraph,
			Heading,
			Note,
			ElementContextMenu,
			ElementClipboard,
			ElementActions,
			QuickInsert
		],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', '|', 'note'],
		// Commands, submenus and separators. "Note" is a toggle: it is "on" inside a note.
		elementContextMenu: (element, editor) => [
			editor.commands.get('note'),
			'|',
			{
				title: 'Insert',
				icon: insertIcon,
				items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
			},
			editor.commands.get('duplicateElement'),
			'|',
			editor.commands.get('moveElementUp'),
			editor.commands.get('moveElementDown'),
			'|',
			editor.commands.get('copyElement'),
			editor.commands.get('cutElement'),
			{
				title: 'Paste',
				icon: pasteIcon,
				items: [
					editor.commands.get('pasteElement'),
					'|',
					editor.commands.get('pasteElementBefore'),
					editor.commands.get('pasteElementAfter')
				]
			},
			'|',
			editor.commands.get('deleteElement')
		],
		quickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', note: 'Note' } }
	},
	data:
		'<aside class="note"><p>Right-click inside this note: <b>Note</b> is on, and unwraps it.</p></aside>' +
		'<p>Right-click this paragraph: <b>Note</b> wraps it. <b>Insert › Insert after</b> opens quick insert.</p>' +
		'<p><b>Move up</b> swaps this paragraph with the one above; <b>Move down</b> is disabled for the last block.</p>'
} satisfies Demo;
