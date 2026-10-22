import { Bold, Essentials, Heading, Italic, Paragraph } from 'ckeditor5';
import { EndOfLine } from 'ckeditor5-elements-ui';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Heading, Bold, Italic, Note, EndOfLine],
		toolbar: {
			// Two toolbar lines: editing on the first, formatting on the second.
			items: ['undo', 'redo', '|', 'heading', '#', 'bold', 'italic', '|', 'note'],
			// The toolbar must wrap its items, instead of grouping them in a "⋮" dropdown.
			shouldNotGroupWhenFull: true
		}
	},
	data: '<p>The toolbar has two lines: <code>#</code> starts the second one.</p>'
} satisfies Demo;
