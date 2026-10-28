---
title: 'CKEditor 5 element commands and buttons'
description: 'Write CKEditor 5 commands that act on an element: ElementOrPositionCommand and the commands of one element (inline, block, container, list, inserted) know their title, icon and state for any element, for toolbars and menus.'
---

# Commands

In CKEditor 5 Elements, every feature acts on an element, so the features are built around one kind of command: a
command that acts on an **element**, or on a **position**, where an element is or goes.

## `ElementOrPositionCommand`

`ElementOrPositionCommand` is the base class. It holds what a button or a menu item needs to know about the command:

- the observable `title`, `icon` and `tooltip`,
- whether it is enabled, and "on", for **any** target: `getState(target)` returns `{ isEnabled, isOn }` without changing
  the command,
- `executeFor(target)`, which executes the command for that target, even when it is disabled at the selection.
  `editor.execute(name, target)` checks both: the command runs when it is enabled at the selection and for the target.

The target is optional everywhere. Without it, the command uses the selection: the selected element, or the first
position of the selection. A target that is not in the document (e.g. a removed element) is ignored, so the command is
disabled for it and does nothing.

A subclass describes when it is enabled and "on" in `_isEnabledFor(target)` and `_isOnFor(target)`, and what it does in
`execute()`. When both come from the same work, e.g. the selected blocks, it overrides `_getStateFor(target)` instead,
which returns `{ isEnabled, isOn }` at once. `execute()` runs only when the command is enabled for its target, so it
does not check it again:

```ts
import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements';

class HighlightCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = 'Highlight';
		// It can be "on", so its buttons tell screen readers whether it is.
		this.isToggleable = true;
	}

	public override execute(target?: ElementOrPosition): void {
		const element = this._getElement(target);

		if (element) {
			this.editor.model.change(writer => writer.setAttribute('highlighted', true, element));
		}
	}

	protected override _isOnFor(target?: ElementOrPosition): boolean {
		return !!this._getElement(target)?.getAttribute('highlighted');
	}
}
```

The clipboard commands, the quick insert commands and the commands of one element are all `ElementOrPositionCommand`s,
so they can all be [context menu](./context-menu) items.

## Commands of one element

A command of one element is an `ElementCommand`: it is for the element of its `elementName`, given to its constructor,
and it is "on" (`isOn`) when the target is in it. There is a command for each kind of element, which works as the
CKEditor feature of that kind:

| Command                   | For an element that                  | Works as CKEditor's | Does                                     |
| ------------------------- | ------------------------------------ | ------------------- | ---------------------------------------- |
| `ElementInlineCommand`    | is in a line of text, and holds text | bold                | wraps the selected text, or unwraps it   |
| `ElementBlockCommand`     | holds text                           | heading             | renames the blocks, or renames them back |
| `ElementContainerCommand` | holds blocks                         | block quote         | wraps the blocks, or unwraps them        |
| `ElementListCommand`      | holds items, which hold blocks       | lists               | wraps each block in an item, in a list   |
| `ElementInsertCommand`    | is inserted, e.g. empty              | horizontal line     | inserts the element, and selects it      |

```ts
import { ElementContainerCommand, ElementListCommand } from 'ckeditor5-elements';

editor.commands.add('callout', new ElementContainerCommand(editor, 'callout'));

// A list of `item`s, which turns a `numbers` list into its own.
editor.commands.add('bullets', new ElementListCommand(editor, 'bullets', 'item', ['numbers']));
```

`elementAttributes` makes a command for one kind of an element: it is for the elements with those attributes, and the
new elements get them. The `note` and `warning` buttons below are two `ElementContainerCommand`s of the `note` element,
the second with `{ type: 'warning' }`; `ElementButtonView` shows them in the toolbar:

<EditorDemo name="commandsToggle" />

::: details Source
<<< @/demos/commandsToggle.ts
:::

::: details `note.ts`
<<< ../../packages/ckeditor5-elements-example/src/note.ts
:::

The [element schema](./schema) gives every element its command of its kind, with its button: see
[Commands and buttons](./schema-commands).

### A command of your own

A command of your own for an element can extend `ElementCommand`, and describe what it does: the base finds the
element, the blocks and the selected content of the target, and checks the schema.

```ts
import { ElementCommand, type ElementOrPosition } from 'ckeditor5-elements';

// Removes the callout that the target is in.
class RemoveCalloutCommand extends ElementCommand {
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

| Member                           | Is                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `elementName`, `isOn`            | The element of the command, and whether the target is in it (from `_isOnFor()`).      |
| `elementAttributes`              | The attributes of the element of the command, which the new elements get.             |
| `isElement(node)`                | Whether a node is the element, with the attributes.                                   |
| `_createElement(writer)`         | A new element, with the attributes.                                                   |
| `_findElement(target)`           | The closest element that the target is, or is in.                                     |
| `_getAncestors(target)`          | The elements the target is, or is in, the inner first.                                |
| `_getSelectedRanges()`           | The selected ranges, when the selection is content, not a cursor nor an element.      |
| `_getBlocks(target)`             | The selected blocks, or the block-level element of the target.                        |
| `_canHold(position, …)`          | Whether the element can be at a position and hold the items: wrapping, renaming.      |
| `_canUnwrap(element)`            | Whether the children of an element can be in its place.                               |
| `_keepSelection(writer, change)` | Makes a change, and selects the same content then, which moved in or out of elements. |

## Buttons

`ElementOrPositionButtonView` reflects any `ElementOrPositionCommand`:

```ts
// In a toolbar: the icon, with the title as the tooltip; follows the selection.
new ElementOrPositionButtonView(locale, command);

// With the title as text.
new ElementOrPositionButtonView(locale, command, { withText: true });

// For a given element: reflects and executes the command for it (this is what the context menu does).
new ElementOrPositionButtonView(locale, command, { withText: true, target: element });
```

`ElementButtonView` is the same for an `ElementCommand` of any kind, and also reflects `isOn`. For a command with
`isToggleable` (the commands that toggle an element have it), the buttons tell screen readers whether the command is "on": toolbar buttons with
`aria-pressed`, menu items with `aria-checked`. See the
[clipboard toolbar example](./clipboard#toolbar-buttons).

When a command returns a rejected promise (e.g. the clipboard commands, when the browser does not allow using the
clipboard), the button shows a warning with the `Notification` plugin, titled `Could not complete "<title>".`

`forceDisabled(id)` disables a command for every target, so its buttons and menu items are disabled too, until
`clearForceDisabled(id)` is called for every id. The observable `isForceDisabled` tells whether it is.
