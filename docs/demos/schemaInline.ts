import { Essentials, Paragraph, SourceEditing } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	QuickInsert,
	insertIcon
} from 'ckeditor5-elements';
import marks from './shared/inlineMarks.json';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [
			Essentials,
			SourceEditing,
			Paragraph,
			ElementSchema,
			// Selects the `empty` and `container` elements of the schema as a whole.
			ElementSelectable,
			// Lists what the schema allows at a position, in the context menu.
			QuickInsert,
			ElementContextMenu,
			// Shows the path to the cursor: what holds what.
			Breadcrumbs
		],
		// `-` starts a new toolbar line; it requires `shouldNotGroupWhenFull`.
		toolbar: { items: ['undo', 'redo', 'sourceEditing', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true },
		elementSchema: marks,
		// The elements are `div` and `span` in the data, and in the editor.
		elementSchemaConverters: true,
		// Right-click an element: Insert › Insert before / after lists what the schema allows there.
		elementContextMenu: (element, editor) => [
			{
				title: 'Insert',
				icon: insertIcon,
				items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
			}
		],
		quickInsert: { labels: { paragraph: 'Paragraph', mention: 'Mention', abbr: 'Abbreviation' } }
	},
	data:
		'<p>Ask <span class="mention" data-user="ada"></span> about the <span class="abbr" data-title="Content Management ' +
		'System">CMS</span>: it is an inline element with text, and an attribute of its own. Press Alt+Enter after ' +
		'a word to insert a mention, which is an empty inline element, or an abbreviation, and type in it.</p>' +
		'<p>Put the cursor in the abbreviation: the breadcrumbs show p › span.abbr, as for any element.</p>'
} satisfies Demo;
