import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import { QuickInsert } from 'ckeditor5-elements';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, QuickInsert],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading'],
		// Elements without a label are listed by their model name.
		quickInsert: { labels: { softBreak: 'Line break' } }
	},
	data:
		'<p>Put the cursor in the middle of this sentence and press Alt+Enter (Option+Enter on macOS). ' +
		'Inside a paragraph, only inline elements are allowed, so the menu offers a line break.</p>'
} satisfies Demo;
