import type {
	Breadcrumbs,
	BreadcrumbsConfig,
	ElementContextMenu,
	ElementMenu,
	ElementMenuConfig,
	QuickInsert,
	QuickInsertCommand,
	QuickInsertConfig,
	QuickInsertPositionCommand
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementMenu.pluginName]: ElementMenu;
		[ElementContextMenu.pluginName]: ElementContextMenu;
		[Breadcrumbs.pluginName]: Breadcrumbs;
		[QuickInsert.pluginName]: QuickInsert;
	}

	interface CommandsMap {
		quickInsert: QuickInsertCommand;
		quickInsertBefore: QuickInsertPositionCommand;
		quickInsertAfter: QuickInsertPositionCommand;
	}

	interface EditorConfig {
		/**
		 * Returns the items (commands, submenus and `'|'` separators) of the context menu of the right-clicked element.
		 * See {@link ElementContextMenu}.
		 */
		elementContextMenu?: ElementMenuConfig;

		/**
		 * The configuration of the {@link Breadcrumbs} plugin.
		 */
		breadcrumbs?: BreadcrumbsConfig;

		/**
		 * The configuration of the {@link QuickInsert} plugin.
		 */
		quickInsert?: QuickInsertConfig;
	}
}
