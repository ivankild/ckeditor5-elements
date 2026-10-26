import {
	Essentials,
	IconBold,
	Paragraph,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { ElementSelectable } from 'ckeditor5-elements-interaction';
import { afterEach } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import type ElementSchemaCommand from '../src/commands/elementSchemaCommand.js';
import type { ElementSchemaInput } from '../src/definition/types.js';
import ElementSchemaCommands, { type ElementSchemaCommandsConfig } from '../src/elementSchemaCommands.js';

/**
 * The schema of the tests of the commands: an element of each kind.
 */
export const SCHEMA: ElementSchemaInput = {
	bold: { type: 'block', isInline: true },
	italic: { type: 'block', isInline: true },
	title: { type: 'block' },
	callout: { type: 'container' },
	divider: { type: 'empty' },
	mention: { type: 'empty', isInline: true },
	chip: { type: 'container', isInline: true },
	code: { type: 'block', verbatim: true },
	bullets: { type: 'container', listItem: 'item' },
	numbers: { type: 'container', listItem: 'item' },
	item: { type: 'container' }
};

/**
 * A command for each element of the {@link SCHEMA}.
 */
export const CONFIG: ElementSchemaCommandsConfig = {
	bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B' },
	italic: { title: 'Italic' },
	title: { title: 'Title' },
	callout: { title: 'Callout' },
	divider: { title: 'Divider' },
	mention: { title: 'Mention' },
	chip: { title: 'Chip' },
	code: { title: 'Code' },
	bullets: { title: 'Bulleted list' },
	numbers: { title: 'Numbered list' }
};

/**
 * An editor with the commands of the elements, created by {@link setUp}, and the helpers of the tests, for it.
 */
export interface SchemaCommandsEditor {
	/**
	 * Creates the editor, with the {@link SCHEMA} and a config of the commands.
	 */
	setUp: (config?: ElementSchemaCommandsConfig, options?: { converters?: boolean }) => Promise<ClassicEditor>;

	/**
	 * The editor created by {@link setUp}.
	 */
	editor: () => ClassicEditor;

	/**
	 * A command, by its name. CKEditor's typings have `bold` as its own command, of text attributes.
	 */
	command: (name?: string) => ElementSchemaCommand;

	/**
	 * The model, with the selection.
	 */
	model: () => string;

	/**
	 * An element, by its path from the root.
	 */
	child: (...path: number[]) => ModelElement;

	/**
	 * Sets the model, executes a command, and returns the model then.
	 */
	execute: (data: string, name?: string) => string;
}

/**
 * Returns an editor with the commands of the elements, for the tests of a `describe()`: it is destroyed after each test.
 */
export function useSchemaCommandsEditor(): SchemaCommandsEditor {
	let current: ClassicEditor | undefined;

	afterEach(async () => {
		await current?.destroy();
		current = undefined;
	});

	const editor = (): ClassicEditor => {
		if (!current) {
			throw new Error('No editor: call setUp() first.');
		}

		return current;
	};

	return {
		setUp: async (config = CONFIG, { converters = true } = {}) => {
			current = await createEditor({
				// `ElementSelectable` selects the empty elements of the schema, which the editor warns about otherwise.
				plugins: [Essentials, Paragraph, ElementSelectable, ElementSchemaCommands],
				elementSchema: SCHEMA,
				elementSchemaConverters: converters,
				elementSchemaCommands: config
			});

			return current;
		},
		editor,
		command: (name = 'bold') => editor().commands.get(name) as unknown as ElementSchemaCommand,
		model: () => _getModelData(editor().model),
		child: (...path) =>
			path.reduce<ModelElement>(
				(element, index) => element.getChild(index) as ModelElement,
				editor().model.document.getRoot()!
			),
		execute: (data, name = 'bold') => {
			_setModelData(editor().model, data);
			editor().execute(name);

			return _getModelData(editor().model);
		}
	};
}
