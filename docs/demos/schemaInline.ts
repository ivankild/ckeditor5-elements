import marks from './shared/inlineMarks.json';
import { schemaDemo } from './shared/schemaDemo';

export default schemaDemo(marks, {
	// An empty inline element cannot take the cursor in the browser: see "Inline text elements" in the schema guide.
	exclude: ['abbr'],
	labels: { mention: 'Mention' },
	data:
		'<p>Ask <span class="mention" data-user="ada"></span> about the <span class="abbr" data-title="Content Management ' +
		'System">CMS</span>: it is an inline element with text, and an attribute of its own. Press <b>Alt+Enter</b> after ' +
		'a word to insert a mention, which is an empty inline element.</p>' +
		'<p>Select the abbreviation: <b>Bold</b> works inside it, as in any text.</p>'
});
