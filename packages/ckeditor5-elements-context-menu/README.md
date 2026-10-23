# ckeditor5-elements-context-menu

The element context menu of CKEditor 5 Elements: `ElementContextMenu` shows a menu of commands, submenus and separators
for the right-clicked element, or the element at the cursor (the context menu key, Shift+F10).

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementClipboard, ElementContextMenu } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., ElementContextMenu, ElementClipboard],
elementContextMenu: (element, editor) => [editor.commands.get('copyElement'), editor.commands.get('cutElement')]
```

See the "Context menu" guide of the documentation.

## License

MIT
