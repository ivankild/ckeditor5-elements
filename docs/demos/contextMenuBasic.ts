import { Bold, Essentials, Paragraph } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Bold, ElementContextMenu, ElementClipboard],
		toolbar: ['undo', 'redo', '|', 'bold'],
		// Right-click a paragraph: the menu shows the clipboard commands for it.
		elementContextMenu: (element, editor) => [
			editor.commands.get('copyElement'),
			editor.commands.get('cutElement'),
			editor.commands.get('pasteElement'),
			editor.commands.get('pasteElementBefore'),
			editor.commands.get('pasteElementAfter')
		]
	},
	data:
		'<p>Right-click this paragraph and choose <strong>Copy</strong>.</p>' +
		'<p>Then right-click this one and choose <strong>Paste after</strong>.</p>'
} satisfies Demo;
