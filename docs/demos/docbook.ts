import { docBookConfig, docBookData } from 'ckeditor5-elements-docbook-example';
import type { Demo } from './shared/demo';

export default {
	config: docBookConfig,
	data: docBookData,
	// The data of the editor, the DocBook XML of the article, below it, as it changes.
	ready: (editor, container) => {
		const output = document.createElement('pre');
		const update = (): void => {
			output.textContent = editor.getData();
		};

		output.className = 'editor-demo__below editor-demo__xml';
		container.append(output);
		editor.model.document.on('change:data', update);
		update();
	}
} satisfies Demo;
