import { Plugin } from 'ckeditor5';
import ElementCopyCommand from './elementCopyCommand.js';
import ElementPasteCommand from './elementPasteCommand.js';

/**
 * Registers clipboard commands that act on a given element:
 * `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore` and `pasteElementAfter`.
 *
 * ```ts
 * await editor.execute('copyElement', element);
 * ```
 */
export default class ElementClipboard extends Plugin {
	public static get pluginName(): 'ElementClipboard' {
		return 'ElementClipboard' as const;
	}

	public init(): void {
		const editor = this.editor;

		editor.commands.add('copyElement', new ElementCopyCommand(editor));
		editor.commands.add('cutElement', new ElementCopyCommand(editor, { cut: true }));
		editor.commands.add('pasteElement', new ElementPasteCommand(editor, 'replace'));
		editor.commands.add('pasteElementBefore', new ElementPasteCommand(editor, 'before'));
		editor.commands.add('pasteElementAfter', new ElementPasteCommand(editor, 'after'));
	}
}
