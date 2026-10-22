import { Essentials, Heading, Paragraph } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { QuickInsert } from 'ckeditor5-elements-quick-insert';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Heading, Note, ElementContextMenu, ElementClipboard, QuickInsert],
		toolbar: ['undo', 'redo', '|', 'heading', '|', 'note'],
		// Commands, submenus and separators. "Note" is a toggle: it is "on" inside a note.
		elementContextMenu: (element, editor) => [
			editor.commands.get('note'),
			'|',
			{
				title: 'Insert',
				items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
			},
			'|',
			editor.commands.get('copyElement'),
			editor.commands.get('cutElement'),
			{
				title: 'Paste',
				items: [
					editor.commands.get('pasteElement'),
					'|',
					editor.commands.get('pasteElementBefore'),
					editor.commands.get('pasteElementAfter')
				]
			}
		],
		quickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', note: 'Note' } }
	},
	data:
		'<aside class="note"><p>Right-click inside this note: <b>Note</b> is on, and unwraps it.</p></aside>' +
		'<p>Right-click this paragraph: <b>Note</b> wraps it. <b>Insert › Insert after</b> opens quick insert.</p>'
} satisfies Demo;
