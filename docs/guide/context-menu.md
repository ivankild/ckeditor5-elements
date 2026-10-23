# Context menu

`ElementContextMenu` shows a menu when an element is right-clicked, or when the context menu is opened with the
keyboard. It is configured only by the `elementContextMenu` editor option: a
callback that gets the model element and the editor, and returns the items.

```ts
import { ElementContextMenu } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
elementContextMenu: (element, editor) => [/* commands, submenus and '|' separators */];
```

The menu is shown by the `ElementMenu` plugin (loaded by `ElementContextMenu`), which
also shows the [breadcrumbs](./breadcrumbs) and [quick insert](./quick-insert) menus. The menu is CKEditor's dropdown
menu (`DropdownMenuRootListView`): CKEditor builds it and handles the nested menus, the keyboard and right-to-left
languages; the plugin connects its buttons to the commands. A toggle that is on is shown as CKEditor shows an "on"
button.

- A **command** (any [`ElementOrPositionCommand`](./commands)) is shown as a button with its title and icon, enabled
  and "on" according to its state for the element. Choosing it executes it for the element. A toggle (a command with
  `isToggleable`) is a checkable menu item, so screen readers announce whether it is on.
- A **submenu** is `{ title, icon?, items }`. It is enabled when one of its items is. It opens on click or hover,
  next to its item, on the side where it fits. Only one submenu is open at a time.
- `'|'` is a **separator**. Separators at the start or the end, and repeated ones, are not shown.
- Missing items, e.g. `editor.commands.get()` of a plugin that is not loaded, are skipped.
- No items means the native context menu.

The menu closes when its element is removed, e.g. by another user. A command that fails (e.g. a clipboard command when
the browser does not allow reading the clipboard) is reported with a warning of the `Notification` plugin, titled
`Could not complete "<command title>".` By default, CKEditor shows only the message, with `window.alert()`; a custom
notification UI gets the title too.

All the commands have icons, and the icons are exported too, e.g. for submenus: `insertIcon`, `insertBeforeIcon`,
`insertAfterIcon`, `copyIcon`, `cutIcon`, `pasteIcon`, `pasteBeforeIcon` and `pasteAfterIcon`.

## Clipboard commands

The simplest menu: the [clipboard commands](./clipboard) for the right-clicked element.

<EditorDemo name="contextMenuBasic" />

::: details Source
<<< @/demos/contextMenuBasic.ts
:::

## Submenus and separators

A toggle command ("Note" is "on" inside a note), an "Insert" submenu with the quick insert commands, the
[element actions](./actions) (move up and down, duplicate, delete), and a "Paste" submenu with its own separator.
"Move up" and "Move down" are disabled for the first and the last block.

<EditorDemo name="contextMenuSubmenus" />

::: details Source
<<< @/demos/contextMenuSubmenus.ts
:::

## Items per element

The callback gets the element, so each element can have its own menu. Here, headings can be copied or cut, an empty
paragraph can be pasted over, and other elements get the native menu.

<EditorDemo name="contextMenuPerElement" />

::: details Source
<<< @/demos/contextMenuPerElement.ts
:::

## Keyboard

The context menu key, or Shift+F10, opens the menu of the element at the cursor (or of the selected element, e.g. an
image), next to it. Shift+F10 is listed in the accessibility help (Alt+0).

In the menu, arrow keys and Tab move between the items, the right arrow opens a submenu and the left arrow closes it
(the other way round in right-to-left languages).
Esc closes the menu and returns the focus to the editor.
