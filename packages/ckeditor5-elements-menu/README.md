# ckeditor5-elements-menu

Element menus for CKEditor 5 Elements: `ElementMenu` shows the menu of an element, built from commands, submenus and
separators, in a balloon. The features that open it are in this package too:

- `ElementContextMenu`: right-clicking an element (or Shift+F10, or the menu key) opens its menu, configured by the
  `elementContextMenu` option.
- `ElementBreadcrumbs`: the element path at the selection, e.g. `aside.note › p`, as labels, or as buttons that open the menu of
  their element with the `elementBreadcrumbs.menu` option.
- `ElementQuickInsert`: Alt+Enter opens a searchable list of the elements allowed at the cursor, and the `quickInsertBefore`
  and `quickInsertAfter` commands are menu items that insert next to an element.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

Import the stylesheet of the package (`ckeditor5-elements/index.css` has the styles of all the features).

## Usage

```ts
import { ElementBreadcrumbs, ElementClipboard, ElementContextMenu, ElementQuickInsert } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// One menu for both: right-clicking an element, and clicking its breadcrumb.
const menu = (element, editor) => [
	{ title: 'Insert', items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')] },
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('cutElement')
];

// In the editor config:
plugins: [..., ElementContextMenu, ElementBreadcrumbs, ElementQuickInsert, ElementClipboard],
toolbar: ['bold', 'italic', '|', 'breadcrumbs'],
elementContextMenu: menu,
elementBreadcrumbs: { menu },
elementQuickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1' } }
```

See the [Context menu](https://ivankild.github.io/ckeditor5-elements/guide/context-menu),
[Breadcrumbs](https://ivankild.github.io/ckeditor5-elements/guide/breadcrumbs) and
[Quick insert](https://ivankild.github.io/ckeditor5-elements/guide/quick-insert) guides of the documentation.

## License

MIT
