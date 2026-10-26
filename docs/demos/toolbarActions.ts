import { Essentials, Heading, Paragraph, SourceEditing } from 'ckeditor5';
import { ElementActions, ElementToolbar } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

const ACTIONS = ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'];

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, Note, ElementActions, ElementToolbar],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading', '|', 'note'],
		elementToolbars: [
			// By name. The commands act on the note: "Note" unwraps it, "Move down" moves the whole note.
			{ element: 'note', items: ['note', '|', ...ACTIONS], ariaLabel: 'Note toolbar' },
			// By a filter. "heading" is a UI component (the heading dropdown), as in the main toolbar.
			{
				element: element => element.name.startsWith('heading'),
				items: ['heading', '|', ...ACTIONS],
				ariaLabel: 'Heading toolbar'
			}
		]
	},
	data:
		'<h2>Put the cursor in this heading</h2>' +
		'<p>A paragraph has no toolbar.</p>' +
		'<aside class="note"><p>Put the cursor in this note: its toolbar acts on the whole note.</p>' +
		'<p>Try <b>Move up</b>, <b>Duplicate</b>, or <b>Note</b>, which unwraps it.</p></aside>' +
		'<h3>Another heading</h3>'
} satisfies Demo;
