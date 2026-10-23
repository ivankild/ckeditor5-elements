import type { ElementSelectable, ElementSelectableMatcher } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementSelectable.pluginName]: ElementSelectable;
	}

	interface EditorConfig {
		/**
		 * The elements that can be selected as a whole: names of model elements, or filter functions. See
		 * {@link ElementSelectable}.
		 */
		selectableElements?: ElementSelectableMatcher[];
	}
}
