import type { ModelElement, ModelPosition } from 'ckeditor5';

/**
 * Whether the element (or position) is in the document. Unlike `element.isAttached()`, removed elements (moved to
 * the graveyard root) do not count, and neither do the elements of detached roots.
 */
export function isInDocument(elementOrPosition: ModelElement | ModelPosition): boolean {
	const root = elementOrPosition.root;

	return root.is('rootElement') && root.rootName !== '$graveyard' && root.isAttached();
}
