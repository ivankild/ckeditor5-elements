---
title: 'DocBook XML WYSIWYG editor, built with CKEditor 5'
description: 'A WYSIWYG DocBook XML editor built with CKEditor 5: edit a Simplified DocBook article visually, and save it as DocBook XML, element for element. A live demo of CKEditor 5 customization, with its full source.'
head:
    - - meta
      - name: keywords
        content: 'DocBook XML editor, WYSIWYG DocBook editor, DocBook XML, Simplified DocBook, DocBook editor online, CKEditor 5 DocBook, CKEditor 5 XML editor, CKEditor 5 customization, WYSIWYG XML editor'
    - - script
      - type: application/ld+json
      - '{"@context": "https://schema.org", "@type": "TechArticle", "headline": "DocBook XML WYSIWYG editor built with CKEditor 5", "description": "A WYSIWYG DocBook XML editor built with CKEditor 5: edit a Simplified DocBook article visually, and save it as DocBook XML, element for element. A live demo of CKEditor 5 customization, with its full source.", "about": ["DocBook XML", "Simplified DocBook", "CKEditor 5", "WYSIWYG XML editor"], "keywords": "DocBook XML editor, WYSIWYG DocBook editor, DocBook XML, Simplified DocBook, DocBook editor online, CKEditor 5 DocBook, CKEditor 5 XML editor, CKEditor 5 customization, WYSIWYG XML editor", "url": "https://ivankild.github.io/ckeditor5-elements/examples/docbook", "isPartOf": {"@type": "WebSite", "name": "CKEditor 5 Elements", "url": "https://ivankild.github.io/ckeditor5-elements/"}}'
---

# DocBook XML WYSIWYG editor

A **WYSIWYG DocBook XML editor**, made by customizing CKEditor 5 with CKEditor 5 Elements. It edits a Simplified DocBook
article visually, and the data of the editor is the **DocBook XML** of the article: `editor.getData()` returns it, and
`editor.setData()` loads one. The content is its **elements**, each by its DocBook name: a `section` holds its `title`,
its `para`s, its lists and its sections, and an `emphasis` is an element in a line of text.

The XML below the editor is its data, as it changes: edit the article and see it follow, or press **Source** to edit the
XML itself.

<EditorDemo name="docbook" />

- **Right-click** an element, or press **Shift+F10**: its [menu](../guide/context-menu), to insert, move, copy or delete
  it. The **breadcrumbs** show the path of the DocBook elements at the cursor, e.g. `section › itemizedlist › listitem ›
para`, and open the same menu.
- **Alt+Enter**: [quick insert](../guide/quick-insert), the elements that DocBook allows at the cursor: a list item in a
  list, a title in a section.
- **Title**, **Section**, the two lists, **Block quote**, **Program listing**, **Emphasis** and **Literal** are the
  [commands of the elements](../guide/schema-commands), by their kind.
- **Enter** in a list item makes the next item, and leaves the list in an empty one. In a program listing, it inserts a
  new line, and leaves it on an empty last line.
- A section or a list item has a [floating toolbar](../guide/toolbar), to move, duplicate or delete it.
- Click a link: a modal with [its attributes](../guide/attributes), the `url`.

Run it as a page of its own, with the XML below the editor: `pnpm example:docbook`.

## Why CKEditor 5 Elements for DocBook XML

- **The editor is element first, as DocBook is.** Each DocBook element is an element of the editor, with its name and its
  attributes; formatting, such as `emphasis`, is an element too, not a mark on the text. What you edit is the tree of
  the article.
- **The XML round-trips.** The article is saved as it is loaded, element for element: no HTML in between, no fillers,
  and the attributes as they are.
- **The DocBook elements are a JSON file.** The [element schema](../guide/schema) declares what each one holds and where
  it goes, and the editor rejects a contradictory one. The lists and the program listings work as DocBook's do.
- **It is CKEditor 5.** Its undo, its clipboard and its source view work as usual, with the
  [element features](../guide/getting-started): menus, toolbars and breadcrumbs of the elements.

## How it is made

