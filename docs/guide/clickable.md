---
title: 'Clickable elements in CKEditor 5'
description: 'Call a function with the model element when an element of CKEditor 5 content is clicked or double-clicked, for the elements that match a name or a filter.'
---

# Clickable elements

`ElementClickable` calls a function when an element is clicked or double-clicked, with the **model element**. The
elements are matched by the name of the model element, or by a filter function. The definitions are the
`elementClickable` editor option:

```ts
import { ElementClickable } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementClickable],
elementClickable: [
	// By name. The default event is `click`.
	{ element: 'imageBlock', callback: (element, editor) => console.log(element.getAttribute('src')) },
	// By a filter: `(element: ModelElement) => boolean`. Here, on double click.
	{ element: element => element.name.startsWith('heading'), event: 'dblclick', callback: edit }
];
```

The callback gets the model element, the editor, and the DOM `MouseEvent`.

<EditorDemo name="clickableBasic" />

::: details Source
<<< @/demos/clickableBasic.ts
:::

The demo shows the attributes of the element in CKEditor's modal dialog. The callback runs the command of
[`ElementAttributes`](./attributes) for the element that was clicked:

```ts
const showAttributes = (element, editor) => {
	editor.commands.get('showElementAttributes').executeFor(element);
};
```

## Which element is called

The click is matched against the element that was clicked and its ancestors, the innermost first. The first element that
matches a definition for that event calls its callback, and nothing more is called:

- Clicking an image inside a note calls the definition of the image, not the note's one.
- When two definitions match the same element, the first one in the config wins.
- A click and a double click are separate: a definition for `dblclick` is not called by a single click. (A double click
  is two clicks and a double click, so a `click` definition for the same element is called twice too.)

The filter is a function of the model element, so it can look at its attributes: `element => element.hasAttribute('linkHref')`
matches linked images.

## What it is not

- The click still does what it does in the editor, e.g. selects an image or moves the cursor: the plugin reports it, and
  does not prevent it. It works in read-only mode too.
- Only **model elements** can be matched. A link in text is an attribute of the text (`linkHref`), not an element, so a
  click on it gives the paragraph. A linked image is an element with a `linkHref` attribute, so it can be matched.
