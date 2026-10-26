import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

export default {
	// The `note` button is an `ElementButtonView` for `NoteCommand`, an `ElementCommand` (see `shared/note.ts`).
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, Note],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', '|', 'note']
	},
	data:
		'<p>Put the cursor here and click the <b>Note</b> button: the paragraph is wrapped with a note.</p>' +
		'<aside class="note"><p>Inside a note, the button is on, and clicking it unwraps the note.</p></aside>'
} satisfies Demo;
