import {
	BlockQuote,
	Bold,
	Code,
	Essentials,
	Heading,
	HorizontalLine,
	Italic,
	Link,
	List,
	Paragraph,
	Table,
	TableToolbar,
	type EditorConfig
} from 'ckeditor5';
import {
	Breadcrumbs,
	ElementActions,
	ElementClipboard,
	ElementContextMenu,
	ElementToolbar,
	QuickInsert,
	insertIcon,
	pasteIcon,
	type ElementMenuConfig
} from 'ckeditor5-elements';
import { Note } from './note.js';

/**
 * The menu of an element, for the context menu and the breadcrumbs: toggles, inserting, the element actions, the
 * clipboard, and deleting.
 */
export const elementMenu: ElementMenuConfig = (element, editor) => [
	editor.commands.get('note'),
	editor.commands.get('warning'),
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
];

const ACTIONS = ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'];

/**
 * The editor config of the full example: CKEditor's common features, the `Note` element, and all the features of
 * `ckeditor5-elements`. Without `attachTo`, `licenseKey` and the data.
 */
export const exampleConfig: EditorConfig = {
	plugins: [
		Essentials,
		Paragraph,
		Heading,
		Bold,
		Italic,
		Code,
		Link,
		List,
		BlockQuote,
		Table,
		TableToolbar,
		HorizontalLine,
		Note,
		ElementContextMenu,
		ElementClipboard,
		ElementActions,
		ElementToolbar,
		QuickInsert,
		Breadcrumbs
	],
	toolbar: {
		items: [
			'undo',
			'redo',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'code',
			'link',
			'|',
			'bulletedList',
			'numberedList',
			'blockQuote',
			'insertTable',
			'horizontalLine',
			'|',
			'note',
			'warning',
			// The breadcrumbs on a toolbar line of their own.
			'-',
			'breadcrumbs'
		],
		shouldNotGroupWhenFull: true
	},
	table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
	elementContextMenu: elementMenu,
	breadcrumbs: { menu: elementMenu },
	elementToolbars: [
		// "Note" unwraps the note; the actions act on the whole note.
		{ element: 'note', items: ['note', '|', ...ACTIONS], ariaLabel: 'Note toolbar' },
		{
			element: element => element.name.startsWith('heading'),
			items: ['heading', '|', ...ACTIONS],
			ariaLabel: 'Heading toolbar'
		}
	],
	quickInsert: {
		labels: {
			paragraph: 'Paragraph',
			heading1: 'Heading 1',
			heading2: 'Heading 2',
			heading3: 'Heading 3',
			note: 'Note',
			blockQuote: 'Block quote',
			horizontalLine: 'Horizontal line',
			softBreak: 'Line break'
		},
		// A table needs rows and cells: insert it with its toolbar button.
		exclude: ['table']
	}
};
