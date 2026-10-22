import type { ElementClipboard, ElementCopyCommand, ElementPasteCommand } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementClipboard.pluginName]: ElementClipboard;
	}

	interface CommandsMap {
		copyElement: ElementCopyCommand;
		cutElement: ElementCopyCommand;
		pasteElement: ElementPasteCommand;
		pasteElementBefore: ElementPasteCommand;
		pasteElementAfter: ElementPasteCommand;
	}
}
