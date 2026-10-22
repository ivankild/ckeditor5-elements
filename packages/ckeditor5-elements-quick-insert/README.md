# ckeditor5-elements-quick-insert

Quick insert for CKEditor 5. Alt+Enter (Option+Enter on macOS) opens a menu with a search field and the elements
the schema allows at exactly the selection. With `ckeditor5-elements-context-menu`, the element context menu gets
"Insert ›" with "Insert before" and "Insert after".

```ts
import { QuickInsert } from 'ckeditor5-elements-quick-insert';
import 'ckeditor5-elements-context-menu/index.css';
import 'ckeditor5-elements-quick-insert/index.css';

ClassicEditor.create({
	plugins: [, /* … */ QuickInsert],
	quickInsert: {
		// Elements without a label are listed by their model name.
		labels: { paragraph: 'Paragraph', heading1: 'Heading 1' },
		exclude: ['softBreak']
	}
});
```

`QuickInsert` loads `ElementContextMenu`, which shows the menu. The `quickInsert` command inserts an element by name:
`editor.execute('quickInsert', 'heading1', position)`.
