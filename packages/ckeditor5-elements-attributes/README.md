# ckeditor5-elements-attributes

Element attributes for CKEditor 5 Elements: `ElementAttributes` registers the `showElementAttributes` command, which shows
the attributes of an element, as key-value pairs, in CKEditor's modal dialog.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementAttributes } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config: it is a command, so it can be a menu item, a toolbar button, or a callback.
plugins: [..., ElementAttributes],
elementContextMenu: (element, editor) => [editor.commands.get('showElementAttributes')]

// From code:
editor.commands.get('showElementAttributes').executeFor(element);
```

See the [Attributes guide](https://ivankild.github.io/ckeditor5-elements/guide/attributes) of the documentation.

## License

MIT
