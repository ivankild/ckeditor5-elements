# Commands

The packages are built around one kind of command: a command that acts on a **position or an element**.

## `ElementOrPositionCommand`

`ElementOrPositionCommand` (from `ckeditor5-elements-ui`) is the base class. It holds what a button or a menu item needs to
know about the command:

- the observable `title`, `icon` and `tooltip`,
- whether it is enabled, and "on", for **any** target: `getState(target)` returns `{ isEnabled, isOn }` without changing
  the command,
- `executeFor(target)`, which executes the command for that target, even when it is disabled at the selection.

The target is optional everywhere. Without it, the command uses the selection: the selected element, or the first
position of the selection.

A subclass describes when it is enabled and "on" in `_isEnabledFor(target)` and `_isOnFor(target)`, and what it does in
`execute()`:

```ts
import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';

class HighlightCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = 'Highlight';
	}

	public override execute(target?: PositionOrElement): void {
		const element = this._getElement(target);

		if (element) {
			this.editor.model.change(writer => writer.setAttribute('highlighted', true, element));
		}
	}

	protected override _isOnFor(target?: PositionOrElement): boolean {
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

`ElementButtonView` is the same for an `ElementCommand`, and also reflects `isOn`. See the
[clipboard toolbar example](./clipboard#toolbar-buttons).
