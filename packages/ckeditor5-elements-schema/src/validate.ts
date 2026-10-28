/**
 * The part of the element schema that needs no editor and no browser: the validation, the compiling to schema
 * definitions, the error and the types. It is in its own module, so that it can be used in Node.js, e.g. to validate a
 * schema file in a test or in CI: the main entry loads CKEditor, which needs a DOM.
 *
 * @module ckeditor5-elements-schema/validate
 */

export { parseElementSchema, validateElementSchema } from './definition/validateElementSchema.js';
export { compileElementSchema, type CompiledElementSchema } from './definition/compileElementSchema.js';
export { getInlineTextElements, getLists, getVerbatimElements } from './definition/queries.js';
export { default as ElementSchemaError } from './definition/elementSchemaError.js';
export type {
	ElementSchemaDefinition,
	ElementSchemaElement,
	ElementSchemaInput,
	ElementSchemaIssue,
	ElementSchemaKind,
	ElementSchemaType,
	ValidateElementSchemaOptions
} from './definition/types.js';
