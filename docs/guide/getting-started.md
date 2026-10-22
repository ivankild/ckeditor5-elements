# Getting started

CKEditor 5 Elements is a set of CKEditor 5 packages. Install the ones you need next to `ckeditor5`
(version 46 or later):

```sh
npm install ckeditor5 ckeditor5-elements-ui ckeditor5-elements ckeditor5-elements-context-menu ckeditor5-elements-clipboard \
	ckeditor5-elements-breadcrumbs ckeditor5-elements-quick-insert
```

| Package                           | What it adds                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ckeditor5-elements-ui`           | [Commands](./commands) that act on an element, their buttons, the [`#` toolbar line break](./toolbar) |
| `ckeditor5-elements`              | An example element feature                                                                            |
| `ckeditor5-elements-context-menu` | The [element context menu](./context-menu)                                                            |
| `ckeditor5-elements-clipboard`    | [Clipboard commands](./clipboard) for elements                                                        |
| `ckeditor5-elements-breadcrumbs`  | [Breadcrumbs](./breadcrumbs): the element path at the cursor                                          |
| `ckeditor5-elements-quick-insert` | Quick insert: Alt+Enter (Option+Enter on macOS) inserts an element allowed at the cursor              |

Each package with a UI has a stylesheet, `<package>/index.css`:

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { ElementClipboard } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements-context-menu/index.css';

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
