import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

export default {
	// The `note` button is an `ElementButtonView` for `NoteCommand`, an `ElementContainerCommand` (see `note.ts` of
	// `ckeditor5-elements-example`).
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, Note],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', '|', 'note']
	},
	data:
		'<p>Put the cursor here and click the <b>Note</b> button: the paragraph is wrapped with a note. Select two paragraphs: both are.</p>' +
		'<p>A second paragraph.</p>' +
		'<aside class="note"><p>Inside a note, the button is on, and clicking it unwraps the note.</p></aside>'
} satisfies Demo;
