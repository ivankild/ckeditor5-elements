# Breadcrumbs

`Breadcrumbs` (from `ckeditor5-elements-breadcrumbs`) shows the element path at the cursor, e.g. `aside.note › p`, as
the `breadcrumbs` toolbar component. Text attributes such as `<strong>` are not part of the path.

## Labels

By default, the breadcrumbs are labels. CKEditor's `-` toolbar item (a line break, with `shouldNotGroupWhenFull: true`) puts them on their own toolbar line.

<EditorDemo name="breadcrumbsLabels" />

::: details Source
<<< @/demos/breadcrumbsLabels.ts
:::

## With a menu

The `breadcrumbs.menu` option makes the breadcrumbs buttons that open a menu of their element. It takes the same items as
[`elementContextMenu`](./context-menu), so one callback can serve both. The menu is shown by `ElementContextMenu`, so
load that plugin too; without it, the breadcrumbs stay labels.

<EditorDemo name="breadcrumbsMenu" />

::: details Source
<<< @/demos/breadcrumbsMenu.ts
:::

::: tip No dependency
`ckeditor5-elements-breadcrumbs` does not depend on `ckeditor5-elements-context-menu`. It looks up the
`ElementContextMenu` plugin by name and uses it through the `BreadcrumbsMenu` interface.
:::

## Anywhere on the page

`editor.plugins.get('Breadcrumbs').createView()` returns breadcrumbs that follow the cursor, to place anywhere. Here,
below the editor:

<EditorDemo name="breadcrumbsOutside" />

::: details Source
<<< @/demos/breadcrumbsOutside.ts
:::
