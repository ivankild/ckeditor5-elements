import { ClassicEditor } from 'ckeditor5';
import { exampleConfig, exampleData } from './index.js';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';
import './content.css';
import './style.css';

const element = document.querySelector<HTMLElement>('#editor');

if (!element) {
	throw new Error('The page has no #editor element.');
}

const editor = await ClassicEditor.create({
	...exampleConfig,
	attachTo: element,
	licenseKey: 'GPL',
	root: { initialData: exampleData }
});

// To try the API in the browser console, e.g. `editor.commands.get('moveElementUp').executeFor(element)`.
Object.assign(window, { editor });
