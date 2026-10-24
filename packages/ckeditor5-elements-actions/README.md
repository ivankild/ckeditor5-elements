# ckeditor5-elements-actions

Element actions for CKEditor 5 Elements, the commands that act on a whole element:

- `ElementActions` registers `moveElementUp`, `moveElementDown`, `duplicateElement` and `deleteElement`, which move an
  element within its parent, insert an empty copy of it after it, or delete it.
- `ElementClipboard` registers `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore` and `pasteElementAfter`,
  which copy, cut and paste an element, through the CKEditor clipboard pipeline.

The commands have titles and icons, so they are menu items and buttons as they are.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementActions, ElementClipboard, ElementContextMenu } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., ElementActions, ElementClipboard, ElementContextMenu],
elementContextMenu: (element, editor) => [
	editor.commands.get('moveElementUp'),
	editor.commands.get('moveElementDown'),
	'|',
	editor.commands.get('duplicateElement'),
	editor.commands.get('deleteElement'),
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('cutElement'),
	editor.commands.get('pasteElementAfter')
]
```

```ts
await editor.execute('copyElement', element);
await editor.execute('pasteElementAfter'); // The element at the selection.
```

See the [Actions](https://ivankild.github.io/ckeditor5-elements/guide/actions) and
[Clipboard](https://ivankild.github.io/ckeditor5-elements/guide/clipboard) guides of the documentation.

## License

MIT
