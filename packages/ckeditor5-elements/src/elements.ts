import { Plugin } from 'ckeditor5';
import ElementsEditing from './elementsEditing.js';
import ElementsUI from './elementsUI.js';

/**
 * The "glue" plugin that loads both the core and the UI parts of the feature.
 */
export default class Elements extends Plugin {
	public static get requires(): readonly [typeof ElementsEditing, typeof ElementsUI] {
		return [ElementsEditing, ElementsUI] as const;
	}

	public static get pluginName(): 'Elements' {
		return 'Elements' as const;
	}
}
