# Toolbar line break

`EndOfLine` (from `ckeditor5-elements-ui`) registers the `#` toolbar component: the toolbar items after it start on a
new line.

```ts
import { EndOfLine } from 'ckeditor5-elements-ui';
import 'ckeditor5-elements-ui/index.css';
```

<EditorDemo name="toolbarLineBreak" />

::: details Source
<<< @/demos/toolbarLineBreak.ts
:::

::: warning Wrapping toolbars only
The line break works only in toolbars that wrap their items, i.e. with `shouldNotGroupWhenFull: true`. By default, a
toolbar keeps its items on one line and moves the ones that do not fit into a "⋮" dropdown; there, `#` is hidden. It is
hidden in vertical and floating toolbars too.
:::

CKEditor's own `'-'` toolbar item does the same. `#` is a regular component (`EndOfLineView`), so it can also be created
with `editor.ui.componentFactory.create('#')`.

The [breadcrumbs](./breadcrumbs) examples use it to put the breadcrumbs on their own toolbar line.
