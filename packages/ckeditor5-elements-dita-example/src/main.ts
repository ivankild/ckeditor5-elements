import { ClassicEditor } from 'ckeditor5';
import { ditaConfig, ditaData } from './index.js';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';
import './content.css';
import './style.css';

const element = document.querySelector<HTMLElement>('#editor');
const output = document.querySelector<HTMLElement>('#output');

if (!element || !output) {
	throw new Error('The page has no #editor or #output element.');
}

const editor = await ClassicEditor.create({
	...ditaConfig,
	attachTo: element,
	licenseKey: 'GPL',
	root: { initialData: ditaData }
});

// The data of the editor, the XDITA of the topic, as it changes.
const update = (): void => {
	output.textContent = editor.getData();
};

editor.model.document.on('change:data', update);
update();

// To try the API in the browser console, e.g. `editor.getData()`.
Object.assign(window, { editor });
