import type { ModelElement, ModelPosition, ModelSchema, ModelWriter } from 'ckeditor5';

/**
 * Whether the element (or position) is in the document. Unlike `element.isAttached()`, removed elements (moved to
 * the graveyard root) do not count, and neither do the elements of detached roots.
 */
export function isInDocument(elementOrPosition: ModelElement | ModelPosition): boolean {
	const root = elementOrPosition.root;

	return root.is('rootElement') && root.rootName !== '$graveyard' && root.isAttached();
}

/**
 * Whether the element can be handled as a whole: copied, moved, duplicated or removed. Parts of a structure that cannot
 * stand alone, such as a table cell, a table row or a caption, cannot: in the schema, they are limit elements that are
 * not objects.
 */
export function isStandalone(schema: ModelSchema, element: ModelElement): boolean {
	return !schema.isLimit(element) || schema.isObject(element);
}

/**
 * Puts the selection in a newly inserted element, so that the user can go on: an object is selected; an element that
 * holds text gets the cursor inside it; an element that holds blocks gets an empty paragraph with the cursor.
 */
export function selectNewElement(writer: ModelWriter, element: ModelElement): void {
	const schema = writer.model.schema;

	if (schema.isObject(element)) {
		writer.setSelection(element, 'on');
	} else if (schema.checkChild(element, '$text')) {
		writer.setSelection(element, 0);
	} else if (schema.checkChild(element, 'paragraph')) {
		const paragraph = writer.createElement('paragraph');

		writer.append(paragraph, element);
		writer.setSelection(paragraph, 0);
	} else {
		// Only objects can be selected as a whole. The selection post-fixer moves it to the closest valid place.
		writer.setSelection(element, 'after');
	}
}
