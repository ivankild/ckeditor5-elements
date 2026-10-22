import type { ElementMenu } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementMenu.pluginName]: ElementMenu;
	}
}
