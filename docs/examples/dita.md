---
title: 'DITA XML WYSIWYG editor, built with CKEditor 5'
description: 'A WYSIWYG DITA XML editor built with CKEditor 5: edit a Lightweight DITA topic visually, and save it as DITA XML (XDITA), element for element. A live demo of CKEditor 5 customization, with its full source.'
head:
    - - meta
      - name: keywords
        content: 'DITA XML editor, WYSIWYG DITA editor, DITA XML, Lightweight DITA, LwDITA, XDITA, DITA topic editor, CKEditor 5 DITA, CKEditor 5 XML editor, CKEditor 5 customization, WYSIWYG XML editor'
    - - script
      - type: application/ld+json
      - '{"@context": "https://schema.org", "@type": "TechArticle", "headline": "DITA XML WYSIWYG editor built with CKEditor 5", "description": "A WYSIWYG DITA XML editor built with CKEditor 5: edit a Lightweight DITA topic visually, and save it as DITA XML (XDITA), element for element. A live demo of CKEditor 5 customization, with its full source.", "about": ["DITA XML", "Lightweight DITA", "XDITA", "CKEditor 5", "WYSIWYG XML editor"], "keywords": "DITA XML editor, WYSIWYG DITA editor, DITA XML, Lightweight DITA, LwDITA, XDITA, DITA topic editor, CKEditor 5 DITA, CKEditor 5 XML editor, CKEditor 5 customization, WYSIWYG XML editor", "url": "https://ivankild.github.io/ckeditor5-elements/examples/dita", "isPartOf": {"@type": "WebSite", "name": "CKEditor 5 Elements", "url": "https://ivankild.github.io/ckeditor5-elements/"}}'
---

# DITA XML WYSIWYG editor

A **WYSIWYG DITA XML editor**, made by customizing CKEditor 5 with CKEditor 5 Elements. It edits a Lightweight DITA topic
visually, and the data of the editor is the **DITA XML** of the topic, in its XML form, XDITA: `editor.getData()`
returns it, and `editor.setData()` loads one. The content is its **elements**, each by its DITA name: a `topic` has its
`title`, its `shortdesc` and its `body`, whose `section`s hold `p`s, lists and notes, and a `b` is an element in a
line of text.

The XML below the editor is its data, as it changes: edit the topic and see it follow, or press **Source** to edit the
XML itself.

<EditorDemo name="dita" />

- **Right-click** an element, or press **Shift+F10**: its [menu](../guide/context-menu), to insert, move, copy or delete
  it. The **breadcrumbs** show the path of the DITA elements at the cursor, e.g. `body › section › ul › li › p`, and open
  the same menu.
- **Alt+Enter**: [quick insert](../guide/quick-insert), the elements that DITA allows at the cursor: a list item in a
  list, a section in the body.
- **Enter** in a list item makes the next item, and leaves the list in an empty one. In a `pre`, it inserts a new line,
  and leaves it on an empty last line.
- **Title**, **Short description**, **Section**, the two lists, **Note**, **Preformatted text**, **Bold**, **Italic**
  and **Underline** are the [commands of the elements](../guide/schema-commands), by their kind.
- A section or a list item has a [floating toolbar](../guide/toolbar), to move, duplicate or delete it.
- Click a cross-reference: a modal with [its attributes](../guide/attributes), the `href`.

Run it as a page of its own, with the XML below the editor: `pnpm example:dita`.

## Why CKEditor 5 Elements for DITA XML

- **The editor is element first, as DITA is.** Each DITA element is an element of the editor, with its name and its
  attributes; `b`, `i` and `ph` are elements too, not marks on the text. What you edit is the tree of the topic.
- **The XML round-trips.** The topic is saved as it is loaded, element for element, with its `id`: no HTML in between,
  no fillers.
- **The DITA elements are a JSON file.** The [element schema](../guide/schema) declares what each one holds and where it
  goes: sections in the body, list items only in lists, `pre` keeping its whitespace.
- **It is CKEditor 5.** Its undo, its clipboard and its source view work as usual, with the
  [element features](../guide/getting-started): menus, toolbars and breadcrumbs of the elements.

## How it is made

The example is the
[`ckeditor5-elements-dita-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-dita-example)
package: an element schema, the config of the editor, and the topic. Everything else is CKEditor 5 Elements as it is, and
the XML of the [DocBook example](./docbook#the-data-xml), which this one shares.

### The elements: an element schema

Each DITA element is an element of the [element schema](../guide/schema), with its DITA name. The `p` is CKEditor's
paragraph, so typing, Enter and an empty editor work as usual.

::: details `schema.json`
<<< ../../packages/ckeditor5-elements-dita-example/src/schema.json
:::

- The `body`, a `section`, a list item and a `note` are `container`s: they hold blocks. A `title`, a `shortdesc`, a
  `pre` and the paragraph are `block`s: they hold text. `b`, `i`, `u`, `ph` and `xref` are inline `block`s: elements in
  a line of text, which hold text.
- `ul` and `ol` are [lists](../guide/schema#lists) of `li`s (`listItem`): they hold only list items, which are only in
  lists, and Enter makes the next item. Their commands make lists of the blocks, and switch one into the other.
- `pre` is [verbatim](../guide/schema#verbatim-blocks): it keeps its whitespace, in the data too, and Enter inserts a
  new line in it.
- `allowIn` keeps the parts of the topic where DITA has them: the `title` in the topic and in sections, the `shortdesc`
  and the `body` in the topic, the sections in the body, and the lists, the notes and `pre` in the body, sections,
  list items and notes.
- `editingTag` makes the editing view HTML that the browser edits well: `ul` and `li` for the lists, `aside` for a
  note, `a` for a cross-reference. It is the editing view only: the data is DITA.

### The data: XML

The data is the [XML of the DocBook example](./docbook#the-data-xml), configured for a topic: its root element is the
`topic`, the paragraph is `p`, and the prolog has the document type of a Lightweight DITA topic. The converters of the
schema write the DITA names (`'names'`). The attributes of the topic are kept, e.g. its `id`, which DITA requires.

```ts
elementSchemaConverters: 'names',
xmlDocument: { root: 'topic', prolog: DITA_PROLOG, paragraph: 'p', className: 'dita' }
```

### The editor

::: details `config.ts`
<<< ../../packages/ckeditor5-elements-dita-example/src/config.ts
:::

::: details `topic.xml`
<<< ../../packages/ckeditor5-elements-dita-example/src/topic.xml
:::

## What it does not do

- **It is a part of Lightweight DITA**: a topic with a title, a short description and a body of sections, paragraphs,
  lists, notes, preformatted text, highlighting, phrases and cross-references. Maps, figures, images, tables,
  definition lists and the other elements are not declared, so the editor does not keep them.
- **The schema says where an element goes, not in which order or how many times.** The editor does not require the
  `title` to be the first child of the topic, or a topic to have one `body`; a paragraph of CKEditor can be out of the
  body, as the paragraph is not an element of the schema.
- **The target of a cross-reference is edited in the source.** The editor shows it, and keeps it.
- **Comments and processing instructions are not kept**, and whitespace outside a `pre` is not either, as in most XML.
