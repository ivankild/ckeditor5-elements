# Element attributes

`ElementAttributes` registers the `showElementAttributes` command: it shows the attributes of an element, as key-value
pairs, in CKEditor's modal dialog (`Dialog`, which the plugin loads).

```ts
import { ElementAttributes } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., ElementAttributes];
```

It is an [`ElementOrPositionCommand`](./commands), so it has a title ("Show attributes") and an icon, and works wherever
the other element commands do:

- **A menu item**, of the [context menu](./context-menu) or of the [breadcrumbs](./breadcrumbs): the element of the menu.
- **A button of an [element toolbar](./toolbar)**: the element of the toolbar.
- **The callback of a [clickable element](./clickable)**: the element that was clicked.
- **Code**: `editor.commands.get('showElementAttributes').executeFor(element)`. Without a target, it shows the element at
  the selection (the selected element, e.g. an image, or the one with the cursor).

<EditorDemo name="attributesMenu" />

::: details Source
<<< @/demos/attributesMenu.ts
:::

## What it shows

- The name of the element as the title, e.g. `<imageBlock>`, and a row for each attribute. An element without
  attributes shows "No attributes".
- Strings as they are; other values (numbers, booleans, objects) as JSON.
- Values longer than 120 characters are cut, e.g. the data of an image in a `src`.

The command does not change the data, so it works in read-only mode. `command.getAttributes(element)` returns what the
dialog shows, as `[key, value]` pairs of text.

## Styles

The table of the dialog is styled by `ckeditor5-elements/index.css`. The dialog itself is CKEditor's, so it follows its
theme.
