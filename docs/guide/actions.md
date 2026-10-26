---
title: 'Move, duplicate and delete elements in CKEditor 5'
description: 'CKEditor 5 commands that move an element up or down, duplicate it or delete it, as menu items and toolbar buttons.'
---

# Actions

`ElementActions` registers commands that move, duplicate and delete a whole element:

| Command            | Does                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `moveElementUp`    | Swaps the element with the one before it. Disabled for the first one. |
| `moveElementDown`  | Swaps the element with the one after it. Disabled for the last one.   |
| `duplicateElement` | Inserts the same element, empty, after it, and puts the cursor in it. |
| `deleteElement`    | Deletes the element.                                                  |

```ts
import { ElementActions } from 'ckeditor5-elements';
```

They are [`ElementOrPositionCommand`s](./commands): the target is an element, the parent element of a position, or the
element at the selection. They have titles and icons, so they work as buttons and as [context menu](./context-menu)
items.

- **Moving** happens within the parent: the first block of a note cannot move up, and the last one cannot move down.
  The cursor stays in the moved element.
- **Duplicating** keeps the name and the attributes of the element: a note of a type gives a note of the same type,
  with an empty paragraph. A list item gives a new list item. Objects, such as images and tables, are copied with
  their content, as they cannot be empty.
- **Deleting** the only block of a note leaves the note with an empty paragraph, so it can still be written in.

The parts of a structure, such as table cells, table rows and captions, cannot be moved, duplicated or deleted on
their own, so the commands are disabled for them: use the table commands for those.

## Toolbar buttons and the context menu

`ElementOrPositionButtonView` turns the commands into toolbar buttons that act on the element with the cursor. Here,
the same commands are in the context menu too.

<EditorDemo name="actionsToolbar" />

::: details Source
<<< @/demos/actionsToolbar.ts
:::

## From code

Without a target, the commands act on the element at the selection. `executeFor()` acts on a given element, even when
the command is disabled at the selection:

```ts
editor.execute('duplicateElement');
editor.commands.get('moveElementUp').executeFor(element);
```

The icons are exported too, e.g. for submenus: `moveUpIcon`, `moveDownIcon`, `duplicateIcon` and `deleteIcon`.
