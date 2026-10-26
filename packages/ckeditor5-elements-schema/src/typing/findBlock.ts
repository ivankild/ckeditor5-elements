import type { Model, ModelDocumentFragment, ModelElement, ModelPosition } from 'ckeditor5';

/**
 * Returns the block of a position: its parent, or the closest ancestor of it that is not inline, e.g. the paragraph of
 * the text in an inline element. `null` in the root.
 */
export function findBlock(model: Model, position: ModelPosition | null): ModelElement | null {
	for (
		let node: ModelElement | ModelDocumentFragment | null = position?.parent ?? null;
		node?.is('element') && !node.is('rootElement');
		node = node.parent
	) {
		if (!model.schema.isInline(node)) {
			return node;
		}
	}

	return null;
}
