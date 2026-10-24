import { Plugin, type ModelSchema, type ViewDowncastWriter, type ViewElement } from 'ckeditor5';
import { ElementOrPositionButtonView } from 'ckeditor5-elements-core';
import { createInlineTextElement } from './conversion/inlineTextElement.js';
import ElementBlockCommand from './commands/elementBlockCommand.js';
import ElementContainerCommand from './commands/elementContainerCommand.js';
import ElementInlineCommand from './commands/elementInlineCommand.js';
import ElementInsertCommand from './commands/elementInsertCommand.js';
import ElementSchema from './elementSchema.js';
import type ElementSchemaCommand from './commands/elementSchemaCommand.js';
import { enableTwoStepCaretMovement } from './typing/twoStepCaretMovement.js';

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

	/**
	 * The tag of the element in the data and in the editing view, e.g. `'strong'` or `'hr'`. The converters of the plugin
	 * replace the ones of the element schema (`elementSchemaConverters`) in the downcast, and the upcast takes both.
	 * Without it, the element is converted by the schema, or by your converters.
	 */
	view?: string;
}

/**
 * The `elementSchemaCommands` option: the elements, by the name of their command and of their button.
 */
export type ElementSchemaCommandsConfig = Record<string, ElementSchemaCommandDefinition>;

/**
 * Commands and toolbar buttons for the elements of the element schema, as CKEditor's features have for theirs: the
 * command of an element is the one of its kind (see {@link ElementSchemaCommand}).
 *
 * | Element                       | Command                     | Works as CKEditor's           |
 * | ----------------------------- | --------------------------- | ----------------------------- |
 * | inline `block`                | {@link ElementInlineCommand}    | bold: wraps text              |
 * | `block`                       | {@link ElementBlockCommand}     | heading: renames blocks       |
 * | `container`                   | {@link ElementContainerCommand} | block quote: wraps blocks     |
 * | `empty`, inline `container`   | {@link ElementInsertCommand}    | horizontal line: inserts      |
 *
 * ```ts
 * elementSchema: schema,
 * elementSchemaCommands: {
 *   bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B', view: 'strong' },
 *   callout: { title: 'Callout', icon: IconQuote },
 *   divider: { title: 'Divider', icon: IconHorizontalLine, view: 'hr' }
 * },
 * toolbar: ['bold', 'callout', 'divider']
 * ```
 *
 * Each key is the name of the command and of its toolbar button. The commands have titles and icons, so they can be
 * menu items too, e.g. of the context menu.
 *
 * At the ends of the inline elements with text, the left and right arrow keys move in two steps, as CKEditor's two-step
 * caret movement does at the ends of a bold: in the element, then in the text.
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
	private readonly _commands = new Map<string, ElementSchemaCommand>();

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

				const button = new ElementOrPositionButtonView(locale, command);

				button.bind('isOn').to(command, 'isOn');
				button.keystroke = keystroke;

				return button;
			});
		}
	}

	/**
	 * Makes the commands of the elements, which are registered then, and their converters.
	 */
	public afterInit(): void {
		const editor = this.editor;
		const schema = editor.model.schema;
		const inlineNames = new Set<string>();

		for (const [name, { element, title, icon, view }] of this._getDefinitions()) {
			const elementName = element ?? name;

			if (!schema.isRegistered(elementName)) {
				throw new Error(
					`elementSchemaCommands.${name}: unknown element "${elementName}". Declare it in the element schema, or ` +
						`set "element" to an element of another plugin.`
				);
			}

			const CommandClass = getCommandClass(schema, elementName);
			const command = new CommandClass(editor, elementName);

			command.set({ title, icon });
			editor.commands.add(name, command);
			this._commands.set(name, command);

			if (command instanceof ElementInlineCommand) {
				inlineNames.add(elementName);
			}

			if (view) {
				this._convert(elementName, view, (writer: ViewDowncastWriter) => {
					if (command instanceof ElementInlineCommand) {
						return createInlineTextElement(writer, view);
					}

					return schema.isObject(elementName)
						? writer.createEmptyElement(view)
						: writer.createContainerElement(view);
				});
			}
		}

		enableTwoStepCaretMovement(this, inlineNames);
	}

	private _getDefinitions(): [name: string, definition: ElementSchemaCommandDefinition][] {
		return Object.entries(this.editor.config.get('elementSchemaCommands') ?? {});
	}

	/**
	 * Declares the converters of an element with the tag of its `view`: the downcast with the highest priority, so it
	 * replaces the ones of the element schema, and the upcast.
	 */
	private _convert(elementName: string, tag: string, createView: (writer: ViewDowncastWriter) => ViewElement): void {
		const conversion = this.editor.conversion;

		conversion.for('upcast').elementToElement({ view: tag, model: elementName });
		conversion.for('downcast').elementToElement({
			model: elementName,
			view: (_element, { writer }) => createView(writer),
			// Over the ones of the schema, some of which are `high` already.
			converterPriority: 'highest'
		});
	}
}

/**
 * Returns the command of an element, by its kind: an object, or an inline element with no text, is inserted; an inline
 * element with text wraps text; a block-level one with text is a block; the others are containers.
 */
function getCommandClass(schema: ModelSchema, name: string): typeof ElementSchemaCommand {
	const holdsText = schema.checkChild(name, '$text');

	if (schema.isObject(name) || (schema.isInline(name) && !holdsText)) {
		return ElementInsertCommand;
	}

	if (schema.isInline(name)) {
		return ElementInlineCommand;
	}

	return holdsText ? ElementBlockCommand : ElementContainerCommand;
}
