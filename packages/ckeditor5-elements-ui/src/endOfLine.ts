import { Plugin } from 'ckeditor5';
import EndOfLineView from './endOfLineView.js';

/**
 * Registers the `#` component. Toolbar items after it start on a new line.
 */
export default class EndOfLine extends Plugin {
	public static get pluginName(): 'EndOfLine' {
		return 'EndOfLine' as const;
	}

	public init(): void {
		this.editor.ui.componentFactory.add('#', locale => new EndOfLineView(locale));
	}
}
