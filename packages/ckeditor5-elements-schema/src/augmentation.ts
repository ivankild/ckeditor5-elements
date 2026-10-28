import type {
	ElementSchema,
	ElementSchemaCommands,
	ElementSchemaCommandsConfig,
	ElementSchemaConvertersMode,
	ElementSchemaInput
} from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementSchema.pluginName]: ElementSchema;
		[ElementSchemaCommands.pluginName]: ElementSchemaCommands;
	}

	interface EditorConfig {
		/**
		 * The elements to declare in the model schema: an object, e.g. a JSON file. See {@link ElementSchema}.
		 */
		elementSchema?: ElementSchemaInput;

		/**
		 * Whether to declare the converters of the elements of `elementSchema`, one to one, and how they write the data:
		 *
		 * * `true`: as HTML, `div` or `span` with the name as the class (or the `tag` of the element), and the attributes as
		 *   `data-*` attributes;
		 * * `'names'`: each element as the element of its name, with its attributes by their names, e.g. for XML.
		 *
		 * The editing view is HTML either way; `editingTag` of an element sets another tag for it. See
		 * {@link ElementSchema}. Default: `false`.
		 */
		elementSchemaConverters?: ElementSchemaConvertersMode | false;

		/**
		 * The commands and the buttons of the elements of the schema, by the name of the command: the command of each
		 * element is the one of its kind (formatting, block, container, inserted element). See {@link ElementSchemaCommands}.
		 */
		elementSchemaCommands?: ElementSchemaCommandsConfig;
	}
}
