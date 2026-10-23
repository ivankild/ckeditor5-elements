/**
 * The validation of an element schema without CKEditor, so that it works in Node.js, e.g. to validate a schema file in a
 * test or in CI: `import { validateElementSchema } from 'ckeditor5-elements/validate-schema'`. The main entry loads
 * CKEditor, which needs a DOM.
 *
 * @module ckeditor5-elements/validate-schema
 */

export * from 'ckeditor5-elements-schema/validate';
