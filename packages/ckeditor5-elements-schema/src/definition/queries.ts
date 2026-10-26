import type { ElementSchemaInput } from './types.js';

/**
 * Returns the names of the inline elements with text of a schema (inline `block`s), e.g. a bold: the elements in a line
 * of text that the cursor goes in.
 */
export function getInlineTextElements(input: ElementSchemaInput): string[] {
	return Object.entries(input)
		.filter(([, element]) => element.type === 'block' && element.isInline === true)
		.map(([name]) => name);
}

/**
 * Returns the names of the verbatim blocks of a schema (see `verbatim` of an element): the elements whose
 * whitespace is their content, e.g. for the `preElements` of a data processor.
 */
export function getVerbatimElements(input: ElementSchemaInput): string[] {
	return Object.entries(input)
		.filter(([, element]) => element.verbatim === true)
		.map(([name]) => name);
}

/**
 * Returns the lists of a schema (see `listItem` of an element): the name of the element of their items, by
 * the name of the list.
 */
export function getLists(input: ElementSchemaInput): Map<string, string> {
	const lists = new Map<string, string>();

	for (const [name, element] of Object.entries(input)) {
		if (typeof element.listItem === 'string') {
			lists.set(name, element.listItem);
		}
	}

	return lists;
}

/**
 * Returns the lists of an item, by the name of the item.
 */
export function getListsOfItems(input: ElementSchemaInput): Map<string, string[]> {
	const items = new Map<string, string[]>();

	for (const [list, item] of getLists(input)) {
		items.set(item, [...(items.get(item) ?? []), list]);
	}

	return items;
}
