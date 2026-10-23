import { Plugin, type Editor } from 'ckeditor5';
import { ElementButtonView, ElementCommand } from 'ckeditor5-elements';

const noteIcon =
	'<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
	'<path d="M4 3h12v14H4zm1.5 1.5v11h9v-11zM7 7h6v1.5H7zm0 3h6v1.5H7z"/></svg>';

/**
 * Wraps blocks with a note, or unwraps them.
 */
export class NoteCommand extends ElementCommand {
	constructor(editor: Editor) {
		super(editor);

		this.elementName = 'note';
		this.set({ title: editor.t('Note'), icon: noteIcon });
	}
}

/**
 * A `note` element that holds blocks (`<aside class="note">`), the `note` command and the `note` toolbar button.
 */
export class Note extends Plugin {
	public static get pluginName(): 'Note' {
		return 'Note' as const;
	}

	public init(): void {
		const editor = this.editor;
		const command = new NoteCommand(editor);

		editor.model.schema.register('note', { allowWhere: '$block', allowContentOf: '$root' });
		editor.conversion.elementToElement({ model: 'note', view: { name: 'aside', classes: 'note' } });

		editor.commands.add('note', command);
		editor.ui.componentFactory.add('note', locale => new ElementButtonView(locale, command));
	}
}

declare module 'ckeditor5' {
	interface PluginsMap {
		[Note.pluginName]: Note;
	}

	interface CommandsMap {
		note: NoteCommand;
	}
}
