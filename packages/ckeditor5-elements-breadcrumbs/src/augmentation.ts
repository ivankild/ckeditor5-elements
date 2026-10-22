import type { Breadcrumbs } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[Breadcrumbs.pluginName]: Breadcrumbs;
	}
}
