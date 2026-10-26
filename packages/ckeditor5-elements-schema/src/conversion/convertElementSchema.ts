import type { Editor, ViewDowncastWriter, ViewElement } from 'ckeditor5';
import { isInlineText } from '../definition/kinds.js';
import type { ElementSchemaDefinition, ElementSchemaElement } from '../definition/types.js';
import { withoutBlockFiller } from './inlineTextElement.js';
import { createVerbatimElement } from './verbatimElement.js';

/**
 * Returns the tag of an element in the data: a `span` for what is in a line of text (an inline element that is empty or
 * has text), a `pre` for a verbatim block, whose whitespace is its content, a `div` for the rest. An inline container
 * is a `div`: it holds blocks, which a `span` cannot hold.
 */
export function getViewTag({
	type,
	isInline,
	verbatim
}: Pick<ElementSchemaElement, 'type' | 'isInline' | 'verbatim'>): 'div' | 'pre' | 'span' {
	if (verbatim) {
		return 'pre';
	}

	return isInline && type !== 'container' ? 'span' : 'div';
}

/**
 * The HTML elements that have no content, e.g. `hr`: an `empty` element with one of these tags is an empty element in the
 * editing view too.
 */
const VOID_TAGS = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'track', 'wbr']);

/**
 * How the converters of the schema write the data (the `elementSchemaConverters` option): as HTML (`true`), or with the
 * names of the elements and of their attributes (`'names'`).
 */
export type ElementSchemaConvertersMode = true | 'names';

/**
 * Declares the converters of the elements of a schema, one to one.
 *
 * * As HTML (`true`): an element is a `div` or a `span` in the data (see {@link getViewTag}), with its name as the
 *   class, or the element of its `tag`, e.g. `<strong>`. Its attributes are `data-*` attributes.
 * * With the names (`'names'`): an element is the element of its name in the data, e.g. `<calloutTitle>`, and its
 *   attributes keep their names, e.g. `<link href="…">`: for a data processor of XML, which keeps the case of the names.
 *   They are read in lowercase too, as the clipboard has them: it is HTML.
 *
 * The data is loaded as it is saved. The editing view is HTML either way, as the HTML data, except for the tag, when the
 * element has an `editingTag`.
 *
 * The `empty` elements are empty in the data too: `<div class="divider"></div>`, with no filler. The inline elements with
 * text have no block filler, so the cursor can go in an empty one (see `withoutBlockFiller()`).
 */
export function convertElementSchema(
	editor: Editor,
	definition: ElementSchemaDefinition,
	mode: ElementSchemaConvertersMode = true
): void {
	const { conversion } = editor;
	const keepsNames = mode === 'names';

	for (const [name, element] of Object.entries(definition)) {
		const { type, tag, editingTag, allowAttributes, verbatim } = element;
		const htmlTag = tag ?? getViewTag(element);
		// An element with a tag of its own is that tag; the others are named by their class.
		const htmlAttributes: Record<string, string> = tag ? {} : { class: name };
		const isInlineTextElement = isInlineText(element);
		// The clipboard is HTML, which makes the names lowercase: the names are read in lowercase too.
		const dataNames = keepsNames ? withLowercase(name) : [];

		const createView = (
			writer: ViewDowncastWriter,
			viewTag: string,
			attributes: Record<string, string>,
			isEditing: boolean
		): ViewElement => {
			if (isInlineTextElement) {
				return withoutBlockFiller(writer.createContainerElement(viewTag, attributes));
			}

			if (type === 'empty' && (!isEditing || VOID_TAGS.has(viewTag))) {
				return writer.createEmptyElement(viewTag, attributes);
			}

			// A verbatim block shows and takes an empty last line in the editor: see `createVerbatimElement()`.
			return verbatim && isEditing
				? createVerbatimElement(writer, viewTag, attributes)
				: writer.createContainerElement(viewTag, attributes);
		};

		for (const key of allowAttributes ?? []) {
			// The names of HTML attributes are lowercase, so the data has them in lowercase; the model keeps the key as it is.
			const htmlKey = `data-${key.toLowerCase()}`;

			if (keepsNames) {
				for (const viewName of dataNames) {
					for (const viewKey of withLowercase(key)) {
						conversion
							.for('upcast')
							.attributeToAttribute({ view: { name: viewName, key: viewKey }, model: key });
					}
				}
			} else {
				conversion.for('upcast').attributeToAttribute({ view: { name: htmlTag, key: htmlKey }, model: key });
			}

			conversion
				.for('dataDowncast')
				.attributeToAttribute({ model: { name, key }, view: keepsNames ? key : htmlKey });
			conversion.for('editingDowncast').attributeToAttribute({ model: { name, key }, view: htmlKey });
		}

		for (const view of keepsNames ? dataNames : [tag ?? { name: htmlTag, classes: name }]) {
			conversion.for('upcast').elementToElement({ view, model: name });
		}

		conversion.for('dataDowncast').elementToElement({
			model: name,
			view: (_element, { writer }) =>
				keepsNames ? createView(writer, name, {}, false) : createView(writer, htmlTag, htmlAttributes, false)
		});
		conversion.for('editingDowncast').elementToElement({
			model: name,
			view: (_element, { writer }) => createView(writer, editingTag ?? htmlTag, htmlAttributes, true)
		});
	}
}

/**
 * Returns the name, and its lowercase form when it differs: the names of the data, as XML keeps them, and as HTML makes
 * them.
 */
function withLowercase(name: string): string[] {
	return name === name.toLowerCase() ? [name] : [name, name.toLowerCase()];
}
