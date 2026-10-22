import type { ModelElement, ModelSchema } from 'ckeditor5';

/**
 * Whether the element can be copied, cut or pasted over as a whole. Parts of a structure that cannot stand alone, such
 * as a table cell, a table row or a caption, cannot: in the schema, they are limit elements that are not objects.
 */
export function isStandalone(schema: ModelSchema, element: ModelElement): boolean {
	return !schema.isLimit(element) || schema.isObject(element);
}
