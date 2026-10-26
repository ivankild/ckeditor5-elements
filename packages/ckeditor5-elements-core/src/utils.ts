import type {
	Model,
	ModelDocumentFragment,
	ModelDocumentSelection,
	ModelElement,
	ModelPosition,
	ModelSchema,
	ModelSelection,
	ModelWriter
} from 'ckeditor5';

/**
 * The name of CKEditor's paragraph: the block that the features make where a block is needed to type in, e.g. in an
 * element that is left empty, or after a verbatim block.
 */
export const PARAGRAPH = 'paragraph';

/**
 * Whether the element (or position) is in the document. Unlike `element.isAttached()`, removed elements (moved to
 * the graveyard root) do not count, and neither do the elements of detached roots.
 */
export function isInDocument(elementOrPosition: ModelElement | ModelPosition): boolean {
	const root = elementOrPosition.root;

	return root.is('rootElement') && root.rootName !== '$graveyard' && root.isAttached();
}

/**
 * Returns the element at the selection: the selected element (e.g. an image), or the element with the cursor, i.e. the
 * parent of the start of the selection. Never a root: `null` when the selection is directly in one.
 */
export function getElementAtSelection(selection: ModelSelection | ModelDocumentSelection): ModelElement | null {
	const element = selection.getSelectedElement() ?? selection.getFirstPosition()?.parent;

	return element?.is('element') && !element.is('rootElement') ? element : null;
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
	} else if (schema.checkChild(element, PARAGRAPH)) {
		const paragraph = writer.createElement(PARAGRAPH);

		writer.append(paragraph, element);
		writer.setSelection(paragraph, 0);
	} else {
		// Only objects can be selected as a whole. The selection post-fixer moves it to the closest valid place.
		writer.setSelection(element, 'after');
	}
}

/**
 * Returns the element and its ancestors, the inner first, up to the root, which is not one of them: the elements that
 * a node is, or is in. Nothing for a root, a document fragment, or `null`.
 */
export function* getAncestorElements(
	node: ModelElement | ModelDocumentFragment | null | undefined
): Generator<ModelElement> {
	for (let element = node; element?.is('element') && !element.is('rootElement'); element = element.parent) {
		yield element;
	}
}

/**
 * Returns the block of a position: its parent, or the closest ancestor of it that is not inline, e.g. the paragraph of
 * the text in an inline element. `null` in the root.
 */
export function findBlock(model: Model, position: ModelPosition | null): ModelElement | null {
	for (const element of getAncestorElements(position?.parent)) {
		if (!model.schema.isInline(element)) {
			return element;
		}
	}

	return null;
}
