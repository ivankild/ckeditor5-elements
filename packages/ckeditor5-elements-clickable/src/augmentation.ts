import type { ElementClickable, ElementClickableDefinition } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementClickable.pluginName]: ElementClickable;
	}

	interface EditorConfig {
		/**
		 * The elements that react to clicks and double clicks. See {@link ElementClickable}.
		 */
		elementClickables?: ElementClickableDefinition[];
	}
}
