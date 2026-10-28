---
title: 'Select elements as a whole in CKEditor 5, without widgets'
description: 'Select a CKEditor 5 element as a whole, by a click on its frame or by the arrow keys, as widgets are selected, without the Widget plugin and without changing its view.'
---

# Selectable elements

`ElementSelectable` selects an element **as a whole**, by a click or by the arrow keys. It is what CKEditor's widgets do
for selecting, without the widgets: the view of the element is not changed, and the `Widget` plugin is not needed. The
elements are matched by the name of the model element, or by a filter function, as for the other features. They are the
`elementSelectable` editor option:

```ts
import { ElementSelectable } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementSelectable],
elementSelectable: ['callout', 'divider', element => element.hasAttribute('card')]
```

<EditorDemo name="selectableBasic" />

::: details Source
<<< @/demos/selectableBasic.ts
:::

## How an element is selected

The model selection is **on** the element, and the editing view has a [fake selection](https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-ViewSelection.html#member-isFake)
for it, as for a widget. The browser draws nothing on its own, so the element in the view gets the class
`ck-elements-selected`, which the stylesheet of the package draws as a frame. Style it as you like.

- **By a click** on the element. An element with content, like a container, is selected by a click on the element itself
  (its padding, its border), not on its content: a click in its text puts the cursor there, as without the plugin. An
  element with no content, like an image or a divider, is selected by a click anywhere in it.
- **By the left and right arrows.** When the next step of the cursor enters or passes a selectable element (at the end of
  a block, or right before an inline element), the key selects it instead. In the middle of the text, the keys move the
  cursor as always. With an element selected, the arrows move the cursor
  out of it, to the content after it (right, down) or before it (left, up), or select the next selectable element when it
  is just there.
- **By Esc**: the cursor is in an element, and Esc selects the closest selectable element around it. Esc again selects the
  one around that. What else uses Esc goes first (closing a balloon, for example): the plugin handles it only when nothing
  else did.

A selected element is deleted by Backspace or Delete, replaced by typing, and copied or cut, as any selected content.

::: details What the plugin does not do

- The up and down arrows **do not select** from the text: only the browser knows where the lines of the text are. Use the
  left and right arrows, or Esc.
- It does not change the view of the elements, and does not make their content not editable, as a widget does: the
  elements are as the converters make them.
- A filter cannot make the element selectable in the model schema, as a name does (`isSelectable`): the elements it
  matches must be selectable already, e.g. objects. Without it, CKEditor moves a selection that is on the element.

:::

## With the element schema

The [element schema](./schema) uses it when it is loaded (see
[Selected as a whole](./schema-converters#selected-as-a-whole)): the `empty` and the `container` elements of the schema
are selectable, `block` ones are not (a click in a block puts the cursor in its text). The schema does not depend on this
plugin: load it, and the schema finds it. With `elementSchemaConverters`, it warns in the console when the plugin is not
loaded, as the elements could not be selected then.

```ts
plugins: [..., ElementSchema, ElementSelectable],
elementSchema: schema
```

## From code

`add()` makes more elements selectable, as the option does. Features use it when they add elements:

```ts
editor.plugins.get(ElementSelectable).add('callout', element => element.hasAttribute('card'));
```

`isSelectable(element)` returns whether an element is selectable by the plugin.
