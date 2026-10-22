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
		exclude: ['softBreak']
	}
});
```

`QuickInsert` loads `ElementContextMenu`, which shows the menu. Commands:

- `quickInsert` inserts an element by name: `editor.execute('quickInsert', 'heading1', position)`.
- `quickInsertBefore` and `quickInsertAfter` open the quick insert menu for the position before or after an element.
  List them in the `elementContextMenu` config, e.g.
  `{ title: 'Insert', items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')] }`.
