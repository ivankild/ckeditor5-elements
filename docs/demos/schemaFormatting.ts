import { Essentials, IconBold, IconItalic, IconUnderline, Paragraph, SourceEditing, _getModelData } from 'ckeditor5';
import { ElementBreadcrumbs, ElementSchema, ElementSchemaCommands } from 'ckeditor5-elements';
import formatting from './shared/formatting.json';
import type { Demo } from './shared/demo';

export default {
	config: {
		// No `Bold`, `Italic` and `Underline` of CKEditor: the buttons are the ones of `ElementSchemaCommands`.
		plugins: [Essentials, SourceEditing, Paragraph, ElementSchema, ElementSchemaCommands, ElementBreadcrumbs],
		toolbar: {
			items: ['undo', 'redo', 'sourceEditing', '|', 'bold', 'italic', 'underline', '-', 'breadcrumbs'],
			shouldNotGroupWhenFull: true
		},
		// The elements are `<strong>`, `<em>` and `<u>`: the `tag` of each one, with the converters of the schema.
		elementSchema: formatting,
		elementSchemaConverters: true,
		elementSchemaCommands: {
			bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B' },
			italic: { title: 'Italic', icon: IconItalic, keystroke: 'Ctrl+I' },
			underline: { title: 'Underline', icon: IconUnderline, keystroke: 'Ctrl+U' }
		}
	},
	data:
		'<p>Select text and press <strong>Bold</strong>, <em>Italic</em> or <u>Underline</u>, or ' +
		'<strong><em>both</em></strong> at once: each one is an <strong>element</strong>, as the breadcrumbs and the ' +
		'model below show.</p>' +
		'<p>Put the cursor here, press <strong>Ctrl+B</strong> and type: the text goes in a new bold. Press the right ' +
		'arrow at the end of a <strong>bold</strong>: the first press goes out of it, and what is typed is not bold.</p>',
	// Shows the model below the editor, as it changes: elements, where CKEditor's features would have attributes.
	ready: (editor, container) => {
		const model = document.createElement('div');
		const update = (): void => {
			model.textContent = _getModelData(editor.model, { withoutSelection: true });
		};

		model.className = 'editor-demo__below editor-demo__model';
		container.append(model);
		editor.model.document.on('change:data', update);
		update();
	}
} satisfies Demo;
