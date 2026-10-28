# ckeditor5-elements-core

The base of CKEditor 5 Elements: commands that act on a position or an element (`ElementOrPositionCommand`), the
commands of one element, by its kind (`ElementCommand`, with `ElementInlineCommand`, `ElementBlockCommand`,
`ElementContainerCommand`, `ElementListCommand` and `ElementInsertCommand`), and their buttons
(`ElementOrPositionButtonView`, `ElementButtonView`). The menus of commands are in `ckeditor5-elements-menu`.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementButtonView, ElementContainerCommand } from 'ckeditor5-elements';

// Wraps the selected blocks with a `callout`, or unwraps the one they are in.
const command = new ElementContainerCommand(editor, 'callout');

command.set({ title: 'Callout', icon: calloutIcon });
editor.commands.add('callout', command);
editor.ui.componentFactory.add('callout', locale => new ElementButtonView(locale, command));
```

See the [Commands guide](https://ivankild.github.io/ckeditor5-elements/guide/commands) of the documentation.

## License

MIT
