import { ROOT, whyNot } from './canHold.js';
import {
	ATTRIBUTE_NAME,
	ELEMENT_KEYS,
	ELEMENT_NAME,
	TAG_NAME,
	checkKeys,
	isRecord,
	readKind,
	readNames,
	type Report
} from './readDefinition.js';
import { suggest } from './suggest.js';
import type { ElementSchemaIssue, ElementSchemaKind, ValidateElementSchemaOptions } from './types.js';

/**
 * Checks an element schema, so that it is not contradictory, and returns the problems. An empty array means that the
 * schema is valid.
 *
 * The schema is rejected when it:
 *
 * * is not of the shape {@link ElementSchemaDefinition}: an object of elements, by name; has keys that are not part of
 *   it (typos are problems), or has values of the wrong type;
 * * declares an element with an unknown `type`, or an `empty` element with `allowChildren`;
 * * has attribute names that are not valid, or that differ only in case (HTML attribute names are not case sensitive),
 *   or a `tag` or an `editingTag` that is not the name of a tag, or the `tag` of another element;
 * * refers to elements that do not exist (a name that is neither declared in the schema, nor in `external`), or lists the
 *   same name twice;
 * * allows what its type cannot hold: text or an inline element in a container or in the root, a block-level (not inline)
 *   element in a block, or anything in an `empty` element, whichever side says it: `allowChildren` of the parent, or
 *   `allowIn` of the child;
 * * makes verbatim what is not a block-level `block`, or a list of what is not a block-level `container`; names a list
 *   item that is not a block-level container of the schema, or gives it `allowIn` (its places are its lists); gives a
 *   list `allowChildren`, or allows another element in a list, which holds only its items.
 *
 * `isInline` is about the position and the layout of an element, so it is valid for every type: an inline element is
 * laid out in a line with its siblings. Inline elements are allowed only in blocks, which can hold several of them,
 * e.g. inline containers, or inline images between text.
 *
 * It does not need an editor. The editor of `ElementSchema` runs it with the elements of the other plugins as `external`.
 */
