import {
	Essentials,
	IconCodeBlock,
	IconHeading2,
	IconHorizontalLine,
	IconNumberedList,
	IconObjectInline,
	IconQuote,
	IconUser,
	Paragraph,
	SourceEditing,
	_getModelData
} from 'ckeditor5';
import { ElementBreadcrumbs, ElementSchema, ElementSchemaCommands, ElementSelectable } from 'ckeditor5-elements';
import commands from './shared/commands.json';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [
			Essentials,
			SourceEditing,
			Paragraph,
			ElementSchema,
			ElementSelectable,
			ElementSchemaCommands,
			ElementBreadcrumbs
		],
		toolbar: {
			items: [
				'undo',
				'redo',
				'sourceEditing',
				'|',
				'title',
				'callout',
				'code',
				'steps',
				'divider',
				'badge',
				'chip',
				'-',
				'breadcrumbs'
			],
			shouldNotGroupWhenFull: true
		},
		elementSchema: commands,
		elementSchemaConverters: true,
		// The command of each element is the one of its kind: a block, a container, a list, an inserted element.
		elementSchemaCommands: {
			title: { title: 'Title', icon: IconHeading2 },
			callout: { title: 'Callout', icon: IconQuote },
			code: { title: 'Code', icon: IconCodeBlock },
			steps: { title: 'Steps', icon: IconNumberedList },
			divider: { title: 'Divider', icon: IconHorizontalLine },
			badge: { title: 'Badge', icon: IconUser },
			chip: { title: 'Chip', icon: IconObjectInline }
		}
	},
	data:
		'<div class="title">Blocks, containers, lists and inserted elements</div>' +
		'<p>Put the cursor here and press Title: the paragraph is renamed. Press it again: it is a paragraph.</p>' +
		'<div class="callout"><p>Press Callout in this callout: it is unwrapped. Select paragraphs and press it: they ' +
		'are wrapped.</p></div>' +
		'<pre class="code">Code keeps its whitespace:\n  press Enter for a new line,\n  and Enter on an empty last line ' +
		'to leave it.</pre>' +
		'<div class="steps"><div class="step"><p>Steps are a list: press Enter at the end of this step.</p></div>' +
		'<div class="step"><p>Press Enter in an empty step to leave the list.</p></div></div>' +
		'<p>Press Divider in the middle of this line: it splits it. Badge inserts an inline object, and Chip an inline ' +
		'box with a paragraph to type in.</p>',
	// Shows the model below the editor, as it changes: elements, where CKEditor's features would have attributes.
	ready: (editor, container) => {
		const model = document.createElement('div');
		const update = (): void => {
			model.textContent = _getModelData(editor.model, { withoutSelection: true });
		};

		model.className = 'editor-demo__below editor-demo__model';
		container.append(model);
		editor.model.document.on('change:data', update);
		update();
	}
} satisfies Demo;
