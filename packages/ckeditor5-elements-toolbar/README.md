# ckeditor5-elements-toolbar

Element toolbars for CKEditor 5 Elements: `ElementToolbar` shows a floating toolbar next to the element with the cursor,
for the elements that match a model name or a filter function. Its command buttons act on that element.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { ElementActions, ElementToolbar } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementActions, ElementToolbar],
elementToolbars: [
	{ element: 'note', items: ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'] },
	{ element: element => element.name.startsWith('heading'), items: ['heading', '|', 'deleteElement'] }
]
```

See the [Element toolbar guide](https://ivankild.github.io/ckeditor5-elements/guide/toolbar) of the documentation.

## License

MIT
