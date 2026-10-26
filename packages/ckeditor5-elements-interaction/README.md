# ckeditor5-elements-interaction

Element interaction for CKEditor 5 Elements, for the elements that match a model name or a filter function, without
CKEditor's widgets:

- `ElementSelectable` selects an element as a whole, by a click or by the arrow keys. It does what widgets do for
  selecting, without changing the view of the element and without the `Widget` plugin.
- `ElementClickable` calls a function, with the model element, when an element is clicked or double-clicked.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

Import the stylesheet of the package (`ckeditor5-elements/index.css` has the styles of all the features).

## Usage

```ts
import { ElementClickable, ElementSelectable } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementSelectable, ElementClickable],
elementSelectable: ['callout', 'divider', element => element.hasAttribute('card')],
elementClickable: [
	// By name. The default event is `click`.
	{ element: 'imageBlock', callback: (element, editor) => console.log(element.getAttribute('src')) },
	// By a filter, on double click.
	{ element: element => element.name.startsWith('heading'), event: 'dblclick', callback: (element, editor) => {} }
]
```

Selecting:

- A click on an element selects it; a container is selected by a click on the element itself, and a click in its text puts
  the cursor there.
- At the end of the text, the right arrow key selects the next selectable element (the left key, at the start, the
  previous one). With an element selected, the arrow keys move the cursor out of it.
- Esc selects the closest selectable element around the cursor.

See the [Selectable elements](https://ivankild.github.io/ckeditor5-elements/guide/selectable) and
[Clickable elements](https://ivankild.github.io/ckeditor5-elements/guide/clickable) guides of the documentation.

## License

MIT
