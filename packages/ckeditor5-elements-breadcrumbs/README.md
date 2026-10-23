# ckeditor5-elements-breadcrumbs

Breadcrumbs for CKEditor 5 Elements: `Breadcrumbs` shows the element path at the cursor, made of the elements of the
editor data (e.g. `ul › li`, `figure.table › table › tbody › tr › td`), as labels, or as buttons that open the element
menu.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { Breadcrumbs } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., Breadcrumbs],
toolbar: ['bold', 'italic', '|', 'breadcrumbs'],
// Optional: the breadcrumbs become buttons that open this menu (needs the `ElementMenu` plugin).
breadcrumbs: { menu: (element, editor) => [editor.commands.get('copyElement')] }
```

See the [Breadcrumbs guide](https://ivankild.github.io/ckeditor5-elements/guide/breadcrumbs) of the documentation.

## License

MIT
