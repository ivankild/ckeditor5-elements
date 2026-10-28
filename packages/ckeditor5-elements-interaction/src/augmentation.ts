import type {
	ElementClickable,
	ElementClickableDefinition,
	ElementSelectable,
	ElementSelectableMatcher
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementSelectable.pluginName]: ElementSelectable;
		[ElementClickable.pluginName]: ElementClickable;
	}

	interface EditorConfig {
		/**
		 * The elements that can be selected as a whole: names of model elements, or filter functions. See
		 * {@link ElementSelectable}.
		 */
		elementSelectable?: ElementSelectableMatcher[];

		/**
		 * The elements that react to clicks and double clicks. See {@link ElementClickable}.
		 */
		elementClickable?: ElementClickableDefinition[];
	}
}
