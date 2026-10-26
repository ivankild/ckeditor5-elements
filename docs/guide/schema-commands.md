---
title: 'CKEditor 5 commands and buttons for the element schema'
description: 'Give every element of a CKEditor 5 schema a command, a toolbar button and a keystroke: formatting as elements, blocks, containers, lists and inserted elements, with two-step caret movement.'
---

# Schema commands and buttons

`ElementSchemaCommands` gives every element of the [schema](./schema) its command, toolbar button and keystroke. The
command of an element is the one of its **kind**: formatting wraps text in the element, a block renames blocks, a
container wraps them, and the other elements are inserted. Each works as the CKEditor feature of that kind:

| Element                       | Command                   | Works as CKEditor's | It                                         |
| ----------------------------- | ------------------------- | ------------------- | ------------------------------------------ |
| inline `block`                | `ElementInlineCommand`    | bold                | wraps the selected text, or unwraps it     |
| `block`                       | `ElementBlockCommand`     | heading             | renames the blocks, or back to paragraphs  |
| `container`                   | `ElementContainerCommand` | block quote         | wraps the blocks, or unwraps them          |
| `container` with `listItem`   | `ElementListCommand`      | lists               | puts the blocks in a list, each in an item |
| `empty`, and inline container | `ElementInsertCommand`    | horizontal line     | inserts the element, and selects it        |

```ts
import { IconBold, IconHorizontalLine, IconQuote } from 'ckeditor5';
import { ElementSchema, ElementSchemaCommands } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementSchema, ElementSchemaCommands],
toolbar: ['bold', 'callout', 'divider'],
elementSchema: schema,
elementSchemaCommands: {
	bold: { title: 'Bold', icon: IconBold, keystroke: 'Ctrl+B', view: 'strong' },
	callout: { title: 'Callout', icon: IconQuote },
	divider: { title: 'Divider', icon: IconHorizontalLine, view: 'hr' }
}
```

Each key of `elementSchemaCommands` is the name of the command and of its toolbar button. With CKEditor's own feature in
the same editor, e.g. `Bold`, use another key: two buttons cannot have the same name.

| Key         | Does                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `element`   | The model element: of the schema, or of another plugin, e.g. `paragraph`. Default: the key.                     |
| `title`     | The title of the command, and the label of the button.                                                          |
| `icon`      | The icon of the command and of the button, e.g. `IconBold` of CKEditor.                                         |
| `keystroke` | The keystroke of the command, e.g. `'Ctrl+B'` (`⌘B` on a Mac).                                                  |
| `view`      | The tag in the data and in the editor, e.g. `'strong'` or `'hr'`. Without it, the schema's converters make one. |

The commands are made when the elements are registered, after the other plugins are initialized. The editor is not
created when an element is unknown.

## Formatting: bold, italic, underline

Formatting is **elements** too. A bold, an italic or an underline is an inline `block` of the schema: an element in the
line of text, with its own name and attributes, which nests in other elements and holds others, is part of the
[breadcrumbs](./breadcrumbs) path and of the element features, and is what the data has. `ElementInlineCommand` toggles
it on the selection, as CKEditor's bold toggles its mark on the text, and works as an element does: e.g. it can be
empty.

<EditorDemo name="schemaFormatting" />

::: details The editor
<<< @/demos/schemaFormatting.ts
:::

::: details `formatting.json`
<<< @/demos/shared/formatting.json
:::

| On                   | It                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| selected text        | wraps the text that is not in the element yet, in each block, and merges it with the elements next to it          |
| text all in elements | unwraps the elements, the whole ones: `<bold>a[b]c</bold>` is `a[b]c`                                             |
| the cursor           | inserts an empty element, with the cursor in it                                                                   |
| the cursor in one    | moves the cursor out, before or after it, at its start or end; unwraps it in the middle, or removes it when empty |
| an element           | unwraps the element it is in, or wraps it, e.g. a selected inline object                                          |

It is "on" when the cursor or the element is in the element, or all the selected text is. The model is a tree of
elements, down to the formatting:

```
<paragraph>a <bold>b <italic>c</italic></bold> d</paragraph>
```

