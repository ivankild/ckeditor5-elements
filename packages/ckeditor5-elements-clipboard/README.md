# ckeditor5-elements-clipboard

Clipboard commands for CKEditor 5 elements: copy, cut, paste (replace), paste before and paste after an element.

```ts
import { ElementClipboard } from 'ckeditor5-elements-clipboard';

ClassicEditor.create({ plugins: [Essentials, Paragraph, ElementClipboard] });

await editor.execute('copyElement', element);
await editor.execute('pasteElementAfter'); // The element at the selection.
```

| Command              | Does                                      |
| -------------------- | ----------------------------------------- |
| `copyElement`        | Copies the element (HTML and plain text). |
| `cutElement`         | Copies the element and removes it.        |
| `pasteElement`       | Replaces the element with the clipboard.  |
| `pasteElementBefore` | Inserts the clipboard before the element. |
| `pasteElementAfter`  | Inserts the clipboard after the element.  |

The commands extend `ElementOrPositionCommand` (from `ckeditor5-elements`): the target is an element, the parent of a
position, or taken from the selection. They have titles, so they can be menu items.

To show them in the element context menu, list them in the `elementContextMenu` config of
`ckeditor5-elements-context-menu`. This package does not depend on it.

The commands use the asynchronous Clipboard API, so they work only in secure contexts (HTTPS or `localhost`).
