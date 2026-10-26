/**
 * The kinds of elements of an element schema:
 *
 * * `empty`: has no content, like an image or a line break. It is an object: selected as a whole.
 * * `block`: can contain text and inline elements, like a paragraph or a heading. With `isInline`, it is an inline
 *   element with text, like a bold, a link or a term.
 *
 * * `container`: cannot contain text; holds blocks, empty block elements and other containers, like a block quote or a
 *   note.
 *
 * Every type can be inline (see {@link ElementSchemaElement#isInline}): the type says what the element holds, `isInline`
 * where and how it is laid out. Inline elements are allowed only in blocks.
 */
export type ElementSchemaType = 'empty' | 'block' | 'container';

/**
 * The kind of an element: what it is, and whether it is inline: laid out in a line with its siblings, instead of on a
 * line of its own. Any type can be inline.
 */
export interface ElementSchemaKind {
	type: ElementSchemaType;
	isInline: boolean;
}

/**
 * The definition of one element of an element schema.
 */
export interface ElementSchemaElement {
	/**
	 * What the element is: `'empty'`, `'block'` or `'container'`.
	 */
	type: ElementSchemaType;

	/**
	 * Whether the element is inline: it is about the position and the layout of the element, not about text. An inline
	 * element is laid out in a line with its siblings, where a block-level one has a line of its own. Any type can be:
	 *
	 * * `empty`: like an inline image, or a line break;
	 * * `block`: an element with text in a line of text, like a bold, a link or a term, with attributes of its own;
	 * * `container`: a box that is not typable, in a line with other boxes, e.g. several in a block.
	 *
	 * Inline elements are allowed only in blocks: by default, where text is. A block holds text and any number of inline
	 * elements; containers and the root hold no inline elements. Default: `false`.
	 */
	isInline?: boolean;

	/**
	 * The elements allowed inside this one, in addition to what its type allows: names of elements of the schema, or of
	 * elements of other plugins, and `'$text'`. As in CKEditor's `allowChildren`.
	 *
	 * What a type allows by default: a `block` has text and inline elements; a `container` has blocks, containers and
	 * `empty` block-level elements.
	 */
	allowChildren?: string[];

	/**
	 * The elements this one is allowed in, in addition to what its type allows: names of elements, and `'$root'`. As in
	 * CKEditor's `allowIn`.
	 *
	 * Unlike in CKEditor, when it is given it **replaces** the default places (a block-level element is allowed in the
	 * root and in containers; an inline element, where text is), so that an element can be restricted to its parent,
	 * e.g. a row to a table.
	 */
	allowIn?: string[];

	/**
	 * The attributes the element can have, as in CKEditor's `allowAttributes`.
	 */
	allowAttributes?: string[];

	/**
	 * The tag of the element, in the data and in the editing view, e.g. `'strong'` or `'hr'`, when the converters of the
	 * schema are on (the `elementSchemaConverters` option): the element is that tag, with no class. Two elements cannot
	 * have the same tag. Default: a `div` or a `span`, with the name of the element as its class.
	 */
	tag?: string;

	/**
	 * The tag of the element in the editing view only, e.g. `'section'`, when the converters of the schema are on (the
	 * `elementSchemaConverters` option). Default: the tag of the data.
	 */
	editingTag?: string;

	/**
	 * Whether the block is verbatim: its whitespace is its content, e.g. code, a literal layout or a poem. It keeps its
	 * spaces and its new lines; Enter inserts a new line in it, and leaves it on an empty last line. Only a block-level
	 * `block` can be verbatim. With the converters of the schema, it is a `pre`. Default: `false`.
	 */
	verbatim?: boolean;

	/**
	 * Makes the container a list: the name of the element of its items, a block-level `container` of the schema, e.g.
	 * `"listItem": "listitem"`. The list holds only its items, and the item is allowed only in its lists, so it has no
	 * `allowIn`, and the list no `allowChildren`. Enter in an item makes the next item, and leaves the list in an empty
	 * one. Several lists can have the same item, e.g. a bulleted and a numbered list.
	 */
	listItem?: string;
}

/**
 * An element schema: the definitions of the elements, by name.
 */
export type ElementSchemaDefinition = Record<string, ElementSchemaElement>;

/**
 * What the `elementSchema` option accepts: an {@link ElementSchemaDefinition}, or a JSON file imported as it is, whose
 * strings TypeScript does not know are the allowed ones, and whose arrays are not known to be mutable. Either way, it is
 * validated when the editor is created.
 */
export type ElementSchemaInput = Record<
	string,
	{
		[Key in keyof ElementSchemaElement]: Key extends 'type'
			? string
			: ElementSchemaElement[Key] extends string[] | undefined
				? readonly string[] | undefined
				: ElementSchemaElement[Key];
	}
>;

/**
 * A problem of an element schema.
 */
export interface ElementSchemaIssue {
	/**
	 * Where the problem is, e.g. `note.allowChildren[1]`.
	 */
	path: string;

	/**
	 * What is wrong, and what to do about it.
	 */
	message: string;
}

/**
 * The options of {@link validateElementSchema}.
 */
export interface ValidateElementSchemaOptions {
	/**
	 * Elements that exist outside the schema, e.g. `paragraph` of the `Paragraph` plugin, by name. The schema can refer to
	 * them, but cannot declare them. Without them, the schema can refer only to its own elements.
	 */
	external?: Readonly<Record<string, ElementSchemaKind>>;
}
