/**
 * Element schema: declare the elements of the content, formatting included, from a simple definition, e.g. a JSON file,
 * with three types of elements (`empty`, `block`, `container`), and a validation that rejects contradictory definitions.
 * The converters write the elements to the data one to one, and `ElementSchemaCommands` gives every element its command
 * and button.
 *
 * @module ckeditor5-elements-schema
 */

// Plugins.
export { default as ElementSchema } from './elementSchema.js';
export {
	default as ElementSchemaCommands,
	type ElementSchemaCommandDefinition,
	type ElementSchemaCommandsConfig
} from './elementSchemaCommands.js';

// Converters.
export { type ElementSchemaConvertersMode } from './conversion/convertElementSchema.js';
export { withoutBlockFiller } from './conversion/inlineTextElement.js';
export { VERBATIM_CLASS, createVerbatimElement } from './conversion/verbatimElement.js';

// Validation and compiling, which do not need an editor (also in `validate.ts`, for Node.js).
export * from './validate.js';

import './augmentation.js';
