import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import { ElementBreadcrumbs } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, Note, ElementBreadcrumbs],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', 'note']
	},
	data: '<h2>A heading</h2><aside class="note"><p>A paragraph in a note.</p></aside>',
	// The breadcrumbs can be placed anywhere: here, below the editor.
	ready(editor, container) {
		const view = editor.plugins.get('ElementBreadcrumbs').createView();
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
