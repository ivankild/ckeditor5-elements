import type { ElementSchema, ElementSchemaInput } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ElementSchema.pluginName]: ElementSchema;
	}

	interface EditorConfig {
		/**
		 * The elements to declare in the model schema: an object, e.g. a JSON file. See {@link ElementSchema}.
		 */
		elementSchema?: ElementSchemaInput;

		/**
		 * Whether to declare the converters of the elements of `elementSchema`, one to one: `div` or `span` with the name as
		 * the class, and the attributes as `data-*` attributes, in the data and in the editing view; `editingTag` of an
		 * element sets another tag for the editing view. See {@link ElementSchema}. Default: `false`.
		 */
		elementSchemaConverters?: boolean;
	}
}
