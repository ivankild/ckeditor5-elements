# Quick insert

`QuickInsert` opens a menu with a search field and the elements that can be inserted at a position. Type to filter, press Enter to insert the first match, or use the arrow keys to pick one.

```ts
import { QuickInsert } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';
```

The menu is shown by the `ElementMenu` plugin, which `QuickInsert` loads. It does not add
a right-click menu; that needs [`ElementContextMenu`](./context-menu).

## Which elements are listed

Only the elements that the schema allows at **exactly** the position. Nothing is split to make room: inside a paragraph,
only inline elements (such as a line break) are allowed, so headings are not listed there. Between blocks, the blocks
are.

Generic schema items (such as `$text`) are never listed. The elements are listed in the order they were registered.

## Keyboard

Alt+Enter (Option+Enter on macOS) opens the menu at the cursor. The keystroke is listed in the accessibility help
(Alt+0):

<EditorDemo name="quickInsertKeyboard" />

::: details Source
<<< @/demos/quickInsertKeyboard.ts
:::

## Before or after a block

To insert blocks, open the menu for the position before or after a block. The `quickInsertBefore` and
`quickInsertAfter` commands do that for the block with the cursor, or for a given element. Use them as toolbar buttons
or as [context menu](./context-menu) items:

<EditorDemo name="quickInsertBlocks" />

::: details Source
<<< @/demos/quickInsertBlocks.ts
:::

They are enabled only when something can be inserted at that position.

## From code

The `quickInsert` command takes the target first, like all [element commands](./commands): a position, an element
(meaning the position before it), or nothing (the selection).

```ts
// Inserts a heading at the position.
editor.execute('quickInsert', position, 'heading2');

// Without an element name: opens the menu for the position before the element.
editor.execute('quickInsert', element);
```

After inserting, an object is selected; an element that holds text gets the cursor inside it; an element that holds
blocks gets a paragraph with the cursor.

<EditorDemo name="quickInsertCommand" />

::: details Source
<<< @/demos/quickInsertCommand.ts
:::

`editor.plugins.get('QuickInsert')` also has `open(target?, domTarget?)` and `getItems(target?)`.

## Configuration

```ts
quickInsert: {
	// Labels by model name. Elements without a label are listed by their model name.
	labels: { paragraph: 'Paragraph', heading1: 'Heading 1' },

	// Elements that are never listed.
	exclude: ['heading3'],

	// The keystroke that opens the menu at the cursor. `false`: none.
	keystroke: 'Alt+Enter'
}
```

## Limitations

- The menu closes when the document changes while it is open (e.g. by another user), so it never inserts at an outdated
  position.
- Elements are inserted empty, so elements that need attributes to be useful (e.g. an image needs its source) should be
  excluded.
