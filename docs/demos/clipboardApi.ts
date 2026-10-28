import { Essentials, Paragraph, SourceEditing, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements';
import type { Demo } from './shared/demo';

/**
 * Buttons outside the editor that execute the clipboard commands for specific elements.
 */
function addControls(editor: ClassicEditor, container: HTMLElement): void {
	const root = editor.model.document.getRoot();
	const controls = document.createElement('div');
	const status = document.createElement('div');

	const block = (index: number): ModelElement | undefined => {
		const node = root?.getChild(index < 0 ? root.childCount + index : index);

		return node?.is('element') ? node : undefined;
	};

	const actions: [label: string, run: () => Promise<void> | undefined, done: string][] = [
		['Copy the first block', () => run(block(0), element => editor.execute('copyElement', element)), 'Copied.'],
		[
			'Paste after the last block',
			() => run(block(-1), element => editor.execute('pasteElementAfter', element)),
			'Pasted.'
		],
		['Cut the block at the selection', () => editor.execute('cutElement'), 'Cut.']
	];

	controls.className = 'editor-demo__controls';
	status.className = 'editor-demo__status';

	for (const [label, action, done] of actions) {
		const button = document.createElement('button');

		button.textContent = label;
		button.addEventListener('click', () => {
			action()
				?.then(() => (status.textContent = done))
				.catch((error: unknown) => (status.textContent = `Failed: ${String(error)}`));
		});
		controls.append(button);
	}

	container.append(controls, status);
}

function run(
	element: ModelElement | undefined,
	execute: (element: ModelElement) => Promise<void>
): Promise<void> | undefined {
	return element ? execute(element) : undefined;
}

export default {
	config: {
		plugins: [Essentials, SourceEditing, Paragraph, ElementClipboard],
		toolbar: ['undo', 'redo', 'sourceEditing']
	},
	data: '<p>The first block.</p><p>The second block.</p><p>The last block.</p>',
	ready: addControls
} satisfies Demo;
