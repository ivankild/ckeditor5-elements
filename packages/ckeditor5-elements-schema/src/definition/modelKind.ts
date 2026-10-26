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
