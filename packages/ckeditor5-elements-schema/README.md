# ckeditor5-elements-schema

Element schema for CKEditor 5 Elements: `ElementSchema` declares elements in the model schema from a simple definition,
e.g. a JSON file, with three types of elements (`empty`, `block`, `container`), and rejects definitions that are
contradictory.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```json
{
	"note": { "type": "container", "allowAttributes": ["type"] },
	"title": { "type": "block", "allowIn": ["note"] },
	"badge": { "type": "empty", "isInline": true, "allowAttributes": ["color"] }
}
```

```ts
import { ElementSchema } from 'ckeditor5-elements';
import schema from './schema.json';

// In the editor config:
plugins: [..., ElementSchema],
elementSchema: schema,
elementSchemaConverters: true // Optional: converts the elements one to one, as `div` and `span`
```

The `empty` and `container` elements can be selected as a whole, by a click and by the arrow keys, when `ElementSelectable`
(from `ckeditor5-elements-interaction`) is loaded too.

Two keys make a kind of their own of a type: `verbatim` makes a block keep its whitespace, e.g. code, where Enter
inserts a new line; `listItem` makes a container a list of its items, e.g. `"listItem": "item"`, where Enter makes the
next item.

`ElementSchemaCommands` gives elements of the schema a command, a toolbar button and a keystroke, by their kind: an
inline `block` wraps text, as CKEditor's bold; a `block` renames blocks, as a heading; a `container` wraps blocks, as a
block quote; a list wraps blocks in items; an `empty` element and an inline `container` are inserted, as a horizontal
line. At the ends of inline
elements with text, the arrow keys move in two steps, as CKEditor's two-step caret movement does.

```json
{ "bold": { "type": "block", "isInline": true }, "divider": { "type": "empty" } }
```

```ts
import { IconBold, IconHorizontalLine } from 'ckeditor5';
import { ElementSchema, ElementSchemaCommands } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementSchema, ElementSchemaCommands],
toolbar: ['bold', 'divider'],
elementSchema: schema,
elementSchemaCommands: {
	bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B', view: 'strong' },
	divider: { title: 'Divider', icon: IconHorizontalLine, view: 'hr' }
}
```

`validateElementSchema(schema)` checks a definition without an editor, e.g. in a test or in CI. In Node.js, import it from
`ckeditor5-elements/validate-schema`: the main entry loads CKEditor, which needs a browser.

See the guide of the documentation: [Element schema](https://ivankild.github.io/ckeditor5-elements/guide/schema),
[Converters](https://ivankild.github.io/ckeditor5-elements/guide/schema-converters),
[Commands and buttons](https://ivankild.github.io/ckeditor5-elements/guide/schema-commands) and
[Examples](https://ivankild.github.io/ckeditor5-elements/guide/schema-examples).

## License

MIT
