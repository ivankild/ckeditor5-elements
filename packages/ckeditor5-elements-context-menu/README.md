# ckeditor5-elements-context-menu

A context menu for CKEditor 5 elements. Right-clicking an element opens a menu of commands for that element.

Menu items are commands (`ElementOrPositionCommand` from `ckeditor5-elements`), submenus and `'|'` separators. The
command holds the knowledge about the item: its `title` and `icon` are the label and icon, its `getState(element)`
decides whether the item is enabled and "on" for the right-clicked element, and choosing the item runs
`executeFor(element)`.

The menu is configured only by the `elementContextMenu` editor config option. Without it, the native context menu
shows.

```ts
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import 'ckeditor5-elements-context-menu/index.css';

ClassicEditor.create({
	plugins: [Essentials, Paragraph, ElementContextMenu, QuickInsert, ElementClipboard],
	elementContextMenu: (element, editor) => [
		editor.commands.get('title'),
		'|',
		{
			title: 'Insert',
			items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
		},
		'|',
		editor.commands.get('copyElement'),
		editor.commands.get('cutElement'),
		editor.commands.get('pasteElement')
	]
});
```

The callback gets the right-clicked model element and the editor, so the items can depend on the element.

- Missing items (e.g. commands of plugins that are not loaded) are skipped, and so are submenus without items.
- Separators at the start or the end of a menu, and repeated ones, are not shown.
- A submenu (`{ title, icon?, items }`) is enabled when one of its items is.
- When the callback returns no items for an element, the native context menu shows.

Also exported: `SubmenuView`, `MenuSeparatorView`, `ElementContextMenuView`, and `show(views, target)` for menus of
custom views.
