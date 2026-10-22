# ckeditor5-elements-breadcrumbs

Breadcrumbs for CKEditor 5: the element path at the selection (e.g. `section.title › p`). Text attributes such as
`<strong>` are skipped.

```ts
import { Breadcrumbs } from 'ckeditor5-elements-breadcrumbs';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import 'ckeditor5-elements-breadcrumbs/index.css';
import 'ckeditor5-elements-core/index.css';

ClassicEditor.create({
	plugins: [Essentials, Paragraph, Bold, Italic, Breadcrumbs, ElementContextMenu],
	toolbar: ['bold', 'italic', '|', 'breadcrumbs'],
	breadcrumbs: {
		// Optional. Makes the breadcrumbs buttons that open this menu of their element.
		menu: (element, editor) => [editor.commands.get('copyElement'), '|', editor.commands.get('title')]
	}
});
```

Whether breadcrumbs can be clicked, and what their menu shows, is configured only by the `breadcrumbs.menu` option. It
takes the same items as `elementContextMenu` from `ckeditor5-elements-context-menu` (commands, submenus and `'|'`
separators), so the same callback can serve both. Without it, the breadcrumbs are labels.

The menu is shown by the `ElementMenu` plugin of `ckeditor5-elements-core` (loaded by `ElementContextMenu` and
`QuickInsert`), so load it too; without it, the breadcrumbs are labels as well. This package does not depend on
`ckeditor5-elements-core`: it looks the plugin up by name and uses it through the `BreadcrumbsMenu` interface
(`open(element, target, items)`).

The path is a list in a `nav` landmark, and the element with the cursor has `aria-current="location"`.

Place the breadcrumbs anywhere else with `editor.plugins.get('Breadcrumbs').createView()`.
