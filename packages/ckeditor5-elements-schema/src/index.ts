/**
 * Element schema: declare elements in the model schema from a simple definition, e.g. a JSON file, with three types of
 * elements (`empty`, `block`, `container`), and a validation that rejects contradictory definitions.
 *
 * @module ckeditor5-elements-schema
 */

// Plugins.
export { default as ElementSchema } from './elementSchema.js';

// Validation and compiling, which do not need an editor (also in `validate.ts`, for Node.js).
export * from './validate.js';

import './augmentation.js';
