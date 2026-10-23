# ckeditor5-elements-clipboard

Clipboard commands for CKEditor 5 Elements: `ElementClipboard` registers `copyElement`, `cutElement`, `pasteElement`,
`pasteElementBefore` and `pasteElementAfter`, which act on a whole element, through the CKEditor clipboard pipeline.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementClipboard } from 'ckeditor5-elements';

// plugins: [..., ElementClipboard]
await editor.execute('copyElement', element);
await editor.execute('pasteElementAfter'); // The element at the selection.
```

See the "Clipboard" guide of the documentation.

## License

MIT
