import type { ElementCommand } from 'ckeditor5-elements-core';
import type { Elements, ElementsEditing, ElementsUI, InsertElementCommand } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[Elements.pluginName]: Elements;
		[ElementsEditing.pluginName]: ElementsEditing;
		[ElementsUI.pluginName]: ElementsUI;
	}

	interface CommandsMap {
		element: ElementCommand;
		insertElement: InsertElementCommand;
	}
}
