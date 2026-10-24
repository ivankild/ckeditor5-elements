import {
	Essentials,
	IconHeading2,
	IconHorizontalLine,
	IconObjectInline,
	IconQuote,
	IconUser,
	Paragraph,
	_getModelData
} from 'ckeditor5';
import { Breadcrumbs, ElementSchema, ElementSchemaCommands, ElementSelectable } from 'ckeditor5-elements';
import commands from './shared/commands.json';
import type { Demo } from './shared/demo';

export default {
	config: {
		plugins: [Essentials, Paragraph, ElementSchema, ElementSelectable, ElementSchemaCommands, Breadcrumbs],
		toolbar: {
			items: ['undo', 'redo', '|', 'title', 'callout', 'divider', 'badge', 'chip', '-', 'breadcrumbs'],
			shouldNotGroupWhenFull: true
		},
		elementSchema: commands,
		elementSchemaConverters: true,
		// The command of each element is the one of its kind: a block, a container, an inserted element.
		elementSchemaCommands: {
			title: { title: 'Title', icon: IconHeading2 },
			callout: { title: 'Callout', icon: IconQuote },
			divider: { title: 'Divider', icon: IconHorizontalLine },
			badge: { title: 'Badge', icon: IconUser },
			chip: { title: 'Chip', icon: IconObjectInline }
		}
	},
	data:
		'<div class="title">Blocks, containers and inserted elements</div>' +
		'<p>Put the cursor here and press <b>Title</b>: the paragraph is renamed. Press it again: it is a paragraph.</p>' +
		'<div class="callout"><p>Press <b>Callout</b> in this callout: it is unwrapped. Select paragraphs and press it: ' +
		'they are wrapped.</p></div>' +
		'<p>Press <b>Divider</b> in the middle of this line: it splits it. <b>Badge</b> inserts an inline object, and ' +
		'<b>Chip</b> an inline box with a paragraph to type in.</p>',
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
