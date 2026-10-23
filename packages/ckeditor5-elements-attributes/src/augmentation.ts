import type { ElementAttributes, ElementAttributesCommand } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementAttributes.pluginName]: ElementAttributes;
	}

	interface CommandsMap {
		showElementAttributes: ElementAttributesCommand;
	}
}
