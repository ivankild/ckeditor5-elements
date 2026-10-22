import type { ElementMenuConfig } from 'ckeditor5-elements-core';
import type { ElementContextMenu } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementContextMenu.pluginName]: ElementContextMenu;
	}

	interface EditorConfig {
		/**
		 * Returns the items (commands, submenus and `'|'` separators) of the context menu of the right-clicked element.
		 * See {@link ElementContextMenu}.
		 */
		elementContextMenu?: ElementMenuConfig;
	}
}
