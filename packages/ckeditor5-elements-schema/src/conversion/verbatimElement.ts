import type { ViewContainerElement, ViewDowncastWriter } from 'ckeditor5';
import { withoutBlockFiller } from './inlineTextElement.js';

/**
 * The class of a verbatim block in the editing view: the stylesheet of the package keeps its whitespace, whatever its
 * tag.
 */
export const VERBATIM_CLASS = 'ck-elements-verbatim';

/**
 * Creates the view of a verbatim block in the editor, e.g. a `pre`: with the {@link VERBATIM_CLASS}, and a `<br>` after
 * its text, which is not content (a UI element).
 *
 * A browser shows no line after a new line at the end of a `pre`, and does not type there: the cursor and the text go
 * back to the end of the line before. The `<br>` makes that last line a line, as in CKEditor's code blocks. It gives an
 * empty block its height too, so the block has no block filler.
 *
 * ```ts
 * conversion.for('editingDowncast').elementToElement({
 *   model: 'code',
 *   view: (element, { writer }) => createVerbatimElement(writer, 'pre')
 * });
 * ```
 *
 * The converters of the element schema (`elementSchemaConverters`) do it already.
 */
export function createVerbatimElement(
	writer: ViewDowncastWriter,
	tag: string,
	{ class: className, ...attributes }: Record<string, string> = {}
): ViewContainerElement {
	return withoutBlockFiller(
		writer.createContainerElement(
			tag,
			{ ...attributes, class: className ? `${className} ${VERBATIM_CLASS}` : VERBATIM_CLASS },
			[writer.createUIElement('br')]
		)
	);
}
