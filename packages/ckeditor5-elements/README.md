# ckeditor5-elements

Element commands and buttons for CKEditor 5.

| Export              | What it is                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ElementCommand`    | A base command that wraps the selection (or a given position/element) with an element, or unwraps it. Configure `elementName` and `elementAttributes`. |
| `ElementButtonView` | A button that reflects an `ElementCommand` (`isOn`, `isEnabled`, `icon`, `title`, `tooltip`).                                                          |
| `EndOfLine`         | The `#` toolbar component: the following items start on a new line.                                                                                    |
| `Elements`          | An example feature: `ElementsEditing` (the `element` model element and `insertElement`) and `ElementsUI` (the `element` and `insertElement` buttons).  |

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { Elements, EndOfLine } from 'ckeditor5-elements';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';

ClassicEditor.create({
	attachTo: document.querySelector('#editor'),
	licenseKey: 'GPL',
	plugins: [Essentials, Paragraph, Elements, EndOfLine],
	toolbar: {
		items: ['element', 'insertElement', '#', 'undo', 'redo'],
		// Needed for `#`.
		shouldNotGroupWhenFull: true
	}
});
```

Your own toggle command:

```ts
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
