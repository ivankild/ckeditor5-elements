import {
	Essentials,
	IconBold,
	IconBulletedList,
	IconCodeBlock,
	IconDocumentOutline,
	IconHeading2,
	IconInfo,
	IconItalic,
	IconNumberedList,
	IconText,
	IconUnderline,
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
 * What comes before the topic: the XML declaration, and the document type of a Lightweight DITA topic (XDITA).
 */
export const DITA_PROLOG =
	'<?xml version="1.0" encoding="UTF-8"?>\n' +
	'<!DOCTYPE topic PUBLIC "-//OASIS//DTD LIGHTWEIGHT DITA Topic//EN" "lw-topic.dtd">\n';

/**
 * The menu of an element, for the context menu and the breadcrumbs: inserting, the element actions, the clipboard, its
 * attributes, and deleting.
 */
export const ditaMenu: ElementMenuConfig = (element, editor) => [
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
 * The editor config of the DITA example: the elements of `schema.json`, by their DITA names, with the data of a
 * Lightweight DITA topic (see `XmlDocument`), and the features of `ckeditor5-elements`. Without `attachTo`, `licenseKey`
 * and the data.
 */
export const ditaConfig: EditorConfig = {
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
			'shortdesc',
			'section',
			'|',
			'ul',
			'ol',
			'note',
			'pre',
			'|',
			'b',
			'i',
			'u',
			// The path of the DITA elements at the cursor, on a toolbar line of its own.
			'-',
			'breadcrumbs'
		],
		shouldNotGroupWhenFull: true
	},
	// The elements of DITA. Their editing view is HTML, from the converters of the schema.
	elementSchema: schema,
	elementSchemaConverters: true,
	// The data: the XML of the topic, with the elements by their names, and CKEditor's paragraph as `p`.
	xmlDocument: { root: 'topic', prolog: DITA_PROLOG, paragraph: 'p', className: 'dita' },
	// A command and a button for each element, by its kind: the lists are lists, `pre` is verbatim.
	elementSchemaCommands: {
		title: { title: 'Title', icon: IconHeading2 },
		shortdesc: { title: 'Short description', icon: IconText },
		section: { title: 'Section', icon: IconDocumentOutline },
		ul: { title: 'Bulleted list', icon: IconBulletedList },
		ol: { title: 'Numbered list', icon: IconNumberedList },
		note: { title: 'Note', icon: IconInfo },
		pre: { title: 'Preformatted text', icon: IconCodeBlock },
		b: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B' },
		i: { title: 'Italic', icon: IconItalic, keystroke: 'Ctrl+I' },
		u: { title: 'Underline', icon: IconUnderline, keystroke: 'Ctrl+U' }
	},
	elementContextMenu: ditaMenu,
	breadcrumbs: { menu: ditaMenu },
	// Click a cross-reference: a modal with its attributes, the `href`.
	elementClickables: [
		{
			element: 'xref',
			callback: (element, editor) => editor.commands.get('showElementAttributes')?.executeFor(element)
		}
	],
	elementToolbars: [
		{ element: 'section', items: ['section', '|', ...ACTIONS], ariaLabel: 'Section toolbar' },
		{ element: 'li', items: ACTIONS, ariaLabel: 'List item toolbar' }
	],
	quickInsert: {
		labels: {
			paragraph: 'Paragraph',
			title: 'Title',
			shortdesc: 'Short description',
			body: 'Body',
			section: 'Section',
			ul: 'Bulleted list',
			ol: 'Numbered list',
			li: 'List item',
			note: 'Note',
			pre: 'Preformatted text',
			b: 'Bold',
			i: 'Italic',
			u: 'Underline',
			ph: 'Phrase',
			softBreak: 'Line break'
		},
		// A cross-reference needs its target: write it in the source. A list is made of blocks, with its button.
		exclude: ['xref', 'ul', 'ol']
	}
};
