# Element schema

`ElementSchema` declares elements in the editor's model schema from a **simple definition**: a plain object, such as a JSON
file. Instead of CKEditor's generic items and `is*` flags, every element has one of three **types**, and the definition is
**validated**, so a contradictory file is rejected before the editor starts.

```json
{
	"callout": { "type": "container", "allowAttributes": ["tone"] },
	"calloutTitle": { "type": "block", "allowIn": ["callout"] },
	"divider": { "type": "empty" },
	"badge": { "type": "empty", "isInline": true, "allowAttributes": ["color"] }
}
```

```ts
import { ElementSchema } from 'ckeditor5-elements';
import schema from './schema.json';

// In the editor config:
plugins: [..., ElementSchema],
elementSchema: schema,
elementSchemaConverters: true // Optional: the elements are `div` and `span`, see "Converters"
```

<EditorDemo name="schemaJson" />

::: details The editor
<<< @/demos/schemaJson.ts
:::

::: details `callouts.json`
<<< @/demos/shared/callouts.json
:::

The demo uses [quick insert](./quick-insert), which lists what the schema allows at a position. Right-click a paragraph and
choose Insert › Insert after, in the root and in the callout: the lists differ, because the callout title is allowed only in
a callout. In a line of text, only inline elements are listed, the badge and a line break.

