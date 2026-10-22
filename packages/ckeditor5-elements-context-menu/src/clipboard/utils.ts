import type { ModelElement } from 'ckeditor5';

/**
 * Whether the element is in the document. Unlike `element.isAttached()`, removed elements (moved to the graveyard
 * root) do not count.
 */
export function isInDocument(element: ModelElement): boolean {
	const root = element.root;

	return root.is('rootElement') && root.rootName !== '$graveyard' && root.isAttached();
}
