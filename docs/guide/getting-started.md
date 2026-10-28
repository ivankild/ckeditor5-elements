---
title: 'Getting started: install and customize CKEditor 5'
description: 'Install CKEditor 5 Elements next to CKEditor 5, and customize the WYSIWYG editor with element-first features: commands, menus, toolbars and an element schema.'
---

# Getting started

CKEditor 5 Elements is **element first**: the content is a tree of named elements, each with its attributes, and every
feature acts on an element.

- **The content is elements.** Blocks, containers, objects and inline elements, formatting included: a bold is an
  element, as a paragraph is. Each one has a name, attributes of its own, and the place in the tree that the
  [element schema](./schema) gives it.
- **The features act on elements.** A [command](./commands) is for an element; a [menu](./context-menu) is the menu of
  an element; the [clipboard](./clipboard) copies whole elements; the [breadcrumbs](./breadcrumbs) show the path of
  elements at the cursor; an element is [selected](./selectable) as a whole; [quick insert](./quick-insert) inserts the
  elements allowed at a place.
- **The data is the model, element for element.** The [converters of the schema](./schema-converters) write each
  element with its name and its attributes, and read the same data back.

It is one package, `ckeditor5-elements`. Install it next to `ckeditor5`:

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

| Feature                              | What it adds                                                             | Package                          |
| ------------------------------------ | ------------------------------------------------------------------------ | -------------------------------- |
| [Commands](./commands)               | Commands that act on an element, and their buttons                       | `ckeditor5-elements-core`        |
| [Actions](./actions)                 | `ElementActions`: move an element up or down, duplicate or delete it     | `ckeditor5-elements-actions`     |
| [Clipboard](./clipboard)             | `ElementClipboard`: copy, cut and paste whole elements                   | `ckeditor5-elements-actions`     |
| [Attributes](./attributes)           | `ElementAttributes`: show the attributes of an element in a modal        | `ckeditor5-elements-attributes`  |
| [Context menu](./context-menu)       | `ElementContextMenu`: a menu of commands for the right-clicked element   | `ckeditor5-elements-menu`        |
| [Breadcrumbs](./breadcrumbs)         | `ElementBreadcrumbs`: the element path at the cursor                     | `ckeditor5-elements-menu`        |
| [Quick insert](./quick-insert)       | `ElementQuickInsert`: search and insert an element allowed at a position | `ckeditor5-elements-menu`        |
| [Selectable elements](./selectable)  | `ElementSelectable`: select an element as a whole, by a click or keys    | `ckeditor5-elements-interaction` |
| [Clickable elements](./clickable)    | `ElementClickable`: a callback when an element is clicked                | `ckeditor5-elements-interaction` |
| [Element toolbar](./toolbar)         | `ElementToolbar`: floating toolbars for elements, by name or filter      | `ckeditor5-elements-toolbar`     |
| [Element schema](./schema)           | `ElementSchema`: declare the elements of the model from a JSON file      | `ckeditor5-elements-schema`      |
| [Schema commands](./schema-commands) | `ElementSchemaCommands`: commands and buttons for them                   | `ckeditor5-elements-schema`      |

Load only the plugins you use: the others are not part of your build.

::: tip One package
Like `ckeditor5`, `ckeditor5-elements` brings its features in packages of its own, in the same version: the packages in
the table above, which say where a feature is. Do not install or import them yourself: two versions of them would be
loaded, which fails. The menus of the context menu, the breadcrumbs and quick insert are shown by one plugin,
`ElementMenu`, which each of them loads.
:::

::: tip See it all at work
The [full example](../examples/) is an editor with all the features together, and the
[DocBook XML](../examples/docbook) and [DITA XML](../examples/dita) editors are WYSIWYG editors of XML documents. Its source is in the
[`ckeditor5-elements-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-example)
package; run it with `pnpm example`.
:::

All the examples in this guide are live editors, and their source is shown below them. Each one has a **Source** button
(CKEditor's `SourceEditing`): it shows the data of the editor, the elements with their attributes as they are saved, and
loads it back when you edit it. They use the `note` element (`<aside class="note">`) of the full example:

::: details `note.ts`
<<< ../../packages/ckeditor5-elements-example/src/note.ts
:::
