import { Plugin, type Editor } from 'ckeditor5';
import {
	ElementBlockCommand,
	ElementButtonView,
	ElementContainerCommand,
	ElementInlineCommand,
	ElementInsertCommand,
	ElementListCommand,
	type ElementCommand
} from 'ckeditor5-elements-core';
import { getModelKind } from './definition/modelKind.js';
import { getLists } from './definition/queries.js';
import ElementSchema from './elementSchema.js';

/**
 * An element of {@link ElementSchemaCommands}: its command and its button.
 */
export interface ElementSchemaCommandDefinition {
	/**
	 * The model element: of the element schema, or of another plugin. Default: the name of the command.
	 */
	element?: string;

	/**
	 * The title of the command, and the label of its button, e.g. `'Bold'`.
	 */
	title: string;

	/**
	 * The icon of the command and of its button (an SVG string), e.g. `IconBold` of CKEditor.
	 */
	icon?: string;

	/**
	 * The keystroke that executes the command, e.g. `'Ctrl+B'`.
	 */
	keystroke?: string;
}

/**
 * The `elementSchemaCommands` option: the elements, by the name of their command and of their button.
 */
export type ElementSchemaCommandsConfig = Record<string, ElementSchemaCommandDefinition>;

/**
 * A command, a toolbar button and a keystroke for every element of the element schema, formatting included: the command
 * of an element is the one of its kind (see {@link ElementCommand}), and works as the CKEditor feature of that
 * kind.
 *
 * | Element                       | Command                     | Works as CKEditor's           |
 * | ----------------------------- | --------------------------- | ----------------------------- |
 * | inline `block`                | {@link ElementInlineCommand}    | bold: wraps text              |
 * | `block`                       | {@link ElementBlockCommand}     | heading: renames blocks       |
 * | `container`                   | {@link ElementContainerCommand} | block quote: wraps blocks     |
 * | `empty`, inline `container`   | {@link ElementInsertCommand}    | horizontal line: inserts      |
 * | `container` with `listItem`   | {@link ElementListCommand}      | lists: wraps blocks in items  |
 *
 * ```ts
 * elementSchema: schema,
 * elementSchemaCommands: {
 *   bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B' },
 *   callout: { title: 'Callout', icon: IconQuote },
 *   divider: { title: 'Divider', icon: IconHorizontalLine }
 * },
 * toolbar: ['bold', 'callout', 'divider']
 * ```
 *
 * Each key is the name of the command and of its toolbar button. The commands have titles and icons, so they can be
 * menu items too, e.g. of the context menu.
 *
 * The commands are made when the elements are registered, after `ElementSchema` and the other plugins are initialized.
 * The editor is not created when an element is unknown.
 */
export default class ElementSchemaCommands extends Plugin {
	public static get pluginName(): 'ElementSchemaCommands' {
		return 'ElementSchemaCommands' as const;
	}

	public static get requires(): readonly [typeof ElementSchema] {
		return [ElementSchema] as const;
	}

	/**
	 * The commands, by their name.
	 */
	private readonly _commands = new Map<string, ElementCommand>();

	public init(): void {
		const editor = this.editor;

		for (const [name, { title, keystroke }] of this._getDefinitions()) {
			if (keystroke) {
				editor.keystrokes.set(keystroke, name);
				editor.accessibility.addKeystrokeInfos({ keystrokes: [{ label: title, keystroke }] });
			}

			editor.ui.componentFactory.add(name, locale => {
				const command = this._commands.get(name);

				// The commands are made in `afterInit()`, and the toolbars after it.
				if (!command) {
					throw new Error(`elementSchemaCommands.${name}: the button is created before the command.`);
				}

				const button = new ElementButtonView(locale, command);

				button.keystroke = keystroke;

				return button;
			});
		}
	}

	/**
	 * Makes the commands of the elements, which are registered then.
	 */
	public afterInit(): void {
		const editor = this.editor;
		const lists = getLists(editor.plugins.get(ElementSchema).definition ?? {});

		for (const [name, { element, title, icon }] of this._getDefinitions()) {
			const elementName = element ?? name;

			if (!editor.model.schema.isRegistered(elementName)) {
				throw new Error(
					`elementSchemaCommands.${name}: unknown element "${elementName}". Declare it in the element schema, or ` +
						`set "element" to an element of another plugin.`
				);
			}

			const command = createCommand(editor, elementName, lists);

			command.set({ title, icon });
			editor.commands.add(name, command);
			this._commands.set(name, command);
		}
	}

	private _getDefinitions(): [name: string, definition: ElementSchemaCommandDefinition][] {
		return Object.entries(this.editor.config.get('elementSchemaCommands') ?? {});
	}
}

/**
 * Returns the command of an element, by its kind (see {@link getModelKind}): a list of the element schema is a list; an
 * `empty` element, or an inline container, is inserted; an inline element with text wraps text; a block-level one is a
 * block; the others are containers.
 */
function createCommand(editor: Editor, name: string, lists: ReadonlyMap<string, string>): ElementCommand {
	const itemName = lists.get(name);

	if (itemName) {
		const otherLists = Array.from(lists).filter(([list, item]) => item === itemName && list !== name);

		return new ElementListCommand(
			editor,
			name,
			itemName,
			otherLists.map(([list]) => list)
		);
	}

	const { type, isInline } = getModelKind(editor.model.schema, name);

	if (type === 'empty' || (isInline && type === 'container')) {
		return new ElementInsertCommand(editor, name);
	}

	if (type === 'block') {
		return isInline ? new ElementInlineCommand(editor, name) : new ElementBlockCommand(editor, name);
	}

	return new ElementContainerCommand(editor, name);
}
