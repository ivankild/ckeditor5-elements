import { ClipboardPipeline, Notification, Plugin } from 'ckeditor5';
import ElementCopyCommand from './elementCopyCommand.js';
import ElementPasteCommand from './elementPasteCommand.js';

/**
 * Registers clipboard commands that act on an element:
 * `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore` and `pasteElementAfter`.
 *
 * ```ts
 * await editor.execute('copyElement', element);
 * ```
 *
 * The commands have titles and icons, so they can be menu items (e.g. in the `elementContextMenu` config of
 * `ckeditor5-elements-context-menu`) and buttons. Copying and pasting go through the clipboard pipeline, as Ctrl+C and
 * Ctrl+V do.
 */
export default class ElementClipboard extends Plugin {
	public static get requires(): readonly [typeof ClipboardPipeline, typeof Notification] {
		// The buttons of the commands report failures (e.g. no clipboard permission) with notifications.
		return [ClipboardPipeline, Notification] as const;
	}

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
