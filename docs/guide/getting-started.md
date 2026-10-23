# Getting started

CKEditor 5 Elements is one package, `ckeditor5-elements`. Install it next to `ckeditor5`:

```sh
npm install ckeditor5 ckeditor5-elements
```

The version of `ckeditor5-elements` follows the major version of CKEditor: `49.x` works with `ckeditor5` 49.x (the
peer dependency is `^49.0.0`). A new CKEditor major version needs a new release.

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
| [Attributes](./attributes)     | `ElementAttributes`: show the attributes of an element in a modal      |
| [Element toolbar](./toolbar)   | `ElementToolbar`: floating toolbars for elements, by name or filter    |
| [Clickable](./clickable)       | `ElementClickable`: a callback when an element is clicked              |
| [Quick insert](./quick-insert) | `QuickInsert`: search and insert an element allowed at a position      |
| [Breadcrumbs](./breadcrumbs)   | `Breadcrumbs`: the element path at the cursor                          |

Load only the plugins you use: the others are not part of your build.

::: tip One package
Like `ckeditor5`, `ckeditor5-elements` brings its features in packages of its own, in the same version. Do not install
or import them yourself: two versions of them would be loaded, which fails.
:::

::: tip See it all at work
The [full example](../example) is an editor with all the features together. Its source is in the
[`ckeditor5-elements-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-example)
package; run it with `pnpm example`.
:::

All the examples in this guide are live editors, and their source is shown below them. They use the `note` element
(`<aside class="note">`) of the full example:

::: details `note.ts`
<<< ../../packages/ckeditor5-elements-example/src/note.ts
:::
