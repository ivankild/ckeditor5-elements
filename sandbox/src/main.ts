import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import { Bold, ClassicEditor, Essentials, Heading, Italic, Paragraph } from 'ckeditor5';
import { Elements, EndOfLine } from 'ckeditor5-elements';
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { QuickInsert } from 'ckeditor5-elements-quick-insert';
import TitleElement from './title/titleElement.js';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';
import 'ckeditor5-elements-breadcrumbs/index.css';
import 'ckeditor5-elements-context-menu/index.css';
import 'ckeditor5-elements-quick-insert/index.css';
import './style.css';

declare global {
	interface Window {
		editor?: ClassicEditor;
	}
}

const element = document.querySelector<HTMLElement>('#editor');

if (!element) {
	throw new Error('Missing #editor element.');
}

const editor = await ClassicEditor.create({
	attachTo: element,
	licenseKey: 'GPL',
	plugins: [
		Essentials,
		Paragraph,
		Heading,
		Bold,
		Italic,
		Elements,
		TitleElement,
		Breadcrumbs,
		EndOfLine,
		ElementContextMenu,
		QuickInsert
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
			'|',
			'title',
			'insertElement',
			'#',
			'breadcrumbs'
		],
		shouldNotGroupWhenFull: true
	},
	// The default items, i.e. "Insert ›" (from quick insert) and the clipboard actions. Add or replace views here.
	elementContextMenu: (element, editor) => editor.plugins.get(ElementContextMenu).getDefaultItems(element),
	// Alt+Enter (Option+Enter on macOS) opens the quick insert menu.
	quickInsert: {
		labels: {
			paragraph: 'Paragraph',
			heading1: 'Heading 1',
			heading2: 'Heading 2',
			heading3: 'Heading 3',
			title: 'Title',
			element: 'Element',
			softBreak: 'Soft break'
		}
	},
	root: {
		initialData:
			'<section class="title"><p>This paragraph is wrapped with the title element.</p></section>' +
			'<p>Put the cursor here and click the <strong>Title</strong> button to wrap this paragraph.</p>'
	}
});

window.editor = editor;

CKEditorInspector.attach(editor);
