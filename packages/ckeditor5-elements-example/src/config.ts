import {
	BlockQuote,
	Bold,
	Code,
	Essentials,
	Heading,
	HorizontalLine,
	ImageBlock,
	ImageCaption,
	ImageInline,
	ImageInsert,
	Italic,
	Link,
	LinkImage,
	List,
	MediaEmbed,
	Paragraph,
	Table,
	TableToolbar,
	type EditorConfig
} from 'ckeditor5';
import {
	Breadcrumbs,
	ElementActions,
	ElementAttributes,
	ElementClickable,
	ElementClipboard,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	ElementToolbar,
	QuickInsert,
	insertIcon,
	pasteIcon,
	type ElementClickableDefinition,
	type ElementMenuConfig
} from 'ckeditor5-elements';
import { Note } from './note.js';
import schema from './schema.json';

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
	editor.commands.get('showElementAttributes'),
	editor.commands.get('deleteElement')
];

/**
 * Shows the attributes of the clicked element, with the command of `ElementAttributes`.
 */
const showAttributes: ElementClickableDefinition['callback'] = (element, editor) => {
	editor.commands.get('showElementAttributes')?.executeFor(element);
};

const ACTIONS = ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'];

/**
 * The editor config of the full example: CKEditor's common features, the `Note` element, the elements of `schema.json`,
 * and all the features of `ckeditor5-elements`. Without `attachTo`, `licenseKey` and the data.
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
		ImageBlock,
		ImageInline,
		ImageCaption,
		ImageInsert,
		LinkImage,
		MediaEmbed,
		Note,
		ElementSchema,
		ElementSelectable,
		ElementContextMenu,
		ElementClipboard,
		ElementActions,
		ElementAttributes,
		ElementToolbar,
		ElementClickable,
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
			'insertImage',
			'mediaEmbed',
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
	// A provider that needs no network: the preview of an embedded medium is a box with its address.
	mediaEmbed: {
		providers: [
			{
				name: 'example',
				url: /^https:\/\/example\.com\/(.+)/,
				html: match => `<div class="example-media">Media: <code>${match[0]}</code></div>`
			}
		]
	},
	// The elements of the JSON file, with their converters: `div` and `span`, the name as the class.
	elementSchema: schema,
	elementSchemaConverters: true,
	// Its containers and empty elements are selectable; the notes too.
	selectableElements: ['note'],
	elementContextMenu: elementMenu,
	breadcrumbs: { menu: elementMenu },
	elementClickables: [
		// Click an image, a medium, or anything with a link (a linked image): a modal with its attributes.
		{
			element: element =>
				['imageBlock', 'imageInline', 'media'].includes(element.name) || element.hasAttribute('linkHref'),
			callback: showAttributes
		},
		// Double-click a note: the same modal.
		{ element: 'note', event: 'dblclick', callback: showAttributes }
	],
	elementToolbars: [
		// "Note" unwraps the note; the actions act on the whole note.
		{ element: 'note', items: ['note', '|', ...ACTIONS], ariaLabel: 'Note toolbar' },
		{ element: 'tip', items: ACTIONS, ariaLabel: 'Tip toolbar' },
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
			media: 'Media',
			horizontalLine: 'Horizontal line',
			softBreak: 'Line break',
			tip: 'Tip',
			tipTitle: 'Tip title',
			steps: 'Steps',
			step: 'Step',
			status: 'Status'
		},
		// These need rows and cells, or an address: insert them with their toolbar buttons.
		exclude: ['table', 'imageBlock', 'imageInline', 'media']
	}
};
