# ckeditor5-elements-actions

Element actions for CKEditor 5 Elements: `ElementActions` registers `moveElementUp`, `moveElementDown`,
`duplicateElement` and `deleteElement`, which move an element within its parent, insert an empty copy of it after it, or
delete it.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementActions, ElementContextMenu } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., ElementActions, ElementContextMenu],
elementContextMenu: (element, editor) => [
	editor.commands.get('moveElementUp'),
	editor.commands.get('moveElementDown'),
	'|',
	editor.commands.get('duplicateElement'),
	editor.commands.get('deleteElement')
]
```

See the [Actions guide](https://ivankild.github.io/ckeditor5-elements/guide/actions) of the documentation.

## License

MIT
