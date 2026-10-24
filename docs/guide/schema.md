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
a callout. In a line of text, only inline elements are listed: the badge, the term and a line break.

The schema has more pages:

- [Converters](./schema-converters): how the elements look in the data and in the editor.
- [Commands and buttons](./schema-commands): a command, a toolbar button and a keystroke for each element, as CKEditor's
  bold, heading, block quote or horizontal line have.
- [Examples](./schema-examples): a table, a gallery, and inline elements, as live schemas.

## Types: what an element holds

The `type` says what an element **holds**:

| `type`      | Is like                        | Holds                                                       | In CKEditor                     |
| ----------- | ------------------------------ | ----------------------------------------------------------- | ------------------------------- |
| `empty`     | an image, a line break         | nothing: it is an object, selected as a whole               | `$blockObject`, `$inlineObject` |
| `block`     | a paragraph, a heading         | text and inline elements                                    | `$block`                        |
| `container` | a block quote, a note, a table | blocks, containers and block-level empty elements; not text | `$container`                    |

What a parent can hold depends on its own type, whether the child is inline or not:

- A **container** (and the root) holds **block-level elements**: not text, and not inline elements. Inline elements belong
  in a block.
- A **block** holds **text and inline elements** of any type, also several inline containers. A block-level element is
  not allowed in a block.
- An **empty** element holds nothing.

## Inline elements: where an element is

`isInline` says how an element is **positioned and laid out**, whatever its type: every type can be inline. It is about
the position and the layout, not about text: an inline element is laid out in a line with its siblings, where a
block-level one has a line of its own. (The schema only records it, and sets the default places below: the layout is
yours, in the converters and the CSS, e.g. `display: inline-block`.)

| Inline `type` | Is like                                    | Allowed by default       |
| ------------- | ------------------------------------------ | ------------------------ |
| `empty`       | an inline image, a line break              | where text is: in blocks |
| `block`       | a bold that is an element, with attributes | where text is: in blocks |
| `container`   | one of several boxes in a line, in a block | where text is: in blocks |

Inline elements of **every type are allowed only in blocks**. A block holds text and any number of inline elements, so it
can hold several inline containers in a line.

By default, an inline element is allowed where text is, as CKEditor's inline objects. `allowIn` and `allowChildren` can
restrict it to some blocks or add blocks, e.g. of other plugins, but a container or the root cannot be listed: the
validation rejects it.

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

To make one work as CKEditor's bold, with a button that wraps the selection, see
[Formatting](./schema-commands#formatting-bold-italic-underline). An empty one takes the cursor, e.g. after it is inserted
with quick insert: see [Typing in an empty inline element](./schema-converters#typing-in-an-empty-inline-element).

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

## What an element can have

| Key               | Does                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `allowAttributes` | The attributes the element can have, as in CKEditor.                                                        |
| `allowChildren`   | More elements allowed inside, as in CKEditor: it **adds** to what the type holds. `'$text'` is allowed too. |
| `allowIn`         | The parents the element is allowed in: element names, and `'$root'`.                                        |
| `editingTag`      | The tag in the editing view, with the [converters](./schema-converters) of the plugin. Not in the data.     |

`allowIn` differs from CKEditor in one way, on purpose: when it is given, it **replaces** the default places of the type
(the root and containers for block-level elements, where text is for inline ones). Otherwise an element could never be
restricted to its parent, e.g. a table row to a table, or a title to a callout: CKEditor's `allowIn` only adds places.

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

The editor looks the names up when it starts, after the other plugins are initialized: see
[When the elements are registered](#when-the-elements-are-registered). For the check without an editor, pass them as
`external`: see [Without an editor](#without-an-editor-in-node-js).

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

## When the elements are registered

The elements are registered in `afterInit()`, after the other plugins are initialized, so the file can refer to their
elements. A plugin that extends or converts the elements of the file does it in `afterInit()` or later; the converters can
be declared at any time. `ElementSchemaCommands` makes its commands then too.

The plugin declares the schema only, unless asked: without `elementSchemaConverters`, how the elements look in the editor
and in the data is declared with converters, as for any element. See [Converters](./schema-converters).
