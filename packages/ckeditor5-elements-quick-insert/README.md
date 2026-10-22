# ckeditor5-elements-quick-insert

Quick insert for CKEditor 5. Alt+Enter (Option+Enter on macOS) opens a menu with a search field and the elements
the schema allows at exactly the selection. The `quickInsertBefore` and `quickInsertAfter` commands open it for the
position before or after an element, e.g. from the element context menu.

```ts
import { QuickInsert } from 'ckeditor5-elements-quick-insert';
import 'ckeditor5-elements-context-menu/index.css';
import 'ckeditor5-elements-quick-insert/index.css';

ClassicEditor.create({
	plugins: [Essentials, Paragraph, QuickInsert],
	quickInsert: {
		// Elements without a label are listed by their model name.
		labels: { paragraph: 'Paragraph', heading1: 'Heading 1' },
		exclude: ['softBreak'],
		// The keystroke that opens the menu at the cursor. `false`: none.
		keystroke: 'Alt+Enter'
	}
});
```

`QuickInsert` loads `ElementContextMenu`, which shows the menu. Commands:

- `quickInsert` takes the target first (a position, an element meaning the position before it, or the selection).
  With an element name, it inserts that element: `editor.execute('quickInsert', position, 'heading1')`. Without one,
  it opens the menu: `editor.execute('quickInsert', element)`.
- `quickInsertBefore` and `quickInsertAfter` open the quick insert menu for the position before or after an element.
  List them in the `elementContextMenu` config, e.g.
  `{ title: 'Insert', items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')] }`.

The menu closes when the document changes while it is open. Elements are inserted empty.

The commands have icons; they are exported as `insertIcon`, `insertBeforeIcon` and `insertAfterIcon`.
