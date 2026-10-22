import type { QuickInsert, QuickInsertCommand, QuickInsertConfig } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[QuickInsert.pluginName]: QuickInsert;
	}

	interface CommandsMap {
		quickInsert: QuickInsertCommand;
	}

	interface EditorConfig {
		/**
		 * The configuration of the {@link QuickInsert} plugin.
		 */
		quickInsert?: QuickInsertConfig;
	}
}
