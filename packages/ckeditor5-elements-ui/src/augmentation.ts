import type { EndOfLine } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[EndOfLine.pluginName]: EndOfLine;
	}
}