The example is the
[`ckeditor5-elements-docbook-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-docbook-example)
package. It is CKEditor 5 Elements as it is, with the parts below. Its XML is the one of
[`ckeditor5-elements-xml-example`](https://github.com/ivankild/ckeditor5-elements/tree/main/packages/ckeditor5-elements-xml-example),
which the [DITA example](./dita) uses too.

### The elements: an element schema

Each DocBook element is an element of the [element schema](../guide/schema), with its DocBook name. The `para` is
CKEditor's paragraph, so typing, Enter and an empty editor work as usual.

::: details `schema.json`
<<< ../../packages/ckeditor5-elements-docbook-example/src/schema.json
:::

- A `section`, a list item and a block quote are `container`s: they hold blocks. A `title`, a `programlisting` and the
  paragraph are `block`s: they hold text. `emphasis`, `literal` and `ulink` are inline `block`s: elements in a line of
  text, which hold text.
- The `itemizedlist` and the `orderedlist` are [lists](../guide/schema#lists) of `listitem`s (`listItem`): they hold only
  list items, which are only in lists, and Enter makes the next item. Their commands make lists of the blocks.
- The `programlisting` is [verbatim](../guide/schema#verbatim-blocks): it keeps its whitespace, and Enter inserts a new
  line in it.
- `allowIn` keeps a `title` in the article and in sections.
- `editingTag` makes the editing view HTML that the browser edits well: `ul` and `li` for the lists, `em`, `code` and
  `a` in the text. (A verbatim block is a `pre` already.) It is the editing view only: the data is DocBook.

### The data: XML

`XmlDocumentDataProcessor` is the data processor of the editor: it turns the XML of the article into the view, and the
view back into XML.

::: details `xmlDocumentDataProcessor.ts`
<<< ../../packages/ckeditor5-elements-xml-example/src/xmlDocumentDataProcessor.ts
:::

- It reads the XML with the browser's XML parser, so data that is not well-formed is rejected, with the error of the
  parser; so is a document whose root is not an `article`. The content of the editor is the content of the `article`,
  and the attributes of the `article` are kept.
- It writes the XML from the view, element for element: each element with its name and its attributes, the
  block-level ones on lines of their own, indented, the text escaped, and an empty element as `<para/>`. It writes no
  fillers: HTML needs them for empty blocks, XML does not have them.
- The whitespace between the block-level elements is the indentation, not text. In the verbatim blocks of the schema,
  from `getVerbatimElements()`, it is kept.
- As for any CKEditor data, `getData()` is empty for an empty editor; `getData({ trim: 'none' })` is an article with an
  empty paragraph.

### The converters: DocBook names in the data

The `XmlDocument` plugin sets the data processor, and declares the converters of the data: each element of the schema
is the element of its name in the data, over the [converters of the schema](../guide/schema-converters), and its
attributes keep their names (`<ulink url="…">`). The editing view stays the one of the converters of the schema. It is
configured by the `xmlDocument` option of the editor: the root element, the prolog, and the name of the paragraph.

```ts
xmlDocument: { root: 'article', prolog: DOCBOOK_PROLOG, paragraph: 'para', className: 'docbook' }
```

::: details `xmlDocument.ts`
<<< ../../packages/ckeditor5-elements-xml-example/src/xmlDocument.ts
:::

The [breadcrumbs](../guide/breadcrumbs) show the path of the data, so they show the DocBook names. A soft break
(Shift+Enter) in a paragraph is a new line in the data: DocBook has no element for it.

The rest is the element schema's: the lists and the program listing work as their keys say, with no code of the
example.

### The editor

::: details `config.ts`
<<< ../../packages/ckeditor5-elements-docbook-example/src/config.ts
:::

::: details `article.xml`
<<< ../../packages/ckeditor5-elements-docbook-example/src/article.xml
:::

## What it does not do

- **It is a part of Simplified DocBook**: an article of sections, titles, paragraphs, lists, block quotes, program
  listings, emphasis, literals and links. Tables, figures, `articleinfo` and the other elements are not declared, so the
  editor does not keep them.
- **The schema says where an element goes, not in which order or how many times.** The editor does not require the
  `title` of a section to be its first child: a section made with the **Section** button has no title until you add
  one.
- **The address of a link is edited in the source.** The editor shows it, and keeps it.
- **Comments and processing instructions are not kept**, and whitespace outside a program listing is not either, as
  in most XML.
