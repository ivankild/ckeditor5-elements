import type {
	ElementActions,
	ElementClipboard,
	ElementCopyCommand,
	ElementDeleteCommand,
	ElementDuplicateCommand,
	ElementMoveCommand,
	ElementPasteCommand
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementActions.pluginName]: ElementActions;
		[ElementClipboard.pluginName]: ElementClipboard;
	}

	interface CommandsMap {
		moveElementUp: ElementMoveCommand;
		moveElementDown: ElementMoveCommand;
		duplicateElement: ElementDuplicateCommand;
		deleteElement: ElementDeleteCommand;
		copyElement: ElementCopyCommand;
		cutElement: ElementCopyCommand;
		pasteElement: ElementPasteCommand;
		pasteElementBefore: ElementPasteCommand;
		pasteElementAfter: ElementPasteCommand;
	}
}
