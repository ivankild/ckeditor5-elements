---
title: 'CKEditor 5 element schema converters'
description: 'Convert the elements of a CKEditor 5 element schema one to one: the data mirrors the model, element for element, as HTML, or with converters of your own, e.g. for XML.'
---

# Schema converters

The [element schema](./schema) declares the elements of the content. How they look in the editor and in the data is
declared with **converters**, as for any element of CKEditor: by the plugin, one to one, or by you.

## One to one: `elementSchemaConverters`

With `elementSchemaConverters: true`, the plugin declares the converters **one to one**, in the data and in the editor:
the data has the elements of the model as they are, each with its name and its attributes, and is read back the same.

```ts
plugins: [..., ElementSchema],
elementSchema: schema,
elementSchemaConverters: true
```

| Element                               | In the data and in the editor              |
| ------------------------------------- | ------------------------------------------ |
| inline `empty`, inline `block`        | `<span class="name">`                      |
| a verbatim `block`                    | `<pre class="name">`                       |
| any other, also an inline `container` | `<div class="name">`                       |
| attribute `colorKey`                  | `data-colorkey` (HTML names are lowercase) |

```html
<div class="callout" data-tone="info">
	<div class="calloutTitle">A callout</div>
	<p>Text with a <span class="badge" data-color="red"></span>.</p>
	<div class="divider"></div>
</div>
```

- An inline container is a `div` because it holds blocks, which a `span` cannot hold.
- The `empty` elements are empty in the data too (`<div class="divider"></div>`, with no filler).
- An inline `block` has no block filler, so the cursor can go in an empty one: see
  [Typing in an empty inline element](#typing-in-an-empty-inline-element).
- A [verbatim](./schema#verbatim-blocks) block keeps its whitespace in the `pre`. In the editor, a `<br>` after its text
  makes its last line a line when it is empty, after a new line at its end: a browser shows no line there, and does
  not type there. For converters of your own, `createVerbatimElement()` makes such a view.
- The data is loaded as it is saved, so the same attributes come back, in their case from the schema.

All the [examples](./schema-examples) use these converters, with CSS for the layout.

## A tag of its own: `tag`

`tag` of an element makes it that tag, in the data and in the editor, with no class: e.g. a bold as `<strong>`, or a
divider as `<hr>`. Its attributes are `data-*` attributes, as for the others. Two elements cannot have the same tag, as
the data could not tell them apart.

```json
{
	"bold": { "type": "block", "isInline": true, "tag": "strong" },
	"divider": { "type": "empty", "tag": "hr" }
}
```

An `empty` element with the tag of an HTML element that has no content, e.g. `hr` or `img`, is an empty element in the
editor too.

## Another tag in the editor: `editingTag`

`editingTag` of an element sets another tag for the **editing view** only, e.g. `"editingTag": "figure"`. The data keeps
`div` and `span`, so it does not depend on the editor. The [gallery](./schema-examples#a-gallery-several-inline-containers-in-a-block)
uses it for `figure` and `figcaption`:

```json
{
	"figure": { "type": "container", "isInline": true, "allowIn": ["gallery"], "editingTag": "figure" },
	"caption": { "type": "block", "allowIn": ["figure"], "editingTag": "figcaption" }
}
```

## Selected as a whole

The `empty` and the `container` elements can be **selected** as a whole, by a click on them and by the arrow keys, when
the [`ElementSelectable`](./selectable) plugin is loaded: they are not widgets, and the view is not changed. With
`elementSchemaConverters`, the editor warns in the console when the plugin is not loaded, as the elements could not be
selected then.

```ts
plugins: [..., ElementSchema, ElementSelectable],
elementSchema: schema,
elementSchemaConverters: true
```

## The names of the elements in the data: `'names'`

With `elementSchemaConverters: 'names'`, the data has each element as the element of its **name**, and its attributes
by their names: a `calloutTitle` is `<calloutTitle>`, and a `link` with an `href` is `<link href="…">`. The editing view
stays the HTML above, with `div`, `span`, `tag` and `editingTag`, which the browser edits well.

```ts
elementSchema: schema,
elementSchemaConverters: 'names'
```

```xml
<callout tone="info">
	<calloutTitle>A callout</calloutTitle>
	<p>Text with a <badge color="red"/>.</p>
</callout>
```

It is for a data processor that keeps the case of the names, e.g. of XML, as in the
[DocBook](../examples/docbook) and [DITA](../examples/dita) examples. HTML makes the names lowercase, and the clipboard
is HTML: the converters read the names in lowercase too, so `<callouttitle>` is pasted as a `calloutTitle`.

## Converters of your own

When the data must have other tags, or other attributes, leave the option off and declare the converters yourself, in a
plugin: the schema does not depend on them.

```ts
import { Plugin } from 'ckeditor5';

class CalloutConverters extends Plugin {
	public init(): void {
		const conversion = this.editor.conversion;

		conversion.elementToElement({ model: 'callout', view: { name: 'aside', classes: 'callout' } });
		conversion.attributeToAttribute({ model: { name: 'callout', key: 'tone' }, view: 'data-tone' });
	}
}

// In the editor config:
plugins: [..., ElementSchema, CalloutConverters],
elementSchema: schema
```

For only another tag, the [`tag`](#a-tag-of-its-own-tag) of the element is enough: `"divider": { "type": "empty",
"tag": "hr" }`.

## Typing in an empty inline element

The browser does not type in an empty inline element as CKEditor makes it by default: the text goes **before** it. A
container element of the view, as an element of the model becomes, gets a block filler when it is empty: a `<br>`, so that
an empty paragraph has a height. In a `<span>`, the cursor is then before the `<br>`, and the browser puts the text out of
the `<span>`.

The converters of the schema make the view of an inline element with text
without a block filler. Then CKEditor puts its _inline_ filler where the cursor is, as in the empty `<strong>` of its own
bold, and the text goes in the element, e.g. after it is inserted with [quick insert](./quick-insert), or by the
[bold command](./schema-commands#formatting-bold-italic-underline). For converters of your own, `withoutBlockFiller()`
does it:

```ts
import { withoutBlockFiller } from 'ckeditor5-elements';

conversion.for('downcast').elementToElement({
	model: 'term',
	view: (element, { writer }) => withoutBlockFiller(writer.createContainerElement('dfn'))
});
```

An empty element stays in the content when the cursor leaves it, as `<strong></strong>`, until it is removed.
