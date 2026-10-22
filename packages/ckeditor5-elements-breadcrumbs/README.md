# ckeditor5-elements-breadcrumbs

Breadcrumbs for CKEditor 5: the element path at the selection, made of the elements of the editor data (as
`getData()` outputs them), e.g. `section.title › p`, `ul › li` or `figure.table › table › tbody › tr › td`. Text
attributes such as `<strong>` are skipped; a selected object (e.g. an image) is the innermost item.

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
separators), so the same callback can serve both. Without it, the breadcrumbs are labels. List items (`ul`, `li`) are
always labels, as lists are block attributes, not elements; the parts of a table open the menu of the table.

The menu is shown by the `ElementMenu` plugin of `ckeditor5-elements-core` (loaded by `ElementContextMenu` and
`QuickInsert`), so load it too; without it, the breadcrumbs are labels as well. This package does not depend on
`ckeditor5-elements-core`: it looks the plugin up by name and uses it through the `BreadcrumbsMenu` interface
(`open(element, target, items, options)`).

The path is a list in a `nav` landmark, and the element with the cursor has `aria-current="location"`. In a toolbar,
the arrow keys reach every breadcrumb. Buttons have `aria-haspopup` and `aria-expanded`, and get the focus back when
their menu is closed with Esc.

The data view is converted again only when elements change; for a large document, at most every 250 ms.

Place the breadcrumbs anywhere else with `editor.plugins.get('Breadcrumbs').createView()`.
