import { Plugin } from 'ckeditor5';
import { ElementButtonView } from 'ckeditor5-elements-ui';
import TitleCommand from './titleCommand.js';

/**
 * Registers the `title` model element (a container for blocks), the `title` command and the `title` button.
 */
export default class TitleElement extends Plugin {
	public static get pluginName(): 'TitleElement' {
		return 'TitleElement' as const;
	}

	public init(): void {
		const editor = this.editor;

		editor.model.schema.register('title', {
			allowWhere: '$block',
			allowContentOf: '$root'
		});

		editor.conversion.elementToElement({
			model: 'title',
			view: { name: 'section', classes: 'title' }
		});

		const command = new TitleCommand(editor);

		editor.commands.add('title', command);
		editor.ui.componentFactory.add('title', locale => new ElementButtonView(locale, command));
	}
}

declare module 'ckeditor5' {
	interface PluginsMap {
		[TitleElement.pluginName]: TitleElement;
	}

	interface CommandsMap {
		title: TitleCommand;
	}
}
