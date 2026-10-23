import type { ElementToolbar, ElementToolbarDefinition } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementToolbar.pluginName]: ElementToolbar;
	}

	interface EditorConfig {
		/**
		 * The floating toolbars of elements. See {@link ElementToolbar}.
		 */
		elementToolbars?: ElementToolbarDefinition[];
	}
}
