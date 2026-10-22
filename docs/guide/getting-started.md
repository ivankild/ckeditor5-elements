# Getting started

CKEditor 5 Elements is a set of CKEditor 5 packages. Install the ones you need next to `ckeditor5`
(version 49 or later):

```sh
npm install ckeditor5 ckeditor5-elements-core ckeditor5-elements ckeditor5-elements-context-menu ckeditor5-elements-clipboard \
	ckeditor5-elements-breadcrumbs ckeditor5-elements-quick-insert
```

| Package                           | What it adds                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `ckeditor5-elements-core`         | [Commands](./commands) that act on an element, their buttons, and the element menu |
| `ckeditor5-elements`              | An example element feature                                                         |
| `ckeditor5-elements-context-menu` | The [element context menu](./context-menu)                                         |
| `ckeditor5-elements-clipboard`    | [Clipboard commands](./clipboard) for elements                                     |
| `ckeditor5-elements-breadcrumbs`  | [Breadcrumbs](./breadcrumbs): the element path at the cursor                       |
| `ckeditor5-elements-quick-insert` | [Quick insert](./quick-insert): search and insert an element allowed at a position |

Each package with a UI has a stylesheet, `<package>/index.css`. The menus (the context menu, the breadcrumbs menu and
quick insert) are styled by `ckeditor5-elements-core/index.css`:

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements-core/index.css';

await ClassicEditor.create({
	attachTo: document.querySelector('#editor'),
	licenseKey: 'GPL',
	plugins: [Essentials, Paragraph, ElementContextMenu, ElementClipboard],
	elementContextMenu: (element, editor) => [editor.commands.get('copyElement'), editor.commands.get('cutElement')]
});
```

All the examples in this guide are live editors, and their source is shown below them. They use a `note` element
(`<aside class="note">`) defined in the docs:

::: details `shared/note.ts`
<<< @/demos/shared/note.ts
:::