An empty element takes the cursor and what is typed: see
[Typing in an empty inline element](./schema-converters#typing-in-an-empty-inline-element).

### Two-step caret movement

At an end of an element, the cursor can be in it or out of it, and the two look the same. The left and right arrow keys
move it in two steps there, as CKEditor's two-step caret movement does at the ends of a bold: the first step goes into
the element (or out of it) without moving on the screen, the next one moves in the text.

```
a[]<bold>bc</bold>   →   a<bold>[]bc</bold>   →   a<bold>b[]c</bold>
a<bold>bc[]</bold>d  →   a<bold>bc</bold>[]d  →   a<bold>bc</bold>d[]
```

What is typed goes where the cursor is, in the element or out of it, and the bold button shows which. (The browser would
type at a place of its own, the end of the text before the boundary: there, the plugin types instead of it.) Nested
elements take one step each. Pressing the keystroke at the end of an element moves the cursor out too.

## Blocks, containers, lists and inserted elements

<EditorDemo name="schemaCommands" />

::: details The editor
<<< @/demos/schemaCommands.ts
:::

::: details `commands.json`
<<< @/demos/shared/commands.json
:::

### Blocks

A `block` (the `title`) works as a heading, with `ElementBlockCommand`: the blocks of the selection are renamed, and keep
their content. When they all are titles, they are turned back into paragraphs: the `defaultElement` of the command, which
can be changed. Blocks that cannot be renamed, as a divider, or a block where a title is not allowed, are left as they
are. It is "on" when all the blocks are titles.

A [verbatim](./schema#verbatim-blocks) block (the `code`) is a block too: its command works as a code block's does,
renaming the blocks. In it, Enter inserts a new line.

### Containers

A `container` (the `callout`) works as a block quote, with `ElementContainerCommand`: the selected blocks go in a new
callout. With blocks at different levels, it wraps their ancestors in the parent they share. In a callout, it unwraps the
whole callout. It is "on" in a callout.

### Lists

A [list](./schema#lists) (the `steps`, a container with `listItem`) works as CKEditor's lists, with `ElementListCommand`:
the selected blocks go in a new list, each one in an item. In a list, it unwraps the list and its items; in another list
with the same items, it turns that list into its own, e.g. a bulleted list into a numbered one. It is "on" in its list.
In an item, Enter makes the next item, and leaves the list in an empty one.

### Inserted elements

An `empty` element (the `divider`, the inline `badge`) works as a horizontal line or an inline image, with
`ElementInsertCommand`: it is inserted in place of the selection, and selected. A block-level one in the middle of a
paragraph splits it. An inline `container` (the `chip`) is inserted the same way, with a paragraph and the cursor in it.
It does not toggle: it is never "on".

## In a menu, for an element

The commands are [element commands](./commands): each one is for the selection, or for a given position or element, with
`executeFor()`, and `getState()` tells whether it is enabled and "on" there. They have a title and an icon, so they are
menu items as they are, e.g. of the [context menu](./context-menu), for the element that is right-clicked:

```ts
elementContextMenu: (element, editor) => [editor.commands.get('title'), editor.commands.get('callout')];
```

For a given element, a block is renamed, a container wraps it (or unwraps the one it is in), and an inserted element goes
after it.

## A command of your own

The commands share their base, `ElementSchemaCommand`, an `ElementOrPositionCommand` for one element: a command of your
own for an element of the schema can extend it, and describe what it does.

```ts
import { ElementSchemaCommand, type ElementOrPosition } from 'ckeditor5-elements';

// Removes the callout that the target is in.
class RemoveCalloutCommand extends ElementSchemaCommand {
	public override execute(target?: ElementOrPosition): void {
		const callout = this._findElement(target);

		if (callout) {
			this.editor.model.change(writer => writer.remove(callout));
		}
	}

	protected override _isEnabledFor(target?: ElementOrPosition): boolean {
		return super._isEnabledFor(target) && !!this._findElement(target);
	}
}

editor.commands.add('removeCallout', new RemoveCalloutCommand(editor, 'callout'));
```

| Member                  | Is                                                                               |
| ----------------------- | -------------------------------------------------------------------------------- |
| `elementName`, `isOn`   | The element of the command, and whether the target is in it (from `_isOnFor()`). |
| `isElement(node)`       | Whether a node is the element.                                                   |
| `_findElement(target)`  | The closest element that the target is, or is in.                                |
| `_getAncestors(target)` | The elements the target is, or is in, the inner first.                           |
| `_getSelectedRanges()`  | The selected ranges, when the selection is content, not a cursor nor an element. |
| `_getBlocks(target)`    | The selected blocks, or the block-level element of the target.                   |
| `_canHold(position, …)` | Whether the element can be at a position and hold the items: wrapping, renaming. |
| `_canUnwrap(element)`   | Whether the children of an element can be in its place.                          |
