import { Essentials, Paragraph } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementActions,
	ElementClipboard,
	ElementContextMenu,
	type ElementMenuConfig
} from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

// One menu for both: right-clicking an element, and clicking its breadcrumb.
const menu: ElementMenuConfig = (element, editor) => [
	editor.commands.get('note'),
	editor.commands.get('duplicateElement'),
	'|',
	editor.commands.get('moveElementUp'),
	editor.commands.get('moveElementDown'),
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('cutElement'),
	editor.commands.get('pasteElementAfter'),
	'|',
	editor.commands.get('deleteElement')
];

export default {
	config: {
		plugins: [Essentials, Paragraph, Note, Breadcrumbs, ElementContextMenu, ElementClipboard, ElementActions],
		toolbar: { items: ['undo', 'redo', '|', 'note', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true },
		elementContextMenu: menu,
		// With a menu, the breadcrumbs are buttons that open it, with the `ElementMenu` plugin, as the context menu does.
		breadcrumbs: { menu }
	},
	data:
		'<aside class="note"><p>Put the cursor here, then click <code>aside.note</code> in the breadcrumbs: ' +
		'<b>Move down</b> moves the whole note below the next paragraph.</p></aside>' +
		'<p>Clicking <code>p</code> opens the menu of this paragraph.</p>' +
		'<p><b>Duplicate</b> adds an empty block of the same kind below; <b>Delete</b> removes the block.</p>'
} satisfies Demo;
