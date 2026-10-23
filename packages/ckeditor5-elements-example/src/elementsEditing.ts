import { Plugin } from 'ckeditor5';
import InsertElementCommand from './insertElementCommand.js';

/**
 * Registers the `element` model element, its converters and the `insertElement` command.
 */
export default class ElementsEditing extends Plugin {
	public static get pluginName(): 'ElementsEditing' {
		return 'ElementsEditing' as const;
	}

	public init(): void {
		const editor = this.editor;

		editor.model.schema.register('element', {
			inheritAllFrom: '$blockObject'
		});

		editor.conversion.elementToElement({
			model: 'element',
			view: {
				name: 'div',
				classes: 'ck-element'
			}
		});

		editor.commands.add('insertElement', new InsertElementCommand(editor));
	}
}