export function validateElementSchema(
	input: unknown,
	{ external = {} }: ValidateElementSchemaOptions = {}
): ElementSchemaIssue[] {
	const issues: ElementSchemaIssue[] = [];
	const report = (path: string, message: string): void => {
		issues.push({ path, message });
	};

	if (!isRecord(input)) {
		report(
			'',
			'The schema must be an object of element definitions, by name: { "note": { "type": "container" } }.'
		);

		return issues;
	}

	const elements = input;

	if (!Object.keys(elements).length) {
		report('', 'The schema declares no elements: declare at least one.');

		return issues;
	}

	if (isRecord(elements.elements) && !('type' in elements.elements)) {
		report(
			'elements',
			'the schema is the object of the elements itself: remove the "elements" wrapper, and put the elements at the top.'
		);

		return issues;
	}

	// The first pass checks every definition on its own, and collects the kinds and the lists to cross-check.
	const kinds = new Map<string, ElementSchemaKind>();
	const lists = new Map<string, { allowChildren: string[]; allowIn: string[] }>();
	const listItems = new Map<string, string>();
	// The elements, by their `tag`.
	const tags = new Map<string, string>();

	for (const [name, definition] of Object.entries(elements)) {
		const path = name;

		if (!ELEMENT_NAME.test(name)) {
			report(
				path,
				`"${name}" is not a valid element name: use camelCase letters and digits, starting with a lowercase letter.`
			);
		}

		if (name in external) {
			report(
				path,
				`"${name}" already exists in the editor (it is declared by another plugin): remove it, or rename it.`
			);
		}

		if (!isRecord(definition)) {
			report(path, 'must be an object, e.g. { "type": "block" }.');
			continue;
		}

		checkKeys(definition, ELEMENT_KEYS, path, report);

		const kind = readKind(definition, path, report);

		if (kind) {
			kinds.set(name, kind);
		}

		const allowChildren = readNames(definition, 'allowChildren', path, report);
		const allowIn = readNames(definition, 'allowIn', path, report);
		const allowAttributes = readNames(definition, 'allowAttributes', path, report);

		if (allowIn && !allowIn.length) {
			report(
				`${path}.allowIn`,
				'is empty, so the element would be allowed nowhere: list its parents, or remove it for the default places.'
			);
		}

		const lowercase = new Map<string, string>();

		for (const [index, attribute] of (allowAttributes ?? []).entries()) {
			const attributePath = `${path}.allowAttributes[${String(index)}]`;
			const collides = lowercase.get(attribute.toLowerCase());

			if (!ATTRIBUTE_NAME.test(attribute)) {
				report(attributePath, `"${attribute}" is not a valid attribute name.`);
			} else if (collides !== undefined) {
				report(
					attributePath,
					`"${attribute}" collides with "${collides}": the names of HTML attributes are not case sensitive, so the data could not tell them apart.`
				);
			} else {
				lowercase.set(attribute.toLowerCase(), attribute);
			}
		}

		for (const key of ['tag', 'editingTag'] as const) {
			const value = definition[key];

			if (value !== undefined && (typeof value !== 'string' || !TAG_NAME.test(value))) {
				report(
					`${path}.${key}`,
					`must be the name of an HTML tag, in lowercase, e.g. "section", not ${JSON.stringify(value)}.`
				);
			} else if (key === 'tag' && typeof value === 'string') {
				const other = tags.get(value);

				if (other === undefined) {
					tags.set(value, name);
				} else {
					report(
						`${path}.tag`,
						`"${value}" is the tag of "${other}" already: the data could not tell them apart. Give one of them another tag.`
					);
				}
			}
		}

		if (kind?.type === 'empty' && allowChildren?.length) {
			report(
				`${path}.allowChildren`,
				'an empty element has no content: remove allowChildren, or change the type.'
			);
		}

		readVerbatim(definition, kind, path, report);

		const listItem = readListItem(definition, kind, path, report);

		if (listItem !== undefined) {
			listItems.set(name, listItem);

			if (allowChildren?.length) {
				report(`${path}.allowChildren`, 'a list holds only its items: remove allowChildren, or listItem.');
			}
		}

		lists.set(name, { allowChildren: kind?.type === 'empty' ? [] : (allowChildren ?? []), allowIn: allowIn ?? [] });
	}

	checkLists(listItems, kinds, lists, external, report);

	// The second pass checks what the lists refer to, and whether the types can hold each other.
	const known = (name: string): ElementSchemaKind | undefined => kinds.get(name) ?? external[name];
	const candidates = [...kinds.keys(), ...Object.keys(external)];

	for (const [name, { allowChildren, allowIn }] of lists) {
		const kind = kinds.get(name);

		if (!kind) {
			continue;
		}

		const items = new Set(listItems.values());

		allowChildren.forEach((child, index) => {
			const path = `${name}.allowChildren[${String(index)}]`;
			const childKind = child === '$text' ? child : resolveReference(child, known, candidates, path, report);

			if (items.has(child)) {
				report(
					path,
					`"${child}" cannot be a child of "${name}": it is a list item, allowed only in its lists.`
				);
			} else if (childKind) {
				const reason = whyNot(kind, childKind);

				if (reason) {
					report(path, `"${child}" cannot be a child of "${name}": ${reason}.`);
				}
			}
		});

		allowIn.forEach((parent, index) => {
			const path = `${name}.allowIn[${String(index)}]`;
			const parentKind = parent === '$root' ? ROOT : resolveReference(parent, known, candidates, path, report);
			const parentItem = listItems.get(parent);

			if (parentItem !== undefined && parentItem !== name) {
				report(
					path,
					`"${name}" cannot be allowed in "${parent}": a list holds only its items ("${parentItem}").`
				);
			} else if (parentKind) {
				const reason = whyNot(parentKind, kind);

				if (reason) {
					report(
						path,
						`"${name}" cannot be allowed in ${parent === '$root' ? 'the root' : `"${parent}"`}: ${reason}.`
					);
				}
			}
		});
	}

	// In the order of the file: the problems of an element together, whichever pass found them.
	const names = Object.keys(elements);
	const position = ({ path }: ElementSchemaIssue): number =>
		names.findIndex(name => path === name || path.startsWith(`${name}.`));

	return issues.sort((a, b) => position(a) - position(b));
}

