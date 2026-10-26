import { ditaConfig, ditaData } from 'ckeditor5-elements-dita-example';
import type { Demo } from './shared/demo';

export default {
	config: ditaConfig,
	data: ditaData,
	// The data of the editor, the XDITA of the topic, below it, as it changes.
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
