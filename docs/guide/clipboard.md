# Clipboard

`ElementClipboard` (from `ckeditor5-elements-clipboard`) registers clipboard commands that act on a whole element:

| Command              | Does                                                   |
| -------------------- | ------------------------------------------------------ |
| `copyElement`        | Copies the element to the clipboard, as HTML and text. |
| `cutElement`         | Copies the element and removes it.                     |
| `pasteElement`       | Replaces the element with the clipboard content.       |
| `pasteElementBefore` | Inserts the clipboard content before the element.      |
| `pasteElementAfter`  | Inserts the clipboard content after the element.       |

They are [`ElementOrPositionCommand`s](./commands): the target is an element, the parent element of a position, or the
element at the selection. They have titles, so they work as buttons and as [context menu](./context-menu#clipboard-commands)
items. Copying stays enabled in read-only mode.

::: warning Secure contexts only
The commands use the asynchronous Clipboard API, so they work only on HTTPS or `localhost`. The browser may ask for
permission to read the clipboard when pasting.
:::

## Toolbar buttons

`ElementOrPositionButtonView` turns the commands into toolbar buttons. Without a target, they act on the block with the
cursor.

<EditorDemo name="clipboardToolbar" />

::: details Source
<<< @/demos/clipboardToolbar.ts
:::

## From code

Execute the commands with a target element. They return a promise, as the Clipboard API is asynchronous.

```ts
await editor.execute('copyElement', element);
await editor.execute('pasteElementAfter', otherElement);
await editor.execute('cutElement'); // The element at the selection.
```

<EditorDemo name="clipboardApi" />

::: details Source
<<< @/demos/clipboardApi.ts
:::
