import type { Breadcrumbs, BreadcrumbsConfig } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[Breadcrumbs.pluginName]: Breadcrumbs;
	}

	interface EditorConfig {
		/**
		 * The configuration of the {@link Breadcrumbs} plugin.
		 */
		breadcrumbs?: BreadcrumbsConfig;
	}
}
