import { Bold, Essentials, List, Paragraph, Table } from 'ckeditor5';
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { Note } from './shared/note';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, Bold, List, Table, Note, Breadcrumbs],
		// `-` (CKEditor's line break) starts a new toolbar line; it requires `shouldNotGroupWhenFull`.
		toolbar: {
			items: ['undo', 'redo', '|', 'bold', 'note', 'bulletedList', 'insertTable', '-', 'breadcrumbs'],
			shouldNotGroupWhenFull: true
		}
		// No `breadcrumbs.menu`: the breadcrumbs are labels.
	},
	data:
		'<aside class="note"><p>Move the cursor here: the path is <code>aside.note › p</code>.</p></aside>' +
		'<p>Text attributes such as <strong>bold</strong> are not part of the path.</p>' +
		'<ul><li>In a list item: <code>ul › li</code>.</li></ul>' +
		'<figure class="table"><table><tbody><tr><td>In a table cell</td><td>' +
		'<code>figure.table › table › tbody › tr › td</code></td></tr></tbody></table></figure>'
} satisfies Demo;
