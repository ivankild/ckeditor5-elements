import { Plugin, type Editor } from 'ckeditor5';
import { ElementButtonView, ElementContainerCommand } from 'ckeditor5-elements';

const noteIcon =
	'<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
	'<path d="M4 3h12v14H4zm1.5 1.5v11h9v-11zM7 7h6v1.5H7zm0 3h6v1.5H7z"/></svg>';

const warningIcon =
	'<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="' +
	'M10 2.2 18.6 17H1.4zm0 3L4 15.5h12zM9.25 8h1.5v4h-1.5zm0 5h1.5v1.5h-1.5z"/></svg>';

/**
 * Wraps blocks with a note, or unwraps the note they are in. With a `type`, only notes of that type: an
 * `ElementCommand` matches an element by its name and attributes.
 */
export class NoteCommand extends ElementContainerCommand {
	constructor(editor: Editor, type?: string) {
		super(editor, 'note');

		if (type) {
			this.elementAttributes = { type };
		}
	}
}

/**
 * A note: an element that holds blocks, `<aside class="note">`. A warning is a note with the `warning` type,
 * `<aside class="note warning">`.
 *
 * The `note` command toggles a note (any note is "on" for it), and the `warning` command toggles a warning. Their
 * toolbar buttons have the same names.
 */
export class Note extends Plugin {
	public static get pluginName(): 'Note' {
		return 'Note' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;

		editor.model.schema.register('note', {
			allowWhere: '$block',
			allowContentOf: '$root',
			allowAttributes: ['type']
		});
		editor.conversion.elementToElement({ model: 'note', view: { name: 'aside', classes: 'note' } });
		editor.conversion.attributeToAttribute({
			model: { name: 'note', key: 'type', values: ['warning'] },
			view: { warning: { key: 'class', value: 'warning' } }
		});

		this._addCommand('note', new NoteCommand(editor), t('Note'), noteIcon);
		this._addCommand('warning', new NoteCommand(editor, 'warning'), t('Warning'), warningIcon);
	}

	private _addCommand(name: 'note' | 'warning', command: NoteCommand, title: string, icon: string): void {
		const editor = this.editor;

		command.set({ title, icon });
		editor.commands.add(name, command);
		editor.ui.componentFactory.add(name, locale => new ElementButtonView(locale, command));
	}
}

declare module 'ckeditor5' {
	interface PluginsMap {
		[Note.pluginName]: Note;
	}

	interface CommandsMap {
		note: NoteCommand;
		warning: NoteCommand;
	}
}
