import type { Editor } from 'ckeditor5';
import type { ElementSchemaElement, ElementSchemaInput } from './types.js';

/**
 * Returns the tag of an element in the data: a `span` for what is in a line of text (an inline element that is empty or
 * has text), a `div` for the rest. An inline container is a `div`: it holds blocks, which a `span` cannot hold.
 */
export function getViewTag({ type, isInline }: Pick<ElementSchemaElement, 'type' | 'isInline'>): 'div' | 'span' {
	return isInline && type !== 'container' ? 'span' : 'div';
}

/**
 * Declares the converters of the elements of a schema, one to one: an element is a `div` or a `span` in the data (see
 * {@link getViewTag}), with its name as the class. Its attributes are `data-*` attributes. The data is loaded as it is
 * saved. The editing view is the same, except for the tag, when the element has an `editingTag`.
 *
 * The `empty` elements are empty in the data too: `<div class="divider"></div>`, with no filler.
 */
export function convertElementSchema(editor: Editor, input: ElementSchemaInput): void {
	const { conversion } = editor;

	for (const [name, element] of Object.entries(input)) {
		const { type, editingTag, allowAttributes } = element as ElementSchemaElement;
		const tag = getViewTag(element as ElementSchemaElement);
		const view = { name: tag, classes: name };

		for (const key of allowAttributes ?? []) {
			// The names of HTML attributes are lowercase, so the data has them in lowercase; the model keeps the key as it is.
			conversion.attributeToAttribute({ model: { name, key }, view: `data-${key.toLowerCase()}` });
		}

		// Upcast, data downcast and editing downcast at once; what differs is declared with a higher priority.
		conversion.elementToElement({ model: name, view });

		if (type === 'empty') {
			conversion.for('dataDowncast').elementToElement({
				model: name,
				view: (_element, { writer }) => writer.createEmptyElement(tag, { class: name }),
				converterPriority: 'high'
			});
		}

		if (editingTag) {
			conversion.for('editingDowncast').elementToElement({
				model: name,
				view: { name: editingTag, classes: name },
				converterPriority: 'high'
			});
		}
	}
}
