import { Essentials, Heading, Paragraph, SourceEditing, type ClassicEditor } from 'ckeditor5';
import { QuickInsert } from 'ckeditor5-elements';
import type { Demo } from './shared/demo';

/**
 * Buttons outside the editor that execute the `quickInsert` command.
 */
function addControls(editor: ClassicEditor, container: HTMLElement): void {
	const root = editor.model.document.getRoot();
	const controls = document.createElement('div');

	const actions: [label: string, run: () => void][] = [
		// With an element name: inserts it. The target comes first: here, the position at the end of the root.
		[
			'Insert a heading at the end',
			() => {
				if (root) {
					editor.execute('quickInsert', editor.model.createPositionAt(root, 'end'), 'heading2');
				}
			}
		],
		// Without a name: opens the menu. An element as the target means the position before it.
		[
			'Open the menu before the first block',
			() => {
				const first = root?.getChild(0);

				if (first?.is('element')) {
					editor.execute('quickInsert', first);
				}
			}
		]
	];

	controls.className = 'editor-demo__controls';

	for (const [label, run] of actions) {
		const button = document.createElement('button');

		button.textContent = label;
		button.addEventListener('click', run);
		controls.append(button);
	}

	container.append(controls);
}

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, Heading, QuickInsert],
		toolbar: ['undo', 'redo', 'sourceEditing', '|', 'heading'],
		quickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2' } }
	},
	data: '<p>The first block.</p><p>The last block.</p>',
	ready: addControls
} satisfies Demo;
