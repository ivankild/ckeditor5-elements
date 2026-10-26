import {
	Essentials,
	IconBulletedList,
	IconCode,
	IconCodeBlock,
	IconDocumentOutline,
	IconHeading2,
	IconItalic,
	IconNumberedList,
	IconQuote,
	Paragraph,
	SourceEditing,
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
	ElementSchemaCommands,
	ElementSelectable,
	ElementToolbar,
	QuickInsert,
	insertIcon,
	pasteIcon,
	type ElementMenuConfig
} from 'ckeditor5-elements';
import { XmlDocument } from 'ckeditor5-elements-xml-example';
import schema from './schema.json';

/**
 * What comes before the article: the XML declaration, and the document type of Simplified DocBook 1.1.
 */
export const DOCBOOK_PROLOG =
	'<?xml version="1.0" encoding="UTF-8"?>\n' +
	'<!DOCTYPE article PUBLIC "-//OASIS//DTD Simplified DocBook XML V1.1//EN" ' +
	'"http://www.oasis-open.org/docbook/xml/simple/1.1/sdocbook.dtd">\n';

/**
 * The menu of an element, for the context menu and the breadcrumbs: inserting, the element actions, the clipboard, its
 * attributes, and deleting.
 */
export const docBookMenu: ElementMenuConfig = (element, editor) => [
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
		items: [editor.commands.get('pasteElementBefore'), editor.commands.get('pasteElementAfter')]
	},
	'|',
	editor.commands.get('showElementAttributes'),
	editor.commands.get('deleteElement')
];

const ACTIONS = ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'];

/**
 * The editor config of the DocBook example: the elements of `schema.json`, by their DocBook names, with the data of a
 * Simplified DocBook article (see `XmlDocument`), and the features of `ckeditor5-elements`. Without `attachTo`,
 * `licenseKey` and the data.
 */
export const docBookConfig: EditorConfig = {
	plugins: [
		Essentials,
		SourceEditing,
		Paragraph,
		ElementSchema,
		ElementSchemaCommands,
		ElementSelectable,
		XmlDocument,
		ElementContextMenu,
		ElementActions,
		ElementClipboard,
		ElementAttributes,
		ElementClickable,
		ElementToolbar,
		QuickInsert,
		Breadcrumbs
	],
	toolbar: {
		items: [
			'undo',
			'redo',
			'sourceEditing',
			'|',
			'title',
			'section',
			'|',
			'itemizedlist',
			'orderedlist',
			'blockquote',
			'programlisting',
			'|',
			'emphasis',
			'literal',
			// The path of the DocBook elements at the cursor, on a toolbar line of its own.
			'-',
			'breadcrumbs'
		],
		shouldNotGroupWhenFull: true
	},
	// The elements of DocBook. Their editing view is HTML, from the converters of the schema.
	elementSchema: schema,
	elementSchemaConverters: true,
	// The data: the XML of the article, with the elements by their names, and CKEditor's paragraph as `para`.
	xmlDocument: { root: 'article', prolog: DOCBOOK_PROLOG, paragraph: 'para', className: 'docbook' },
	// A command and a button for each element, by its kind; the lists get the command of a list.
	elementSchemaCommands: {
		title: { title: 'Title', icon: IconHeading2 },
		section: { title: 'Section', icon: IconDocumentOutline },
		itemizedlist: { title: 'Bulleted list', icon: IconBulletedList },
		orderedlist: { title: 'Numbered list', icon: IconNumberedList },
		blockquote: { title: 'Block quote', icon: IconQuote },
		programlisting: { title: 'Program listing', icon: IconCodeBlock },
		emphasis: { title: 'Emphasis', icon: IconItalic, keystroke: 'Ctrl+I' },
		literal: { title: 'Literal', icon: IconCode }
	},
	elementContextMenu: docBookMenu,
	breadcrumbs: { menu: docBookMenu },
	// Click a link: a modal with its attributes, the `url`.
	elementClickables: [
		{
			element: 'ulink',
			callback: (element, editor) => editor.commands.get('showElementAttributes')?.executeFor(element)
		}
	],
	elementToolbars: [
		{ element: 'section', items: ['section', '|', ...ACTIONS], ariaLabel: 'Section toolbar' },
		{ element: 'listitem', items: ACTIONS, ariaLabel: 'List item toolbar' }
	],
	quickInsert: {
		labels: {
			paragraph: 'Paragraph',
			title: 'Title',
			section: 'Section',
			itemizedlist: 'Bulleted list',
			orderedlist: 'Numbered list',
			listitem: 'List item',
			blockquote: 'Block quote',
			programlisting: 'Program listing',
			emphasis: 'Emphasis',
			literal: 'Literal',
			softBreak: 'Line break'
		},
		// A link needs its address: write it in the source. A list is made of blocks, with its button.
		exclude: ['ulink', 'itemizedlist', 'orderedlist']
	}
};
