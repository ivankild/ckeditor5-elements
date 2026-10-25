# Commands

In CKEditor 5 Elements, every feature acts on an element, so the features are built around one kind of command: a
command that acts on an **element**, or on a **position**, where an element is or goes.

## `ElementOrPositionCommand`

`ElementOrPositionCommand` is the base class. It holds what a button or a menu item needs to know about the command:

- the observable `title`, `icon` and `tooltip`,
- whether it is enabled, and "on", for **any** target: `getState(target)` returns `{ isEnabled, isOn }` without changing
  the command,
- `executeFor(target)`, which executes the command for that target, even when it is disabled at the selection.

The target is optional everywhere. Without it, the command uses the selection: the selected element, or the first
position of the selection. A target that is not in the document (e.g. a removed element) is ignored, so the command is
disabled for it and does nothing.

A subclass describes when it is enabled and "on" in `_isEnabledFor(target)` and `_isOnFor(target)`, and what it does in
`execute()`:

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

The clipboard commands, the quick insert commands and `ElementCommand` are all `ElementOrPositionCommand`s, so they can
all be [context menu](./context-menu) items.

## `ElementCommand`: toggle an element

`ElementCommand` wraps the target with an element, or unwraps the closest matching one. Set `elementName` (and
`elementAttributes` to match only elements with those attributes). It is enabled only when the schema allows the toggle,
and it is "on" inside a matching element.

`ElementButtonView` shows it in the toolbar:

<EditorDemo name="commandsToggle" />

::: details Source
<<< @/demos/commandsToggle.ts
:::

## Commands of the element schema

The [element schema](./schema) gives every element a command of its kind: formatting, blocks, containers, and inserted
elements. `ElementSchemaCommands` makes them from a config, with their buttons. They are `ElementOrPositionCommand`s
too, on a base of their own, `ElementSchemaCommand`. See [Commands and buttons](./schema-commands).

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

`ElementButtonView` is the same for an `ElementCommand`, and also reflects `isOn`. For a command with `isToggleable`
(`ElementCommand` has it), the buttons tell screen readers whether the command is "on": toolbar buttons with
`aria-pressed`, menu items with `aria-checked`. See the
[clipboard toolbar example](./clipboard#toolbar-buttons).

When a command returns a rejected promise (e.g. the clipboard commands, when the browser does not allow using the
clipboard), the button shows a warning with the `Notification` plugin, titled `Could not complete "<title>".`

`forceDisabled(id)` disables a command for every target, so its buttons and menu items are disabled too, until
`clearForceDisabled(id)` is called for every id. The observable `isForceDisabled` tells whether it is.
