import { Essentials, Paragraph } from 'ckeditor5';
import { EndOfLine } from 'ckeditor5-elements-ui';
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu, type ElementContextMenuItems } from 'ckeditor5-elements-context-menu';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

// One menu for both: right-clicking an element, and clicking its breadcrumb.
const menu: ElementContextMenuItems = (element, editor) => [
	editor.commands.get('note'),
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('cutElement'),
	editor.commands.get('pasteElementAfter')
];

export default {
	config: {
		plugins: [Essentials, Paragraph, Note, Breadcrumbs, EndOfLine, ElementContextMenu, ElementClipboard],
		toolbar: { items: ['undo', 'redo', '|', 'note', '#', 'breadcrumbs'], shouldNotGroupWhenFull: true },
		elementContextMenu: menu,
		// With a menu (and the `ElementContextMenu` plugin), the breadcrumbs are buttons that open it.
		breadcrumbs: { menu }
	},
	data:
		'<aside class="note"><p>Put the cursor here, then click <code>aside.note</code> in the breadcrumbs.</p></aside>' +
		'<p>Clicking <code>p</code> opens the menu of this paragraph.</p>'
} satisfies Demo;
