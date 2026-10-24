# Schema examples

More schemas, from small to large. Each live example is a JSON file as it is, and the editor shows what the
[schema](./schema) allows: right-click an element, then **Insert › Insert after**, and compare the lists at different
positions. The **breadcrumbs** above the editor show the path to the element with the cursor, so you can see what holds
what. The editors use the [converters](./schema-converters) of the plugin, and CSS for the layout.

## A table: parents that restrict their children

A table is a container of rows, a row is a container of cells. `allowIn` **replaces** the default places, so a row exists
only in a table, and a cell only in a row: the same as CKEditor's own table.

<EditorDemo name="schemaTable" />

::: details The editor
<<< @/demos/schemaTable.ts
:::

::: details `dataTable.json`
<<< @/demos/shared/dataTable.json
:::

The model of the first rows:

```
<dataTable>
  <dataRow><dataHeader>Element</dataHeader><dataHeader>Type</dataHeader></dataRow>
  <dataRow><dataCell>paragraph</dataCell><dataCell>block</dataCell></dataRow>
</dataTable>
```

A cell is a `block`, so it holds text and inline elements, and the `Bold` button works in it. No cell can be outside a
row, and no row outside a table. (A `container` still holds what CKEditor's containers hold, so a table accepts other
blocks too, as a block quote does. `allowIn` restricts where an element goes, not what a container accepts.)

## A gallery: several inline containers in a block

`isInline` is about the layout: an inline container sits in a line with the others. Inline elements are allowed only
in blocks, so the row of figures is a **block**, the `gallery`, which holds several of them. Each figure is a container
that holds a photo and a caption, and is not typable by itself.

<EditorDemo name="schemaGallery" />

::: details The editor
<<< @/demos/schemaGallery.ts
:::

::: details `gallery.json`
<<< @/demos/shared/gallery.json
:::

```
<gallery>
  <figure><photo></photo><caption>Morning</caption></figure>
  <figure><photo></photo><caption>Noon</caption></figure>
</gallery>
```

- `photo` is `empty`: an object that is selected as a whole, with no content. It is block-level, so it is a block object
  in the figure.
- `caption` is a `block` that is allowed only in a figure.
- The figure is allowed only in a gallery. Without `allowIn`, it would be allowed in every block, in a paragraph too.

## Inline elements: a mention and an abbreviation

An `empty` inline element is like an inline image: an object in a line of text. A `block` inline element is like a text
attribute, e.g. bold, but it is an element, so it has attributes of its own.

<EditorDemo name="schemaInline" />

::: details The editor
<<< @/demos/schemaInline.ts
:::

::: details `inlineMarks.json`
<<< @/demos/shared/inlineMarks.json
:::

```
<paragraph>Ask <mention user="ada"></mention> about the <abbr title="Content Management System">CMS</abbr></paragraph>
```

Both are allowed where text is, so in the paragraph, which is the element of another plugin. Insert an abbreviation with
quick insert, and type: the text goes in it, as in any empty inline element with text (see
[Typing in an empty inline element](./schema-converters#typing-in-an-empty-inline-element)).
