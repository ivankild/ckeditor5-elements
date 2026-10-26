import { Essentials, Paragraph, SourceEditing } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	QuickInsert,
	insertIcon
} from 'ckeditor5-elements';
import callouts from './shared/callouts.json';
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
		elementSchema: callouts,
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
				callout: 'Callout',
				calloutTitle: 'Callout title',
				pullQuote: 'Pull quote',
				cards: 'Cards',
				card: 'Card',
				divider: 'Divider',
				badge: 'Badge',
				term: 'Term'
			}
		}
	},
	data:
		'<p>Right-click this paragraph, then Insert › Insert after: a callout, a pull quote and a divider are ' +
		'offered, but not a callout title: the schema allows it only in a callout.</p>' +
		'<div class="callout"><div class="calloutTitle">A callout</div><p>Do the same in a block of the callout: now a ' +
		'callout title is offered too, and another callout.</p>' +
		'<div class="divider"></div></div>' +
		'<div class="cards"><div class="card"><p>Cards are inline containers in a block: Insert › Insert after on one ' +
		'adds another, in the line.</p></div><div class="card"><p>Two</p></div><div class="card"><p>Three</p></div></div>' +
		'<div class="pullQuote">A pull quote holds text. Press Alt+Enter in it: only inline elements fit in text: ' +
		'the badge, the term and a line break. A <span class="term" data-id="term-1">term</span> is an inline element with text and an ' +
		'<code>id</code>: click in it, and type.</div>'
} satisfies Demo;
