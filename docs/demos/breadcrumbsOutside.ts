import { Essentials, Heading, Paragraph } from 'ckeditor5';
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Heading, Note, Breadcrumbs],
		toolbar: ['undo', 'redo', '|', 'heading', 'note']
	},
	data: '<h2>A heading</h2><aside class="note"><p>A paragraph in a note.</p></aside>',
	// The breadcrumbs can be placed anywhere: here, below the editor.
	ready(editor, container) {
		const view = editor.plugins.get('Breadcrumbs').createView();
		const below = document.createElement('div');

		view.render();

		if (view.element) {
			below.className = 'editor-demo__below';
			below.append(view.element);
			container.append(below);
		}

		editor.on('destroy', () => {
			view.destroy();
		});
	}
} satisfies Demo;
