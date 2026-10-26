import type {
	ElementBreadcrumbs,
	ElementBreadcrumbsConfig,
	ElementContextMenu,
	ElementMenu,
	ElementMenuConfig,
	ElementQuickInsert,
	QuickInsertCommand,
	ElementQuickInsertConfig,
	QuickInsertPositionCommand
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementMenu.pluginName]: ElementMenu;
		[ElementContextMenu.pluginName]: ElementContextMenu;
		[ElementBreadcrumbs.pluginName]: ElementBreadcrumbs;
		[ElementQuickInsert.pluginName]: ElementQuickInsert;
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
		 * The configuration of the {@link ElementBreadcrumbs} plugin.
		 */
		elementBreadcrumbs?: ElementBreadcrumbsConfig;

		/**
		 * The configuration of the {@link ElementQuickInsert} plugin.
		 */
		elementQuickInsert?: ElementQuickInsertConfig;
	}
}
