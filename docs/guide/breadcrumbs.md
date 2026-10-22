# Breadcrumbs

`Breadcrumbs` (from `ckeditor5-elements-breadcrumbs`) shows the element path at the cursor, e.g. `aside.note › p`, as
the `breadcrumbs` toolbar component. Text attributes such as `<strong>` are not part of the path.

```ts
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import 'ckeditor5-elements-breadcrumbs/index.css';
```

The path is a list in a `nav` landmark ("Element path"), and the element with the cursor is marked with
`aria-current="location"`, so screen readers announce where the cursor is.

## Labels

By default, the breadcrumbs are labels. CKEditor's `-` toolbar item (a line break, with `shouldNotGroupWhenFull: true`) puts them on their own toolbar line.

<EditorDemo name="breadcrumbsLabels" />

::: details Source
<<< @/demos/breadcrumbsLabels.ts
:::

## With a menu

The `breadcrumbs.menu` option makes the breadcrumbs buttons that open a menu of their element. It takes the same items as
[`elementContextMenu`](./context-menu), so one callback can serve both. The menu is shown by the `ElementMenu` plugin
of `ckeditor5-elements-core`, so load it too (`ElementContextMenu` and `QuickInsert` load it); without it, the
breadcrumbs stay labels. Its styles are in `ckeditor5-elements-core/index.css`.

<EditorDemo name="breadcrumbsMenu" />

::: details Source
<<< @/demos/breadcrumbsMenu.ts
:::

::: tip No dependency
`ckeditor5-elements-breadcrumbs` does not depend on the other packages. It looks up the `ElementMenu` plugin by name and
uses it through the `BreadcrumbsMenu` interface.
:::

## Anywhere on the page

`editor.plugins.get('Breadcrumbs').createView()` returns breadcrumbs that follow the cursor, to place anywhere. Here,
below the editor:

<EditorDemo name="breadcrumbsOutside" />

::: details Source
<<< @/demos/breadcrumbsOutside.ts
:::
