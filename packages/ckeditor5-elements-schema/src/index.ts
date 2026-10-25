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

// Commands.
export { default as ElementSchemaCommand } from './commands/elementSchemaCommand.js';
export { default as ElementInlineCommand } from './commands/elementInlineCommand.js';
export { default as ElementBlockCommand } from './commands/elementBlockCommand.js';
export { default as ElementContainerCommand } from './commands/elementContainerCommand.js';
export { default as ElementInsertCommand } from './commands/elementInsertCommand.js';

// Utils.
export { withoutBlockFiller } from './conversion/inlineTextElement.js';

// Validation and compiling, which do not need an editor (also in `validate.ts`, for Node.js).
export * from './validate.js';

import './augmentation.js';
