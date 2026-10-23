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
(from `ckeditor5-elements-selectable`) is loaded too.

`validateElementSchema(schema)` checks a definition without an editor, e.g. in a test or in CI. In Node.js, import it from
`ckeditor5-elements/validate-schema`: the main entry loads CKEditor, which needs a browser.

See the [Element schema guide](https://ivankild.github.io/ckeditor5-elements/guide/schema) of the documentation.

## License

MIT
