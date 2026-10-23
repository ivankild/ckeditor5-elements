import callouts from './shared/callouts.json';
import { schemaDemo } from './shared/schemaDemo';

export default schemaDemo(callouts, {
	// An empty inline element cannot take the cursor in the browser: see "Inline text elements" in the guide.
	exclude: ['term'],
	labels: {
		callout: 'Callout',
		calloutTitle: 'Callout title',
		pullQuote: 'Pull quote',
		cards: 'Cards',
		card: 'Card',
		divider: 'Divider',
		badge: 'Badge'
	},
	data:
		'<p>Right-click this paragraph, then <b>Insert › Insert after</b>: a callout, a pull quote and a divider are ' +
		'offered, but not a callout title: the schema allows it only in a callout.</p>' +
		'<div class="callout"><div class="calloutTitle">A callout</div><p>Do the same in a block of the callout: now a ' +
		'<b>callout title</b> is offered too, and another callout.</p>' +
		'<div class="divider"></div></div>' +
		'<div class="cards"><div class="card"><p>Cards are inline containers in a block: <b>Insert › Insert after</b> on one ' +
		'adds another, in the line.</p></div><div class="card"><p>Two</p></div><div class="card"><p>Three</p></div></div>' +
		'<div class="pullQuote">A pull quote holds text. Press <b>Alt+Enter</b> in it: only inline elements fit in text: ' +
		'the badge and a line break. A <span class="term" data-id="term-1">term</span> is an inline element with text and an ' +
		'<code>id</code>: click in it, and type.</div>'
});
