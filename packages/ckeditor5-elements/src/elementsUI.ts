import { Plugin, ButtonView } from 'ckeditor5';
import ElementsEditing from './elementsEditing.js';
import { ElementButtonView, ElementCommand } from 'ckeditor5-elements-ui';

const icon =
	'<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
	'<path d="M3 3h14v14H3zm1.5 1.5v11h11v-11zM7 9.25h2.25V7h1.5v2.25H13v1.5h-2.25V13h-1.5v-2.25H7z"/></svg>';

/**
 * Registers the `element` command with its toolbar button, and the `insertElement` toolbar button.
 */
export default class ElementsUI extends Plugin {
	public static get requires(): readonly [typeof ElementsEditing] {
		return [ElementsEditing] as const;
	}

	public static get pluginName(): 'ElementsUI' {
		return 'ElementsUI' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;
		const elementCommand = new ElementCommand(editor);

		elementCommand.set({
			title: t('Element'),
			icon
		});

		editor.commands.add('element', elementCommand);

		editor.ui.componentFactory.add('element', locale => new ElementButtonView(locale, elementCommand));

		editor.ui.componentFactory.add('insertElement', locale => {
			const button = new ButtonView(locale);

			button.set({
				label: t('Insert element'),
				icon,
				tooltip: true
			});

			const command = editor.commands.get('insertElement');

			if (command) {
				button.bind('isEnabled').to(command, 'isEnabled');
			}

			button.on('execute', () => {
				editor.execute('insertElement');
				editor.editing.view.focus();
			});

			return button;
		});
	}
}
