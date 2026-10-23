# Breadcrumbs

`Breadcrumbs` shows the element path at the cursor, e.g. `aside.note › p`, as
the `breadcrumbs` toolbar component.

The path is made of the elements of the editor **data** (as `editor.getData()` outputs it), not of the editing view, so
it has no editing-only classes or wrappers:

| Cursor                                | Path                                     |
| ------------------------------------- | ---------------------------------------- |
| In a list item                        | `ul › li`                                |
| In a table cell                       | `figure.table › table › tbody › tr › td` |
| In an image caption                   | `figure.image › figcaption`              |
| On a selected image (or other object) | `figure.image`                           |

Text attributes such as `<strong>` or `<a>` are not part of the path.

```ts
import { Breadcrumbs } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';
```

The path is a list in a `nav` landmark ("Element path"), and the element with the cursor is marked with
`aria-current="location"`, so screen readers announce where the cursor is.

To build the path, the plugin converts the document to the data view. It does that again only when elements change,
not when typing or moving the cursor. When converting takes long (in a large document), it happens at most every
250 ms, so the path can lag behind briefly. `editor.plugins.get('Breadcrumbs').refresh()` updates it right away.

## Labels

By default, the breadcrumbs are labels. CKEditor's `-` toolbar item (a line break, with `shouldNotGroupWhenFull: true`) puts them on their own toolbar line.

<EditorDemo name="breadcrumbsLabels" />

::: details Source
<<< @/demos/breadcrumbsLabels.ts
:::

## With a menu

The `breadcrumbs.menu` option makes the breadcrumbs buttons that open a menu of their element. It takes the same items as
[`elementContextMenu`](./context-menu), so one callback can serve both. The parts of a structure open the menu of the
structure (`tbody` opens the menu of the table). List items (`ul`, `li`) stay labels: lists are attributes of the
blocks in them, not elements. The menu is shown by the `ElementMenu` plugin, so load it too
(`ElementContextMenu` and `QuickInsert` load it); without it, the breadcrumbs stay labels.

<EditorDemo name="breadcrumbsMenu" />

::: details Source
<<< @/demos/breadcrumbsMenu.ts
:::

The buttons tell screen readers that they open a menu (`aria-haspopup`, `aria-expanded`), and Esc in the menu returns
the focus to the button.

::: tip Independent of the other features
The breadcrumbs depend only on the core, not on the other features. They look up the `ElementMenu` plugin by name, and
use it through the `BreadcrumbsMenu` interface, so without it they work as labels.
:::

## Keyboard

In the toolbar (Alt+F10), the arrow keys move through the breadcrumbs like through the other toolbar items, so every
breadcrumb can be reached: labels too, so their text can be read. Coming from the previous toolbar item, the focus
goes to the outermost breadcrumb; from the next one, to the innermost.

## Anywhere on the page

`editor.plugins.get('Breadcrumbs').createView()` returns breadcrumbs that follow the cursor, to place anywhere. Here,
below the editor:

<EditorDemo name="breadcrumbsOutside" />

::: details Source
<<< @/demos/breadcrumbsOutside.ts
:::
