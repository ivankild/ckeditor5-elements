import type { ViewContainerElement } from 'ckeditor5';

/**
 * Makes a view element have no block filler, and returns it: for the view of an inline element with text, e.g. a bold
 * that is an element, so that the cursor can go in it when it is empty.
 *
 * CKEditor puts a block filler, a `<br>`, in an empty container element, so that an empty paragraph has a height. In an
 * inline element, the browser does not type there: the text goes before the element. Without the block filler, CKEditor
 * puts its inline filler where the cursor is, as in the empty `<strong>` of its own bold, and the text goes in.
 *
 * ```ts
 * conversion.for('downcast').elementToElement({
 *   model: 'bold',
 *   view: (element, { writer }) => withoutBlockFiller(writer.createContainerElement('strong'))
 * });
 * ```
 *
 * The converters of the element schema (`elementSchemaConverters`) do it already.
 */
export function withoutBlockFiller<T extends ViewContainerElement>(element: T): T {
	element.getFillerOffset = () => null;

	return element;
}