More schemas are in the [examples](#examples) below.

## The types

The `type` says what an element **holds**. `isInline` says how it is **positioned and laid out**. They are independent:
every type can be inline.

| `type`      | Is like                        | Holds                                                       | In CKEditor                     |
| ----------- | ------------------------------ | ----------------------------------------------------------- | ------------------------------- |
| `empty`     | an image, a line break         | nothing: it is an object, selected as a whole               | `$blockObject`, `$inlineObject` |
| `block`     | a paragraph, a heading         | text and inline elements                                    | `$block`                        |
| `container` | a block quote, a note, a table | blocks, containers and block-level empty elements; not text | `$container`                    |

`isInline: true` is about the position and the layout, not about text: an inline element is laid out in a line with its
siblings, where a block-level one has a line of its own. (The schema only records it, and sets the default places below:
the layout is yours, in the converters and the CSS, e.g. `display: inline-block`.)

| Inline `type` | Is like                                    | Allowed by default       |
| ------------- | ------------------------------------------ | ------------------------ |
| `empty`       | an inline image, a line break              | where text is: in blocks |
| `block`       | a bold that is an element, with attributes | where text is: in blocks |
| `container`   | one of several boxes in a line, in a block | where text is: in blocks |

Inline elements of **every type are allowed only in blocks**. A block holds text and any number of inline elements, so it
can hold several inline containers in a line.

What a parent can hold depends on its own type, whether the child is inline or not:

- A **container** (and the root) holds **block-level elements**: not text, and not inline elements. Inline elements belong
  in a block.
- A **block** holds **text and inline elements** of any type, also several inline containers. A block-level element is
  not allowed in a block.
- An **empty** element holds nothing.

By default, an inline element is allowed where text is, as CKEditor's inline objects. `allowIn` and `allowChildren` can
restrict it to some blocks or add blocks, e.g. of other plugins, but a container or the root cannot be listed: the
validation rejects it.

### Inline containers

An inline container is a box that is not typable and sits in a line with other boxes: the block that holds them lays them
out in a line (cards, columns, chips). Each one holds blocks, as a container does:

```json
{
	"cards": { "type": "block" },
	"card": { "type": "container", "isInline": true, "allowIn": ["cards"] }
}
```

```
<cards><card><paragraph>One</paragraph></card><card><paragraph>Two</paragraph></card></cards>
```

`allowIn` restricts the card to its row. Without it, a card would be allowed in every block, as a bold is.

### Inline text elements

An inline `block` is in the model what a text attribute is in CKEditor's formatting, such as bold, with a difference: it is
an element, so it can have attributes of its own. In the demo, the `term` has an `id`:

```json
{ "term": { "type": "block", "isInline": true, "allowAttributes": ["id"] } }
```

```
<paragraph>a <term id="term-1">b <$text bold="true">c</$text></term> d</paragraph>
```

- It holds text, which can have the attributes text can have (the bold above), and other inline elements.
- By default, it is allowed where text is: in blocks, and in other inline elements. Not in the root or in containers.

::: warning An empty inline element cannot take the cursor
The browser does not place the cursor in an empty inline element: when text is typed in one, it goes before it. So give
users a way to make such elements **around text that exists**, not as empty ones: a command that wraps the selection, a
paste, or the data. Typing in an inline element that has text works, and the attributes stay. (Exclude them from quick
insert, as the demo does with `exclude`.) The schema allows an empty one, and `editor.execute('insertText')` in it works:
the limit is the browser's.
:::

## What an element can have

| Key               | Does                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `allowAttributes` | The attributes the element can have, as in CKEditor.                                                        |
| `allowChildren`   | More elements allowed inside, as in CKEditor: it **adds** to what the type holds. `'$text'` is allowed too. |
| `allowIn`         | The parents the element is allowed in: element names, and `'$root'`.                                        |
| `editingTag`      | The tag in the editing view, with the [converters](#converters) of the plugin. Not in the data.             |

Names can be the elements of the file, and the elements of other plugins, e.g. `paragraph`.

`allowIn` differs from CKEditor in one way, on purpose: when it is given, it **replaces** the default places of the type
(the root and containers for block-level elements, where text is for inline ones). Otherwise an element could never be
restricted to its parent, e.g. a table row to a table, or a title to a callout: CKEditor's `allowIn` only adds places.

## Converters

The schema declares what can be in the model. How the elements look in the editor and in the data is declared with
converters, as for any element. For a start, or for data that is nothing special, set `elementSchemaConverters: true`: the
plugin declares them **one to one**, in the data and in the editor:

| Element                               | In the data and in the editor              |
| ------------------------------------- | ------------------------------------------ |
| inline `empty`, inline `block`        | `<span class="name">`                      |
| any other, also an inline `container` | `<div class="name">`                       |
| attribute `colorKey`                  | `data-colorkey` (HTML names are lowercase) |

An inline container is a `div` because it holds blocks, which a `span` cannot hold. The `empty` elements are empty in the
data too (`<div class="divider"></div>`, with no filler). The data is loaded as it is saved, so the same attributes come
back in their case from the schema.

The `empty` and the `container` elements can be **selected** as a whole, by a click on them and by the arrow keys, when
the [`ElementSelectable`](./selectable) plugin is loaded: they are not widgets, and the view is not changed.

`editingTag` of an element sets another tag for the **editing view** only, e.g. `"editingTag": "figure"`; the data keeps
`div` and `span`, so it does not depend on the editor. The gallery below uses it for `figure` and `figcaption`.

When the data must have other tags, or other attributes, leave the option off and declare the converters yourself: the
schema does not depend on them.

## Examples

More schemas, from small to large. Each live example is a JSON file as it is, and the editor shows what the schema allows: right-click an element, then **Insert › Insert after**, and compare the lists at different positions. The **breadcrumbs** above the editor show the path to the element with the cursor, so you can see what holds what. The demos use the [converters](#converters) of the plugin, and CSS for the layout.

### A table: parents that restrict their children

A table is a container of rows, a row is a container of cells. `allowIn` **replaces** the default places, so a row exists
only in a table, and a cell only in a row: the same as CKEditor's own table.

<EditorDemo name="schemaTable" />

::: details The editor
<<< @/demos/schemaTable.ts
:::

::: details `dataTable.json`
<<< @/demos/shared/dataTable.json
:::

The model of the first rows:

```
<dataTable>
  <dataRow><dataHeader>Element</dataHeader><dataHeader>Type</dataHeader></dataRow>
  <dataRow><dataCell>paragraph</dataCell><dataCell>block</dataCell></dataRow>
</dataTable>
```

A cell is a `block`, so it holds text and inline elements, and the `Bold` button works in it. No cell can be outside a
row, and no row outside a table. (A `container` still holds what CKEditor's containers hold, so a table accepts other
blocks too, as a block quote does. `allowIn` restricts where an element goes, not what a container accepts.)

### A gallery: several inline containers in a block

`isInline` is about the layout: an inline container sits in a line with the others. Inline elements are allowed only
in blocks, so the row of figures is a **block**, the `gallery`, which holds several of them. Each figure is a container
that holds a photo and a caption, and is not typable by itself.

<EditorDemo name="schemaGallery" />

::: details The editor
<<< @/demos/schemaGallery.ts
:::

::: details `gallery.json`
<<< @/demos/shared/gallery.json
:::

```
<gallery>
  <figure><photo></photo><caption>Morning</caption></figure>
  <figure><photo></photo><caption>Noon</caption></figure>
</gallery>
```

- `photo` is `empty`: an object that is selected as a whole, with no content. It is block-level, so it is a block object
  in the figure.
- `caption` is a `block` that is allowed only in a figure.
- The figure is allowed only in a gallery. Without `allowIn`, it would be allowed in every block, in a paragraph too.

### Inline elements: a mention and an abbreviation

An `empty` inline element is like an inline image: an object in a line of text. A `block` inline element is like a text
attribute, e.g. bold, but it is an element, so it has attributes of its own.

<EditorDemo name="schemaInline" />

::: details The editor
<<< @/demos/schemaInline.ts
:::

::: details `inlineMarks.json`
<<< @/demos/shared/inlineMarks.json
:::

```
<paragraph>Ask <mention user="ada"></mention> about the <abbr title="Content Management System">CMS</abbr></paragraph>
```

Both are allowed where text is, so in the paragraph, which is the element of another plugin. The abbreviation is excluded
from quick insert, because an empty one cannot take the cursor in the browser: see
[Inline text elements](#inline-text-elements).

### Elements of other plugins

A name in `allowChildren` or `allowIn` can be an element of another plugin that is loaded, e.g. `paragraph`, `heading1`
or `blockQuote`. `allowChildren` **adds** to what the type holds, and the other plugin's element is extended, not
declared again:

```json
{
	"panel": { "type": "container", "allowChildren": ["blockQuote"], "allowAttributes": ["tone"] },
	"panelTitle": { "type": "block", "allowIn": ["panel"] },
	"intro": { "type": "block", "allowIn": ["blockQuote"] }
}
```

- A `panel` holds what a container holds (paragraphs, headings, other containers), the panel title, and a block quote.
- An `intro` is allowed only in a block quote, which is not the file's: a block quote now holds an `intro` too.
- Declaring `paragraph` in the file is a problem: it exists already.

The editor looks the names up when it starts, after the other plugins are initialized. For the check without an editor,
pass them as `external`: see [Without an editor](#without-an-editor-in-node-js).

## Validation

The definition is checked when the editor is created, and the editor is **not created** when it has problems. The
`ElementSchemaError` lists all of them, with where they are and what to do:

```
The element schema is not valid (4 problems):
- callout.allowChildren[0]: "$text" cannot be a child of "callout": a container cannot contain text: put the text in a block.
- title.type: must be "empty", "block" or "container", not "blok" (did you mean "block"?).
- badge.allowAtributes: is not a known key (did you mean "allowAttributes"?). The keys are: "type", "isInline", "allowChildren", "allowIn", "allowAttributes", "editingTag".
- badge.allowChildren: an empty element has no content: remove allowChildren, or change the type.
```

A definition is rejected when it:

- is not of the shape above, has keys that are not part of it (a typo such as `allowAtributes` is a problem, not ignored,
  and the closest key is suggested), or has values of the wrong type;
- has an element with a missing or unknown `type`, an invalid name (use camelCase), or an `allowIn` that is empty (it
  would allow the element nowhere);
- declares an `empty` element with `allowChildren`, or has `isInline` that is not true or false, or lists attribute names
  that differ only in case (`dataId`, `dataid`): HTML attribute names are not case sensitive, so the data could not tell
  them apart;
- refers to an element that exists neither in the file nor in the editor (with the closest name suggested), lists a name
  twice, or declares an element that another plugin declared already;
- allows what the type cannot hold, whichever side says it, `allowChildren` of the parent or `allowIn` of the child:
  text or an inline element in a container or in the root, a block-level (not inline) element in a block, or anything in
  an `empty` element. Inline elements of every type are fine in a block.

Nesting is fine: a container can allow itself, and elements can refer to each other.

### A schema that is rejected

A contradictory file never reaches the editor. This one has a text in a container, an inline element in a container
and in the root, an empty element with children, and a typo:

```json
{
	"gallery": { "type": "block" },
	"figure": { "type": "container", "isInline": true, "allowIn": ["gallery", "$root"] },
	"photo": { "type": "empty", "allowChildren": ["caption"] },
	"caption": { "type": "block", "allowIn": ["figur"] },
	"row": { "type": "container", "allowChildren": ["$text", "figure"] }
}
```

```
The element schema is not valid (5 problems):
- figure.allowIn[1]: "figure" cannot be allowed in the root: a container cannot contain inline elements: put them in a block.
- photo.allowChildren: an empty element has no content: remove allowChildren, or change the type.
- caption.allowIn[0]: unknown element "figur" (did you mean "figure"?). It must be declared in the schema, or be an element of another plugin that is loaded.
- row.allowChildren[0]: "$text" cannot be a child of "row": a container cannot contain text: put the text in a block.
- row.allowChildren[1]: "figure" cannot be a child of "row": a container cannot contain inline elements: put them in a block.
```

Every problem has its place in the file (`row.allowChildren[1]`), what is wrong, and what to do. All of them are
listed at once, in the order of the file.

### Without an editor, in Node.js

`validateElementSchema()` is the same check, as a function that returns the problems: use it in a test, or in CI, for the
schema file. The main entry of the package loads CKEditor, which needs a browser, so use the entry without it,
`ckeditor5-elements/validate-schema`, which works in Node.js:

```ts
import { validateElementSchema } from 'ckeditor5-elements/validate-schema';
import schema from './schema.json' with { type: 'json' };

// The elements of other plugins that the file refers to; without them, only its own elements are known.
const issues = validateElementSchema(schema, { external: { paragraph: { type: 'block', isInline: false } } });

// [{ path: 'callout.type', message: '…' }, …]; an empty array when valid.
if (issues.length) {
	throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join('\n'));
}
```

The entry also exports `ElementSchemaError`, which formats the list as above, and `compileElementSchema()`.

## What it does not do

- **It declares the schema only, unless asked.** Without `elementSchemaConverters`, how the elements look in the editor
  and in the data is declared with converters, as for any element.
- **The elements are registered in `afterInit()`**, after the other plugins are initialized, so the file can refer to
  their elements. A plugin that extends or converts the elements of the file does it in `afterInit()` or later; the
  converters can be declared at any time.
