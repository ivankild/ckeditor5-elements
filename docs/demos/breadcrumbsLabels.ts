import { Bold, Essentials, Paragraph } from 'ckeditor5';
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Bold, Note, Breadcrumbs],
		// `-` (CKEditor's line break) starts a new toolbar line; it requires `shouldNotGroupWhenFull`.
		toolbar: { items: ['undo', 'redo', '|', 'bold', 'note', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true }
		// No `breadcrumbs.menu`: the breadcrumbs are labels.
	},
	data:
		'<aside class="note"><p>Move the cursor here: the path is <code>aside.note › p</code>.</p></aside>' +
		'<p>Text attributes such as <strong>bold</strong> are not part of the path.</p>'
} satisfies Demo;
