# Context menu

`ElementContextMenu` (from `ckeditor5-elements-context-menu`) shows a menu when an element is right-clicked. It is
configured only by the `elementContextMenu` editor option: a callback that gets the right-clicked model element and the
editor, and returns the items.

```ts
elementContextMenu: (element, editor) => [/* commands, submenus and '|' separators */];
```

- A **command** (any [`ElementOrPositionCommand`](./commands)) is shown as a button with its title and icon, enabled
  and "on" according to its state for the element. Choosing it executes it for the element.
- A **submenu** is `{ title, items }`. It is enabled when one of its items is.
- `'|'` is a **separator**. Separators at the start or the end, and repeated ones, are not shown.
- Missing items, e.g. `editor.commands.get()` of a plugin that is not loaded, are skipped.
- No items means the native context menu.

## Clipboard commands

The simplest menu: the [clipboard commands](./clipboard) for the right-clicked element.

<EditorDemo name="contextMenuBasic" />

::: details Source
<<< @/demos/contextMenuBasic.ts
:::

## Submenus and separators

A toggle command ("Note" is "on" inside a note), an "Insert" submenu with the quick insert commands, and a "Paste"
submenu with its own separator.

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

Arrow keys and Tab move between the items, the right arrow opens a submenu and the left arrow closes it. Esc closes the
menu and returns the focus to the editor.
