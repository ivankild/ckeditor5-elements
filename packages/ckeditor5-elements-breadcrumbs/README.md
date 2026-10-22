# ckeditor5-elements-breadcrumbs

Breadcrumbs for CKEditor 5: the element path at the selection (e.g. `section.title › p`), one button per element.
Text attributes such as `<strong>` are skipped.

```ts
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import 'ckeditor5-elements-breadcrumbs/index.css';

ClassicEditor.create({
	plugins: [, /* … */ Breadcrumbs],
	toolbar: ['bold', 'italic', '|', 'breadcrumbs']
});
```

Place the breadcrumbs anywhere else with `editor.plugins.get('Breadcrumbs').createView()`.

When the `ElementContextMenu` plugin from `ckeditor5-elements-context-menu` is loaded, clicking a breadcrumb opens the
menu of its element. This package does not depend on it.
