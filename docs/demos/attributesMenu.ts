import { Essentials, Heading, ImageBlock, ImageCaption, List, Paragraph, SourceEditing } from 'ckeditor5';
import { ElementActions, ElementAttributes, ElementContextMenu, ElementToolbar } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

// An image that needs no network.
const image =
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#4f46e5"/></svg>'
	);

export default {
	config: {
		plugins: [
			Essentials,
			SourceEditing,
			Paragraph,
			Heading,
			List,
			ImageBlock,
			ImageCaption,
			Note,
			ElementAttributes,
			ElementActions,
			ElementContextMenu,
			ElementToolbar
		],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', 'bulletedList', 'note'],
		// A command: it is a menu item, ...
		elementContextMenu: (element, editor) => [
			editor.commands.get('showElementAttributes'),
			'|',
			editor.commands.get('duplicateElement'),
			editor.commands.get('deleteElement')
		],
		// ... and a button of a floating toolbar, which acts on the note, not on the paragraph with the cursor.
		elementToolbars: [
			{
				element: 'note',
				items: ['showElementAttributes', '|', 'moveElementUp', 'moveElementDown', 'deleteElement']
			}
		]
	},
	data:
		'<h2>Right-click a block</h2>' +
		'<p>Choose <b>Show attributes</b>. A paragraph has none; an image, a heading or a note may.</p>' +
		'<aside class="note"><p>Put the cursor in this note: its toolbar has the same command, for the note.</p></aside>' +
		`<figure class="image"><img src="${image}" alt="An image with a caption"><figcaption>A caption</figcaption></figure>`
} satisfies Demo;
