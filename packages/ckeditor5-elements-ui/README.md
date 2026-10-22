# ckeditor5-elements-ui

The base of the element commands and their buttons for CKEditor 5. The other `ckeditor5-elements-*` packages build on
it.

| Export                        | What it is                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ElementOrPositionCommand`    | The base for commands that act on a position or an element (given, or taken from the selection): observable `title`, `icon` and `tooltip`, `getState(target)`, `executeFor(target)`, and helpers to resolve the target. |
| `ElementCommand`              | An `ElementOrPositionCommand` that wraps the target with an element, or unwraps it. Configure `elementName` and `elementAttributes`.                                                                                    |
| `ElementOrPositionButtonView` | A button that reflects an `ElementOrPositionCommand`. Options: `withText` renders the title; `target` makes it reflect and execute the command for that position or element.                                            |
| `ElementButtonView`           | An `ElementOrPositionButtonView` for an `ElementCommand`, which also reflects `isOn`.                                                                                                                                   |

A toggle command and its toolbar button:

```ts
import { type Editor } from 'ckeditor5';
import { ElementButtonView, ElementCommand } from 'ckeditor5-elements-ui';

class CalloutCommand extends ElementCommand {
	constructor(editor: Editor) {
		super(editor);

		this.elementName = 'callout';
		this.set({ title: 'Callout', icon: calloutIcon });
	}
}

const command = new CalloutCommand(editor);

editor.commands.add('callout', command);
editor.ui.componentFactory.add('callout', locale => new ElementButtonView(locale, command));
```

The package has no plugins and no styles.
