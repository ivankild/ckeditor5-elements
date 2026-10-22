import type {
	ElementClipboard,
	ElementContextMenu,
	ElementContextMenuItems,
	ElementCopyCommand,
	ElementPasteCommand
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementContextMenu.pluginName]: ElementContextMenu;
		[ElementClipboard.pluginName]: ElementClipboard;
	}

	interface CommandsMap {
		copyElement: ElementCopyCommand;
		cutElement: ElementCopyCommand;
		pasteElement: ElementPasteCommand;
		pasteElementBefore: ElementPasteCommand;
		pasteElementAfter: ElementPasteCommand;
	}

	interface EditorConfig {
		/**
		 * Returns the views shown in the context menu of the right-clicked element. Replaces the default items;
		 * see {@link ElementContextMenu}.
		 */
		elementContextMenu?: ElementContextMenuItems;
	}
}
