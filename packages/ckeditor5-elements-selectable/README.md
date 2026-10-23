# ckeditor5-elements-selectable

Selectable elements for CKEditor 5 Elements: `ElementSelectable` selects an element as a whole by a click or by the
arrow keys, for the elements that match a model name or a filter function. It does what widgets do for selecting, without
changing the view of the element and without the `Widget` plugin.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

Import the stylesheet of the package (`ckeditor5-elements/index.css` has the styles of all the features).

## Usage

```ts
import { ElementSelectable } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementSelectable],
selectableElements: ['callout', 'divider', element => element.hasAttribute('card')]
```

- A click on an element selects it; a container is selected by a click on the element itself, and a click in its text puts
  the cursor there.
- At the end of the text, the right arrow key selects the next selectable element (the left key, at the start, the
  previous one). With an element selected, the arrow keys move the cursor out of it.
- Esc selects the closest selectable element around the cursor.

See the [Selectable elements guide](https://ivankild.github.io/ckeditor5-elements/guide/selectable) of the
documentation.

## License

MIT
