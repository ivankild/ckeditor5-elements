# ckeditor5-elements-core

The base of CKEditor 5 Elements: commands that act on a position or an element (`ElementOrPositionCommand`,
`ElementCommand`), their buttons (`ElementOrPositionButtonView`, `ElementButtonView`), and the `ElementMenu` plugin, which
shows the menus of the context menu, the breadcrumbs and quick insert.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementButtonView, ElementCommand } from 'ckeditor5-elements';

class CalloutCommand extends ElementCommand {
	constructor(editor) {
		super(editor);

		this.elementName = 'callout';
		this.set({ title: 'Callout', icon: calloutIcon });
	}
}

editor.commands.add('callout', new CalloutCommand(editor));
editor.ui.componentFactory.add('callout', locale => new ElementButtonView(locale, editor.commands.get('callout')));
```

See the "Commands" guide of the documentation.

## License

MIT
