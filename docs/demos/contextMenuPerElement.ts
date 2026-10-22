import { Essentials, Heading, Paragraph } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Heading, ElementContextMenu, ElementClipboard],
		toolbar: ['undo', 'redo', '|', 'heading'],
		// The items depend on the element. No items: the native context menu.
		elementContextMenu: (element, editor) => {
			if (element.name.startsWith('heading')) {
				return [editor.commands.get('copyElement'), editor.commands.get('cutElement')];
			}

			if (element.is('element', 'paragraph') && element.isEmpty) {
				return [editor.commands.get('pasteElement')];
			}

			return [];
		}
	},
	data:
		'<h2>Right-click this heading: copy or cut it</h2>' +
		'<p></p>' +
		'<p>Right-click the empty paragraph above: paste over it. Right-click here: the native menu.</p>'
} satisfies Demo;
