# Getting started

CKEditor 5 Elements is one package, `ckeditor5-elements`. Install it next to `ckeditor5` (version 49 or later):

```sh
npm install ckeditor5 ckeditor5-elements
```

Import the features from `ckeditor5-elements`, and its stylesheet, `ckeditor5-elements/index.css`, which styles all of
them:

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { ElementClipboard, ElementContextMenu } from 'ckeditor5-elements';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';

await ClassicEditor.create({
	attachTo: document.querySelector('#editor'),
	licenseKey: 'GPL',
	plugins: [Essentials, Paragraph, ElementContextMenu, ElementClipboard],
	elementContextMenu: (element, editor) => [editor.commands.get('copyElement'), editor.commands.get('cutElement')]
});
```

| Feature                        | What it adds                                                           |
| ------------------------------ | ---------------------------------------------------------------------- |
| [Commands](./commands)         | Commands that act on an element, their buttons, and the element menu   |
| [Context menu](./context-menu) | `ElementContextMenu`: a menu of commands for the right-clicked element |
| [Clipboard](./clipboard)       | `ElementClipboard`: copy, cut and paste whole elements                 |
| [Actions](./actions)           | `ElementActions`: move an element up or down, duplicate or delete it   |
| [Element toolbar](./toolbar)   | `ElementToolbar`: floating toolbars for elements, by name or filter    |
| [Quick insert](./quick-insert) | `QuickInsert`: search and insert an element allowed at a position      |
| [Breadcrumbs](./breadcrumbs)   | `Breadcrumbs`: the element path at the cursor                          |

Load only the plugins you use: the others are not part of your build.

::: tip One package
Like `ckeditor5`, `ckeditor5-elements` brings its features in packages of its own, in the same version. Do not install
or import them yourself: two versions of them would be loaded, which fails.
:::

All the examples in this guide are live editors, and their source is shown below them. They use a `note` element
(`<aside class="note">`) defined in the docs:

::: details `shared/note.ts`
<<< @/demos/shared/note.ts
:::
