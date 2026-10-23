import type { ElementActions, ElementDeleteCommand, ElementDuplicateCommand, ElementMoveCommand } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementActions.pluginName]: ElementActions;
	}

	interface CommandsMap {
		moveElementUp: ElementMoveCommand;
		moveElementDown: ElementMoveCommand;
		duplicateElement: ElementDuplicateCommand;
		deleteElement: ElementDeleteCommand;
	}
}
