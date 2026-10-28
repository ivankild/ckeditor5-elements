import { describe, expect, it } from 'vitest';
import type { ElementSchemaKind } from '../../src/definition/types.js';
import { parseElementSchema, validateElementSchema } from '../../src/definition/validateElementSchema.js';

/**
 * Validates `elements`, and returns the problems as `path: message` lines.
 */
function problems(elements: unknown, external?: Record<string, ElementSchemaKind>): string[] {
	return validateElementSchema(elements, { external }).map(({ path, message }) => `${path}: ${message}`);
}

const PARAGRAPH: ElementSchemaKind = { type: 'block', isInline: false };

describe('validateElementSchema()', () => {
	describe('a valid schema', () => {
		it('has no problems: all the types, inline, lists and references between elements', () => {
			expect(
				problems({
					note: { type: 'container', allowAttributes: ['type'], allowChildren: ['divider', 'title'] },
					title: { type: 'block', allowIn: ['note'], allowChildren: ['badge', '$text'] },
					divider: { type: 'empty' },
					badge: { type: 'empty', isInline: true, allowAttributes: ['color', 'data-x'] },
					table: { type: 'container' },
					row: { type: 'container', allowIn: ['table'] },
					cell: { type: 'block', allowIn: ['row', '$root'] }
				})
			).toEqual([]);
		});

		it('allows nesting a container in itself, and elements that refer to each other', () => {
			expect(
				problems({
					note: { type: 'container', allowChildren: ['note', 'quote'] },
					quote: { type: 'container', allowIn: ['note', 'quote'] }
				})
			).toEqual([]);
		});

		it('allows referring to the elements of other plugins, which are not declared', () => {
			expect(
				problems(
					{
						note: { type: 'container', allowChildren: ['paragraph'] },
						title: { type: 'block', allowIn: ['note', 'blockQuote'] }
					},
					{ paragraph: PARAGRAPH, blockQuote: { type: 'container', isInline: false } }
				)
			).toEqual([]);
		});

		it('accepts the elements at the top, with no wrapper', () => {
			expect(validateElementSchema({ a: { type: 'block' } })).toEqual([]);
		});
	});

	describe('the shape', () => {
		it('rejects what is not an object, and a schema without elements', () => {
			expect(validateElementSchema(null)).toHaveLength(1);
			expect(validateElementSchema([])).toHaveLength(1);
			expect(validateElementSchema('x')).toHaveLength(1);
			expect(problems(undefined)).toEqual([expect.stringContaining(': The schema must be an object')]);
			expect(problems([])).toEqual([expect.stringContaining(': The schema must be an object')]);
			expect(problems({})).toEqual([': The schema declares no elements: declare at least one.']);
		});

		it('rejects the `elements` wrapper that a schema does not have, and says what to do', () => {
			expect(problems({ elements: { a: { type: 'block' } } })).toEqual([
				expect.stringContaining(
					'elements: the schema is the object of the elements itself: remove the "elements" wrapper'
				)
			]);
		});

		it('rejects unknown keys of an element, and suggests the closest one: a typo is not ignored', () => {
			expect(problems({ a: { type: 'block', allowAtributes: ['x'], isInlin: true } })).toEqual([
				expect.stringContaining('a.allowAtributes: is not a known key (did you mean "allowAttributes"?)'),
				expect.stringContaining('a.isInlin: is not a known key (did you mean "isInline"?)')
			]);
		});

		it('rejects a definition that is not an object', () => {
			expect(problems({ a: 'block', b: null, c: [] })).toEqual([
				expect.stringContaining('a: must be an object'),
				expect.stringContaining('b: must be an object'),
				expect.stringContaining('c: must be an object')
			]);
		});
	});

	describe('attribute names', () => {
		it('rejects names that differ only in case: HTML attributes are not case sensitive', () => {
			expect(
				problems({ a: { type: 'block', allowAttributes: ['dataId', 'color', 'dataid', 'DATAID'] } })
			).toEqual([
				'a.allowAttributes[2]: "dataid" collides with "dataId": the names of HTML attributes are not case sensitive, so the data could not tell them apart.',
				'a.allowAttributes[3]: "DATAID" collides with "dataId": the names of HTML attributes are not case sensitive, so the data could not tell them apart.'
			]);
		});

		it('accepts names that differ in more than case', () => {
			expect(problems({ a: { type: 'block', allowAttributes: ['dataId', 'data-id', 'id'] } })).toEqual([]);
		});
	});

	describe('editingTag', () => {
		it('accepts the name of a tag, in lowercase', () => {
			expect(
				problems({ a: { type: 'block', editingTag: 'section' }, b: { type: 'block', editingTag: 'my-tag' } })
			).toEqual([]);
		});

		it('rejects what is not the name of a tag', () => {
			expect(
				problems({
					a: { type: 'block', editingTag: 'Section' },
					b: { type: 'block', editingTag: '<div>' },
					c: { type: 'block', editingTag: 1 }
				})
			).toEqual([
				'a.editingTag: must be the name of an HTML tag, in lowercase, e.g. "section", not "Section".',
				'b.editingTag: must be the name of an HTML tag, in lowercase, e.g. "section", not "<div>".',
				'c.editingTag: must be the name of an HTML tag, in lowercase, e.g. "section", not 1.'
			]);
		});
	});

	describe('tag', () => {
		it('accepts the name of a tag, in lowercase, with an editingTag too', () => {
			expect(
				problems({
					a: { type: 'empty', tag: 'hr' },
					b: { type: 'container', tag: 'aside', editingTag: 'section' }
				})
			).toEqual([]);
		});

		it('rejects what is not the name of a tag, and the tag of another element', () => {
			expect(
				problems({
					a: { type: 'block', tag: 'Strong' },
					b: { type: 'block', isInline: true, tag: 'strong' },
					c: { type: 'block', isInline: true, tag: 'strong' }
				})
			).toEqual([
				'a.tag: must be the name of an HTML tag, in lowercase, e.g. "section", not "Strong".',
				'c.tag: "strong" is the tag of "b" already: the data could not tell them apart. Give one of them another tag.'
			]);
		});
	});

	describe('names', () => {
		it('rejects names that are not camelCase, and generic names', () => {
			expect(
				problems({ Note: { type: 'block' }, 'my-note': { type: 'block' }, $block: { type: 'block' } })
			).toEqual([
				expect.stringContaining('"Note" is not a valid element name'),
				expect.stringContaining('"my-note" is not a valid element name'),
				expect.stringContaining('"$block" is not a valid element name')
			]);
		});

		it('rejects an element that exists in the editor already', () => {
			expect(problems({ paragraph: { type: 'block' } }, { paragraph: PARAGRAPH })).toEqual([
				expect.stringContaining('"paragraph" already exists in the editor')
			]);
		});

		it('rejects invalid attribute names', () => {
			expect(problems({ a: { type: 'block', allowAttributes: ['ok', 'not ok', '1x'] } })).toEqual([
				'a.allowAttributes[1]: "not ok" is not a valid attribute name.',
				'a.allowAttributes[2]: "1x" is not a valid attribute name.'
			]);
		});
	});

	describe('type and isInline', () => {
		it('requires a type, and one of the three', () => {
			expect(problems({ a: {}, b: { type: 'blok' }, c: { type: 1 } })).toEqual([
				'a.type: is required: "empty", "block" or "container".',
				'b.type: must be "empty", "block" or "container", not "blok" (did you mean "block"?).',
				'c.type: must be "empty", "block" or "container", not 1.'
			]);
		});

		it('rejects isInline that is not true or false', () => {
			expect(problems({ a: { type: 'empty', isInline: 'yes' } })).toEqual(['a.isInline: must be true or false.']);
		});

		it('allows inline elements that are empty, or that hold text (a block)', () => {
			expect(
				problems({ image: { type: 'empty', isInline: true }, term: { type: 'block', isInline: true } })
			).toEqual([]);
		});

		it('allows an inline container: a box laid out in a line, which holds blocks, inside a block', () => {
			expect(problems({ chip: { type: 'container', isInline: true } })).toEqual([]);
		});

		it('allows isInline: false for every type', () => {
			expect(
				problems({
					a: { type: 'block', isInline: false },
					b: { type: 'container', isInline: false },
					c: { type: 'empty', isInline: false }
				})
			).toEqual([]);
		});
	});

	describe('lists', () => {
		it('rejects lists that are not arrays of unique, non-empty strings', () => {
			expect(
				problems({
					a: { type: 'block', allowChildren: 'x', allowAttributes: ['x', 'x', '', 1], allowIn: [] }
				})
			).toEqual([
				'a.allowChildren: must be an array of names, e.g. ["a", "b"].',
				'a.allowAttributes[1]: "x" is listed twice.',
				'a.allowAttributes[2]: must be a non-empty string.',
				'a.allowAttributes[3]: must be a non-empty string.',
				expect.stringContaining('a.allowIn: is empty, so the element would be allowed nowhere')
			]);
		});
	});

	describe('empty elements', () => {
		it('cannot have children: allowChildren is rejected, an empty list is fine', () => {
			expect(
				problems({ a: { type: 'empty', allowChildren: ['$text'] }, b: { type: 'empty', allowChildren: [] } })
			).toEqual([expect.stringContaining('a.allowChildren: an empty element has no content')]);
		});

		it('cannot be the parent of an element: allowIn of the child is rejected', () => {
			expect(problems({ image: { type: 'empty' }, caption: { type: 'block', allowIn: ['image'] } })).toEqual([
				'caption.allowIn[0]: "caption" cannot be allowed in "image": an empty element cannot contain anything.'
			]);
		});
	});

	describe('what the types can hold', () => {
		it('a container cannot contain text: allowChildren $text', () => {
			expect(problems({ note: { type: 'container', allowChildren: ['$text'] } })).toEqual([
				'note.allowChildren[0]: "$text" cannot be a child of "note": a container cannot contain text: put the text in a block.'
			]);
		});

		it('a container cannot contain inline elements of any type, from either side: they belong in a block', () => {
			expect(
				problems({
					row: { type: 'container', allowChildren: ['badge', 'term', 'chip'] },
					badge: { type: 'empty', isInline: true },
					term: { type: 'block', isInline: true },
					chip: { type: 'container', isInline: true },
					extra: { type: 'empty', isInline: true, allowIn: ['row'] }
				})
			).toEqual([
				'row.allowChildren[0]: "badge" cannot be a child of "row": a container cannot contain inline elements: put them in a block.',
				'row.allowChildren[1]: "term" cannot be a child of "row": a container cannot contain inline elements: put them in a block.',
				'row.allowChildren[2]: "chip" cannot be a child of "row": a container cannot contain inline elements: put them in a block.',
				'extra.allowIn[0]: "extra" cannot be allowed in "row": a container cannot contain inline elements: put them in a block.'
			]);
		});

		it('a block cannot contain a block, a container or an empty block element, from either side', () => {
			expect(
				problems({
					title: { type: 'block', allowChildren: ['quote', 'divider'] },
					quote: { type: 'block' },
					divider: { type: 'empty' },
					box: { type: 'container', allowIn: ['title'] }
				})
			).toEqual([
				expect.stringContaining(
					'title.allowChildren[0]: "quote" cannot be a child of "title": a block can contain only text and inline elements'
				),
				expect.stringContaining('title.allowChildren[1]: "divider" cannot be a child of "title"'),
				expect.stringContaining('box.allowIn[0]: "box" cannot be allowed in "title"')
			]);
		});

		it('a block can contain text and inline elements', () => {
			expect(
				problems({
					title: { type: 'block', allowChildren: ['$text', 'badge'] },
					badge: { type: 'empty', isInline: true }
				})
			).toEqual([]);
		});

		it('the root cannot contain inline elements, as a container cannot', () => {
			expect(
				problems({
					badge: { type: 'empty', isInline: true, allowIn: ['$root'] },
					chip: { type: 'container', isInline: true, allowIn: ['$root'] }
				})
			).toEqual([
				'badge.allowIn[0]: "badge" cannot be allowed in the root: a container cannot contain inline elements: put them in a block.',
				'chip.allowIn[0]: "chip" cannot be allowed in the root: a container cannot contain inline elements: put them in a block.'
			]);
		});
	});

	describe('inline containers', () => {
		it('hold what containers hold: blocks, containers and block objects, not text', () => {
			expect(
				problems({
					chip: { type: 'container', isInline: true, allowChildren: ['quote', 'divider', '$text'] },
					quote: { type: 'block' },
					divider: { type: 'empty' }
				})
			).toEqual([
				expect.stringContaining('"$text" cannot be a child of "chip": a container cannot contain text')
			]);
		});

		it('can be held by a block, several of them, which holds only text and inline elements, not block-level ones', () => {
			expect(
				problems({
					title: { type: 'block', allowChildren: ['chip', 'box'] },
					chip: { type: 'container', isInline: true },
					box: { type: 'container' }
				})
			).toEqual([
				expect.stringContaining(
					'"box" cannot be a child of "title": a block can contain only text and inline elements'
				)
			]);
		});
	});

	describe('inline text elements: an inline block', () => {
		it('holds text and inline elements, and is allowed in blocks, and in other inline text elements', () => {
			expect(
				problems({
					paragraphLike: { type: 'block', allowChildren: ['term'] },
					term: { type: 'block', isInline: true, allowChildren: ['$text', 'badge', 'term'] },
					badge: { type: 'empty', isInline: true, allowIn: ['term', 'paragraphLike'] }
				})
			).toEqual([]);
		});

		it('cannot hold blocks, containers or empty block-level elements', () => {
			expect(
				problems({
					term: { type: 'block', isInline: true, allowChildren: ['quote', 'divider', 'note'] },
					quote: { type: 'block' },
					divider: { type: 'empty' },
					note: { type: 'container' }
				})
			).toEqual([
				expect.stringContaining(
					'"quote" cannot be a child of "term": an inline text element can contain only text and inline elements'
				),
				expect.stringContaining('"divider" cannot be a child of "term"'),
				expect.stringContaining('"note" cannot be a child of "term"')
			]);
		});

		it('cannot be in a container or in the root, as no inline element can', () => {
			expect(
				problems({
					term: { type: 'block', isInline: true, allowIn: ['note', '$root'] },
					note: { type: 'container', allowChildren: ['term'] }
				})
			).toEqual([
				expect.stringContaining('term.allowIn[0]: "term" cannot be allowed in "note"'),
				expect.stringContaining('term.allowIn[1]: "term" cannot be allowed in the root'),
				expect.stringContaining('note.allowChildren[0]: "term" cannot be a child of "note"')
			]);
		});
	});

	describe('verbatim blocks', () => {
		it('accepts a verbatim block-level block', () => {
			expect(
				problems({ code: { type: 'block', verbatim: true }, text: { type: 'block', verbatim: false } })
			).toEqual([]);
		});

		it('rejects verbatim that is not true or false, or on what is not a block-level block', () => {
			expect(
				problems({
					a: { type: 'block', verbatim: 'yes' },
					b: { type: 'container', verbatim: true },
					c: { type: 'block', isInline: true, verbatim: true }
				})
			).toEqual([
				'a.verbatim: must be true or false.',
				'b.verbatim: only a block-level block can be verbatim: its text keeps its new lines. Change the type, or remove verbatim.',
				'c.verbatim: only a block-level block can be verbatim: its text keeps its new lines. Change the type, or remove verbatim.'
			]);
		});
	});

	describe('lists of items', () => {
		it('accepts lists of items, also two lists of the same items, and lists in items', () => {
			expect(
				problems({
					bullets: { type: 'container', listItem: 'item' },
					numbers: { type: 'container', listItem: 'item' },
					item: { type: 'container' }
				})
			).toEqual([]);
		});

		it('rejects a list item that is not a name, and a list that is not a block-level container', () => {
			expect(
				problems({
					a: { type: 'container', listItem: 5 },
					b: { type: 'block', listItem: 'item' },
					c: { type: 'container', isInline: true, listItem: 'item' },
					item: { type: 'container' }
				})
			).toEqual([
				'a.listItem: must be the name of the element of the items, e.g. "listItem": "item".',
				'b.listItem: only a block-level container can be a list: it holds its items. Change the type, or remove listItem.',
				'c.listItem: only a block-level container can be a list: it holds its items. Change the type, or remove listItem.'
			]);
		});

		it('rejects an item that is unknown, of another plugin, the list itself, or not a block-level container', () => {
			expect(
				problems(
					{
						a: { type: 'container', listItem: 'iten' },
						b: { type: 'container', listItem: 'paragraph' },
						c: { type: 'container', listItem: 'c' },
						d: { type: 'container', listItem: 'text' },
						item: { type: 'container' },
						text: { type: 'block' }
					},
					{ paragraph: PARAGRAPH }
				)
			).toEqual([
				'a.listItem: unknown element "iten" (did you mean "item"?). Declare the element of the items in the schema.',
				'b.listItem: "paragraph" is an element of another plugin: the item of a list must be declared in the schema.',
				'c.listItem: a list cannot be its own item: name the element of its items.',
				'd.listItem: "text" must be a block-level container: an item holds the blocks of the item.'
			]);
		});

		it('rejects other places for an item, and other children for a list, which holds only its items', () => {
			expect(
				problems({
					list: { type: 'container', listItem: 'item', allowChildren: ['note'] },
					item: { type: 'container', allowIn: ['note'] },
					note: { type: 'container', allowChildren: ['item'] },
					title: { type: 'block', allowIn: ['list'] }
				})
			).toEqual([
				'list.allowChildren: a list holds only its items: remove allowChildren, or listItem.',
				'item.allowIn: the places of a list item are its lists ("list"): remove allowIn.',
				'note.allowChildren[0]: "item" cannot be a child of "note": it is a list item, allowed only in its lists.',
				'title.allowIn[0]: "title" cannot be allowed in "list": a list holds only its items ("item").'
			]);
		});
	});

	describe('references', () => {
		it('rejects unknown elements, and suggests the closest known one', () => {
			expect(
				problems({
					note: { type: 'container', allowChildren: ['divder'] },
					divider: { type: 'empty' },
					title: { type: 'block', allowIn: ['nte'] }
				})
			).toEqual([
				expect.stringContaining('note.allowChildren[0]: unknown element "divder" (did you mean "divider"?)'),
				expect.stringContaining('title.allowIn[0]: unknown element "nte" (did you mean "note"?)')
			]);
		});

		it('rejects elements of other plugins that are not known, which the editor knows only when it is created', () => {
			expect(problems({ note: { type: 'container', allowChildren: ['paragraph'] } })).toEqual([
				expect.stringContaining('unknown element "paragraph"')
			]);
		});

		it('uses the type of the elements of other plugins: a block cannot contain the paragraph of another plugin', () => {
			expect(
				problems({ title: { type: 'block', allowChildren: ['paragraph'] } }, { paragraph: PARAGRAPH })
			).toEqual([expect.stringContaining('"paragraph" cannot be a child of "title"')]);
		});

		it('rejects $root as a child, $text as a parent, and other generic names', () => {
			expect(
				problems({
					a: { type: 'container', allowChildren: ['$root', '$block'], allowIn: ['$text'] }
				})
			).toEqual([
				expect.stringContaining('a.allowChildren[0]: "$root" is the root of the editor'),
				expect.stringContaining('a.allowChildren[1]: unknown element "$block"'),
				expect.stringContaining('a.allowIn[0]: "$text" is not an element')
			]);
		});
	});

	it('reports all the problems at once, in the order of the elements', () => {
		const issues = validateElementSchema({
			a: { type: 'nope' },
			b: { type: 'empty', allowChildren: ['x'] },
			c: { type: 'empty', isInline: 'yes' }
		});

		expect(issues.map(({ path }) => path)).toEqual(['a.type', 'b.allowChildren', 'c.isInline']);
	});

	it('lists the problems of an element together, in the order of the file, whether found alone or by a reference', () => {
		const issues = validateElementSchema({
			a: { type: 'container', allowChildren: ['$text'] },
			b: { type: 'empty', isInline: 'yes' },
			c: { type: 'empty', allowChildren: ['a'] }
		});

		expect(issues.map(({ path }) => path)).toEqual(['a.allowChildren[0]', 'b.isInline', 'c.allowChildren']);
	});
});

describe('parseElementSchema()', () => {
	it('returns a valid schema as the definition, with no issues', () => {
		const input = { note: { type: 'container' } };

		expect(parseElementSchema(input)).toEqual({ definition: input, issues: [] });
	});

	it('returns no definition for an invalid schema, with its issues', () => {
		const { definition, issues } = parseElementSchema({ note: { type: 'box' } });

		expect(definition).toBeNull();
		expect(issues.map(({ path }) => path)).toEqual(['note.type']);
	});
});
