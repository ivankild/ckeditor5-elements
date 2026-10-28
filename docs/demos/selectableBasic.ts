import { Bold, Essentials, Paragraph, SourceEditing } from 'ckeditor5';
import { ElementBreadcrumbs, ElementSchema, ElementSelectable } from 'ckeditor5-elements';
import type { Demo } from './shared/demo';

// The model elements of the demo: a callout (a container), a divider and a badge (empty elements).
const schema = {
	callout: { type: 'container' },
	divider: { type: 'empty' },
	badge: { type: 'empty', isInline: true, allowAttributes: ['color'] }
} as const;

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Bold, ElementSchema, ElementSelectable, ElementBreadcrumbs],
		toolbar: {
			items: ['undo', 'redo', 'sourceEditing', '|', 'bold', '-', 'breadcrumbs'],
			shouldNotGroupWhenFull: true
		},
		// The elements come from the schema (converted one to one: `div` and `span`).
		elementSchema: schema,
		elementSchemaConverters: true
		// `ElementSchema` makes its `empty` and `container` elements selectable. For other elements, by name or by a
		// filter function, use the option: `elementSelectable: ['imageBlock', element => element.hasAttribute('x')]`.
	},
	data:
		'<p>Click the divider below, or put the cursor at the end of this line and press <b>→</b>: the next element is ' +
		'selected, and a frame shows it. <b>→</b> again moves the cursor out of it.</p>' +
		'<div class="divider"></div>' +
		'<div class="callout"><p>A callout is a container: click on its frame, not on the text, to select it. <b>Esc</b> ' +
		'in the text selects the callout, and <b>Backspace</b> deletes it.</p></div>' +
		'<p>Inline elements too: a <span class="badge"></span> in the text is selected by a click on it, or by an arrow key ' +
		'next to it.</p>'
} satisfies Demo;