/**
 * Checks `verbatim`: true or false, and only for a block-level `block`, whose whitespace is its content.
 */
function readVerbatim(
	definition: Record<string, unknown>,
	kind: ElementSchemaKind | null,
	path: string,
	report: Report
): void {
	const { verbatim } = definition;

	if (verbatim !== undefined && typeof verbatim !== 'boolean') {
		report(`${path}.verbatim`, 'must be true or false.');
	} else if (verbatim && kind && (kind.type !== 'block' || kind.isInline)) {
		report(
			`${path}.verbatim`,
			'only a block-level block can be verbatim: its text keeps its new lines. Change the type, or remove verbatim.'
		);
	}
}

/**
 * Reads `listItem`: the name of the item of a list, which must be a block-level `container`. Returns the name, or
 * `undefined` when it is missing or not a name.
 */
function readListItem(
	definition: Record<string, unknown>,
	kind: ElementSchemaKind | null,
	path: string,
	report: Report
): string | undefined {
	const { listItem } = definition;

	if (listItem === undefined) {
		return undefined;
	}

	if (typeof listItem !== 'string' || !listItem) {
		report(`${path}.listItem`, 'must be the name of the element of the items, e.g. "listItem": "item".');

		return undefined;
	}

	if (kind && (kind.type !== 'container' || kind.isInline)) {
		report(
			`${path}.listItem`,
			'only a block-level container can be a list: it holds its items. Change the type, or remove listItem.'
		);
	}

	return listItem;
}

/**
 * Checks the items of the lists: each one is a block-level container of the schema, not the list itself, and has no
 * `allowIn`, as its places are its lists.
 */
function checkLists(
	listItems: ReadonlyMap<string, string>,
	kinds: ReadonlyMap<string, ElementSchemaKind>,
	lists: ReadonlyMap<string, { allowIn: string[] }>,
	external: Readonly<Record<string, ElementSchemaKind>>,
	report: Report
): void {
	const reported = new Set<string>();

	for (const [list, item] of listItems) {
		const path = `${list}.listItem`;
		const kind = kinds.get(item);

		if (item === list) {
			report(path, 'a list cannot be its own item: name the element of its items.');
		} else if (!kind) {
			report(
				path,
				item in external
					? `"${item}" is an element of another plugin: the item of a list must be declared in the schema.`
					: `unknown element "${item}"${suggest(item, [...kinds.keys()])}. Declare the element of the items in the schema.`
			);
		} else if (kind.type !== 'container' || kind.isInline) {
			report(path, `"${item}" must be a block-level container: an item holds the blocks of the item.`);
		} else if (lists.get(item)?.allowIn.length && !reported.has(item)) {
			reported.add(item);
			report(`${item}.allowIn`, `the places of a list item are its lists ("${list}"): remove allowIn.`);
		}
	}
}

/**
 * Returns the kind of the element the list entry names. Reports an unknown name (with the closest known one), and the
 * names that cannot be used there: `$text` and `$root` are not elements that can be both parents and children.
 */
function resolveReference(
	name: string,
	known: (name: string) => ElementSchemaKind | undefined,
	candidates: readonly string[],
	path: string,
	report: Report
): ElementSchemaKind | undefined {
	if (name === '$text' || name === '$root') {
		report(
			path,
			name === '$text'
				? '"$text" is not an element: it is text, and cannot have children or parents.'
				: '"$root" is the root of the editor: it can be a parent (allowIn), not a child.'
		);

		return undefined;
	}

	const kind = known(name);

	if (!kind) {
		report(
			path,
			`unknown element "${name}"${suggest(name, candidates)}. It must be declared in the schema, or be an element of another plugin that is loaded.`
		);
	}

	return kind;
}
