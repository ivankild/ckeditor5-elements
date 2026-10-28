import type { ModelSchema } from 'ckeditor5';
import type { ElementSchemaKind } from './types.js';

/**
 * Returns the kind of an element of the model schema, of the element schema or of another plugin, by what the model
 * schema says about it: inline or not, and `empty` for an object, `block` for what can contain text, `container` for the
 * rest.
 */
export function getModelKind(schema: ModelSchema, name: string): ElementSchemaKind {
	return {
		isInline: schema.isInline(name),
		type: schema.isObject(name) ? 'empty' : schema.checkChild(name, '$text') ? 'block' : 'container'
	};
}

/**
 * Whether the element is an inline element with text, e.g. a bold: an inline `block`, which is in a line of text, and
 * which the cursor goes in.
 */
export function isInlineText({ type, isInline }: { type: string; isInline?: boolean }): boolean {
	return type === 'block' && isInline === true;
}

/**
 * Whether the element is inserted, as a whole, not typed around text: an `empty` element, or an inline `container`.
 */
export function isInserted({ type, isInline }: { type: string; isInline?: boolean }): boolean {
	return type === 'empty' || (type === 'container' && isInline === true);
}
