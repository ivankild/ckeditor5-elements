# ckeditor5-elements-context-menu

A context menu for CKEditor 5 elements. Right-clicking an element opens a menu with the clipboard actions for it:
copy, cut, paste (replace), paste before and paste after.

```ts
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import 'ckeditor5-elements-context-menu/index.css';

ClassicEditor.create({
	plugins: [, /* … */ ElementContextMenu],
	// Optional: replaces the default items. Extend them with `getDefaultItems()`.
	elementContextMenu: (element, editor) => [
		...editor.plugins.get(ElementContextMenu).getDefaultItems(element),
		myView
	]
});
```

Other plugins add items to the default menu with `addItems()`, e.g. quick insert adds "Insert ›":

```ts
editor.plugins.get(ElementContextMenu).addItems((element, editor) => [mySubmenu]);
```

Also exported: `ElementClipboard` (the `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore` and
`pasteElementAfter` commands), `SubmenuView` (a menu item with a nested menu), `ElementContextMenuView` and
`createElementClipboardItems()`.

The clipboard actions use the asynchronous Clipboard API, so they work only in secure contexts (HTTPS or `localhost`).
