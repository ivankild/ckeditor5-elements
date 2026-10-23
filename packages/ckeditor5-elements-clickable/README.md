# ckeditor5-elements-clickable

Clickable elements for CKEditor 5 Elements: `ElementClickable` calls a function, with the model element, when an element
that matches a model name or a filter function is clicked or double-clicked.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementClickable } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementClickable],
elementClickables: [
	// By name. The default event is `click`.
	{ element: 'imageBlock', callback: (element, editor) => console.log(element.getAttribute('src')) },
	// By a filter, on double click.
	{ element: element => element.name.startsWith('heading'), event: 'dblclick', callback: (element, editor) => {} }
]
```

See the [Clickable elements guide](https://ivankild.github.io/ckeditor5-elements/guide/clickable) of the documentation.

## License

MIT
