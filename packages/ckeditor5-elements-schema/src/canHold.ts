import type { ElementSchemaKind } from './types.js';

/**
 * The root can hold blocks, containers and block-level empty elements, like a container.
 */
export const ROOT: ElementSchemaKind = { type: 'container', isInline: false };

/**
 * Returns why `parent` cannot contain `child` (an element, or `'$text'`), or `null` when it can.
 */
export function whyNot(parent: ElementSchemaKind, child: ElementSchemaKind | '$text'): string | null {
	const isText = child === '$text';

	if (parent.type === 'empty') {
		return 'an empty element cannot contain anything';
	}

	if (parent.type === 'block') {
		const what = parent.isInline ? 'an inline text element' : 'a block';

		return isText || child.isInline ? null : `${what} can contain only text and inline elements`;
	}

	if (isText) {
		return 'a container cannot contain text: put the text in a block';
	}

	return child.isInline ? 'a container cannot contain inline elements: put them in a block' : null;
}
