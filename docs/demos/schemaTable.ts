import { Bold, Essentials, Paragraph } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	QuickInsert,
	insertIcon
} from 'ckeditor5-elements';
import table from './shared/dataTable.json';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [
			Essentials,
			Paragraph,
			Bold,
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
		toolbar: { items: ['undo', 'redo', '|', 'bold', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true },
		elementSchema: table,
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
		quickInsert: {
			labels: {
				paragraph: 'Paragraph',
				dataTable: 'Table',
				dataRow: 'Row',
				dataCell: 'Cell',
				dataHeader: 'Header cell'
			}
		}
	},
	data:
		'<p>Right-click a cell, then <b>Insert › Insert after</b>: a cell and a header cell are offered, since they are ' +
		'allowed only in a row. In the paragraph, they are not.</p>' +
		'<div class="dataTable">' +
		'<div class="dataRow"><div class="dataHeader">Element</div><div class="dataHeader">Type</div><div class="dataHeader">Holds</div></div>' +
		'<div class="dataRow"><div class="dataCell">paragraph</div><div class="dataCell">block</div><div class="dataCell">text</div></div>' +
		'<div class="dataRow"><div class="dataCell">note</div><div class="dataCell">container</div><div class="dataCell">blocks</div></div>' +
		'</div>'
} satisfies Demo;
