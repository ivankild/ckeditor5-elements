# Element toolbar

`ElementToolbar` shows a floating toolbar next to the element with the cursor, for the elements you choose: by their
model name, or by a filter function. It is configured by the `elementToolbars` editor option:

```ts
import { ElementActions, ElementToolbar } from 'ckeditor5-elements';

// In the editor config:
plugins: [..., ElementActions, ElementToolbar],
elementToolbars: [
	// By name.
	{ element: 'note', items: ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'] },
	// By a filter: `(element: ModelElement) => boolean`.
	{ element: element => element.name.startsWith('heading'), items: ['heading', '|', 'deleteElement'] }
];
```

The items are as in CKEditor's toolbar config:

- The name of a [command that acts on an element](./commands) (e.g. `moveElementUp`, `duplicateElement`, `note`): a
  button that acts on the element of the toolbar, not on the element with the cursor. In the toolbar of a note,
  "Move up" moves the note, even when the cursor is in a paragraph inside it.
- The name of another UI component (e.g. `bold`, `heading`): as in the main toolbar.
- `'|'`: a separator. Groups (`{ label, items }`) work too.

`ariaLabel` names the toolbar for screen readers; it defaults to "Element toolbar".

<EditorDemo name="toolbarActions" />

::: details Source
<<< @/demos/toolbarActions.ts
:::

## How it shows

- The toolbar shows while the editor is focused and the cursor is in a matching element (or the element is selected),
  and moves with it.
- When toolbars match nested elements, only the toolbar of the innermost one shows.
- Alt+F10 moves the focus to the toolbar; Esc returns it to the editor.

The toolbars are CKEditor's widget toolbars (`WidgetToolbarRepository`), as the image and table toolbars, so they look and
behave the same. The difference is that they show for any element, not only for a selected widget.
