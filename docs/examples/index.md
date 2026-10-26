---
title: 'CKEditor 5 full example: all the features'
description: 'A CKEditor 5 WYSIWYG editor with all the features of CKEditor 5 Elements: context menus, element toolbars, breadcrumbs, quick insert, a JSON element schema and the source of the data.'
outline: false
---

# Full example

An editor with all the features of CKEditor 5 Elements together, on top of CKEditor's common features: headings,
lists, tables, block quotes, a `note` element with a warning type, and the elements of a JSON file (a tip, steps and a
status). The features act on elements, whichever plugin they come from: a heading, a table or a note is an element as
the ones of the file are.

More examples are editors of XML documents: the [DocBook XML editor](./docbook) and the
[DITA XML editor](./dita), WYSIWYG, with the XML of the document below them.

- **Right-click** a block, or press **Shift+F10**: its [menu](../guide/context-menu) toggles a note, inserts, duplicates,
  moves, copies, pastes or deletes it.
- Put the cursor in a **note** or a **heading**: its [floating toolbar](../guide/toolbar) acts on the whole element.
- Click a **breadcrumb** on the second toolbar line: the [menu of that element](../guide/breadcrumbs).
- **Alt+Enter** (Option+Enter on macOS): [quick insert](../guide/quick-insert).
- The tip, the steps and the status come from [`schema.json`](../guide/schema), converted one to one.
- **Click the frame** of a note, the tip or a step, or the status: it is [selected as a whole](../guide/selectable). At the
  end of a block, the arrow keys select the next element; Esc in a note selects the note.
- **Click an image**, the medium or the linked image: a modal with [its attributes](../guide/clickable).
- **Source** shows the data: the elements, with their attributes, as they are saved.
- **Alt+F10** focuses the toolbars; **Alt+0** lists all the keystrokes.

<EditorDemo name="example" />

## Source

The example is the [`ckeditor5-elements-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-example)
package. It imports everything from `ckeditor5` and `ckeditor5-elements`, as an app would. To run it as a page of its
own:

```sh
git clone https://github.com/ivankild/ckeditor5-elements.git
cd ckeditor5-elements
pnpm install
pnpm example
```

::: details `config.ts`: the editor config
<<< ../../packages/ckeditor5-elements-example/src/config.ts
:::

::: details `schema.json`: the elements of the element schema
<<< ../../packages/ckeditor5-elements-example/src/schema.json
:::

::: details `note.ts`: the `note` element
<<< ../../packages/ckeditor5-elements-example/src/note.ts
:::

::: details `main.ts`: creating the editor
<<< ../../packages/ckeditor5-elements-example/src/main.ts
:::
