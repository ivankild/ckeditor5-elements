# ckeditor5-elements

Element-level features for CKEditor 5 v49 or later, in one package:

| Feature              | Exports                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Commands and buttons | `ElementOrPositionCommand`, `ElementCommand`, `ElementOrPositionButtonView`, `ElementButtonView`           |
| Element menu         | `ElementMenu` (the plugin that shows the menus below), `ElementMenuView`                                   |
| Context menu         | `ElementContextMenu`: a menu of commands for the right-clicked element (or Shift+F10)                      |
| Clipboard            | `ElementClipboard`: `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore`, `pasteElementAfter` |
| Actions              | `ElementActions`: `moveElementUp`, `moveElementDown`, `duplicateElement`, `deleteElement`                  |
| Element toolbar      | `ElementToolbar`: floating toolbars for the elements that match a name or a filter                         |
| Quick insert         | `QuickInsert`: Alt+Enter opens a searchable list of the elements allowed at the cursor                     |
| Breadcrumbs          | `Breadcrumbs`: the element path at the cursor, as labels or buttons that open the element menu             |

## Installation

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

Import the features from `ckeditor5-elements`, and its stylesheet, which styles all of them:

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { Breadcrumbs, ElementClipboard, ElementContextMenu, QuickInsert } from 'ckeditor5-elements';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';

const menu = (element, editor) => [
	{
		title: 'Insert',
		items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
	},
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('cutElement'),
	editor.commands.get('pasteElement')
];

await ClassicEditor.create({
	attachTo: document.querySelector('#editor'),
	licenseKey: 'GPL',
	plugins: [Essentials, Paragraph, ElementContextMenu, ElementClipboard, QuickInsert, Breadcrumbs],
	toolbar: ['undo', 'redo', '|', 'breadcrumbs'],
	elementContextMenu: menu,
	breadcrumbs: { menu }
});
```

Load only the plugins you use: the others are not part of your build.

The features come in packages of their own (`ckeditor5-elements-core`, `-clipboard`, `-actions`, `-toolbar`, `-context-menu`,
`-quick-insert`, `-breadcrumbs`), in the same version as this package, which installs them. Do not install or import them yourself: two
versions of them would be loaded, which fails.

## Documentation

[CKEditor 5 Elements documentation](https://ivankild.github.io/ckeditor5-elements/): guides with live examples, and the API reference.

The [full example](https://ivankild.github.io/ckeditor5-elements/example) shows all the features together in one editor.

## License

MIT
