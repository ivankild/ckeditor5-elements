# ckeditor5-elements-core

The base of the element commands, their buttons and the element menu for CKEditor 5. The other `ckeditor5-elements-*`
packages build on it. Requires CKEditor 5 v49 or later.

| Export                                                | What it is                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ElementOrPositionCommand`                            | The base for commands that act on a position or an element (given, or taken from the selection): observable `title`, `icon` and `tooltip`, `getState(target)`, `executeFor(target)`, `isForceDisabled`, and helpers to resolve the target. |
| `ElementCommand`                                      | An `ElementOrPositionCommand` that wraps the target with an element, or unwraps it. Configure `elementName` and `elementAttributes`.                                                                                                       |
| `ElementOrPositionButtonView`                         | A button that reflects an `ElementOrPositionCommand`. Options: `withText` renders the title; `target` makes it reflect and execute the command for that position or element.                                                               |
| `ElementButtonView`                                   | An `ElementOrPositionButtonView` for an `ElementCommand`, which also reflects `isOn`.                                                                                                                                                      |
| `ElementMenu`                                         | A plugin that shows menus in a balloon: `open(element, target, config)` for the menu of an element (the `ElementMenuConfig` items: commands, submenus and `'\|'` separators), `show(views, target)` for any views.                         |
| `ElementMenuView`, `SubmenuView`, `MenuSeparatorView` | The views of the menu.                                                                                                                                                                                                                     |
| `isInDocument()`                                      | Whether a model element or position is in the document, i.e. not removed.                                                                                                                                                                  |

A toggle command and its toolbar button:

```ts
import { type Editor } from 'ckeditor5';
import { ElementButtonView, ElementCommand } from 'ckeditor5-elements-core';

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

Buttons report failed (rejected) commands with a warning of the `Notification` plugin.

The menu styles are in `ckeditor5-elements-core/index.css`. The context menu, the breadcrumbs menu and quick insert
need them:

```ts
import 'ckeditor5-elements-core/index.css';
```
