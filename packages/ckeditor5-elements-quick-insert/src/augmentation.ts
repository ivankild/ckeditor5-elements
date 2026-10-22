import type { QuickInsert, QuickInsertCommand, QuickInsertConfig, QuickInsertPositionCommand } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[QuickInsert.pluginName]: QuickInsert;
	}

	interface CommandsMap {
		quickInsert: QuickInsertCommand;
		quickInsertBefore: QuickInsertPositionCommand;
		quickInsertAfter: QuickInsertPositionCommand;
	}

	interface EditorConfig {
		/**
		 * The configuration of the {@link QuickInsert} plugin.
		 */
		quickInsert?: QuickInsertConfig;
	}
}
