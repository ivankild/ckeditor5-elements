import type { ModelSchemaItemDefinition } from 'ckeditor5';
import type { ElementSchemaElement, ElementSchemaInput } from './types.js';

/**
 * The result of {@link compileElementSchema}.
 */
export interface CompiledElementSchema {
	/**
	 * The items to register in CKEditor's schema, by name.
	 */
	items: [name: string, definition: ModelSchemaItemDefinition][];

	/**
	 * The `allowChildren` of the elements, as the places to add to the children: `schema.extend(child, { allowIn: parent })`.
	 * The child can be an element of another plugin, which is extended, not registered.
	 */
	children: { parent: string; child: string }[];
}

/**
 * Translates a valid element schema to the definitions of CKEditor's schema. Each type is made like a generic item of
 * CKEditor:
 *
 * * `container`: like `$container`: allowed in the root and in containers; holds what is allowed in a container: blocks,
 *   containers and block objects, not text.
 * * `block`: like `$block`: a block, allowed in the root and in containers; holds text and inline objects.
 * * `empty` and not inline: like `$blockObject`: an object, allowed where blocks are.
 * * `empty` and inline: like `$inlineObject`: an object, allowed where text is, with the attributes of text.
 * * `block` and inline: an inline element that holds text and inline elements, allowed where text is, with the attributes
 *   of text: like `$text`, but an element, so it can have attributes of its own.
 * * `container` and inline: a container laid out in a line, e.g. with others in a block: allowed where text is, like every
 *   inline element, and holds the same as a container: blocks, not text.
 *
 * `isInline` is about the layout and the position of an element, so it is set for every type, and CKEditor's features and
 * the converters can use it.
 *
 * `allowAttributes` is passed as it is. `allowIn` replaces the default places of the type. `allowChildren` adds to what
 * the type holds, as in CKEditor.
 */
export function compileElementSchema(input: ElementSchemaInput): CompiledElementSchema {
	const items: CompiledElementSchema['items'] = [];
	const children: CompiledElementSchema['children'] = [];

	for (const [name, element] of Object.entries(input)) {
		items.push([name, compileElement(element as ElementSchemaElement)]);

		for (const child of element.allowChildren ?? []) {
			children.push({ parent: name, child });
		}
	}

	return { items, children };
}

function compileElement({ type, isInline, allowIn, allowAttributes }: ElementSchemaElement): ModelSchemaItemDefinition {
	// Where the element is allowed: the places of its type, or the given ones.
	const places = (defaultPlaces: string): Pick<ModelSchemaItemDefinition, 'allowIn' | 'allowWhere'> =>
		allowIn ? { allowIn } : { allowWhere: defaultPlaces };
	const attributes = allowAttributes ? { allowAttributes } : {};

	if (type === 'empty' && isInline) {
		return { inheritTypesFrom: '$inlineObject', allowAttributesOf: '$text', ...places('$text'), ...attributes };
	}

	if (type === 'empty') {
		return { inheritTypesFrom: '$blockObject', ...places('$block'), ...attributes };
	}

	if (type === 'block' && isInline) {
		return {
			isInline: true,
			allowContentOf: '$block',
			allowAttributesOf: '$text',
			...places('$text'),
			...attributes
		};
	}

	if (type === 'block') {
		return { inheritTypesFrom: '$block', allowContentOf: '$block', ...places('$block'), ...attributes };
	}

	return {
		allowContentOf: '$container',
		...(isInline ? { isInline: true, ...places('$text') } : places('$block')),
		...attributes
	};
}
