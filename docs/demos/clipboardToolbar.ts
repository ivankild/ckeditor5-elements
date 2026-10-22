import { Essentials, Heading, Paragraph, Plugin } from 'ckeditor5';
import { ElementOrPositionButtonView } from 'ckeditor5-elements-core';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import type { Demo } from './shared/demo';

/**
 * Toolbar buttons for the clipboard commands. Without a target, they act on the element at the selection.
 */
class ClipboardButtons extends Plugin {
	public static get requires(): readonly [typeof ElementClipboard] {
		return [ElementClipboard] as const;
	}

	public init(): void {
		const editor = this.editor;

		for (const name of ['copyElement', 'cutElement', 'pasteElementBefore', 'pasteElementAfter'] as const) {
			const command = editor.commands.get(name);

			if (command) {
				editor.ui.componentFactory.add(
					name,
					locale => new ElementOrPositionButtonView(locale, command, { withText: true })
				);
			}
		}
	}
}

export default {
	config: {
		plugins: [Essentials, Paragraph, Heading, ClipboardButtons],
		toolbar: [
			'undo',
			'redo',
			'|',
			'heading',
			'|',
			'copyElement',
			'cutElement',
			'pasteElementBefore',
			'pasteElementAfter'
		]
	},
	data:
		'<h2>Put the cursor in a block</h2>' +
		'<p>Then use <b>Copy</b> or <b>Cut</b>: they act on the block with the cursor.</p>' +
		'<p><b>Paste before</b> and <b>Paste after</b> insert the clipboard next to it.</p>'
} satisfies Demo;
