import type {
	ElementCommand,
	Elements,
	ElementsEditing,
	ElementsUI,
	EndOfLine,
	InsertElementCommand
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[Elements.pluginName]: Elements;
		[ElementsEditing.pluginName]: ElementsEditing;
		[ElementsUI.pluginName]: ElementsUI;
		[EndOfLine.pluginName]: EndOfLine;
	}

	interface CommandsMap {
		element: ElementCommand;
		insertElement: InsertElementCommand;
	}
}
