# ckeditor5-elements-example

The full example of CKEditor 5 Elements: an editor with all its features, as an app would set it up. It is private
(not published).

**[Try it in the documentation](https://ivankild.github.io/ckeditor5-elements/example)**, or run it from the repository:

```sh
pnpm install
pnpm example   # http://localhost:5173
```

It imports everything from `ckeditor5` and `ckeditor5-elements`, as an app installing them would:

| File                                 | What it is                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| [`src/config.ts`](src/config.ts)     | The editor config: CKEditor's common features, the `Note` element, and all the features |
| [`src/schema.json`](src/schema.json) | The elements of the element schema: a tip, steps and a status                           |
| [`src/note.ts`](src/note.ts)         | The `Note` element: a note (`<aside class="note">`) and a warning, with toggle commands |
| [`src/data.ts`](src/data.ts)         | The content of the editor, which tells what to try                                      |
| [`src/main.ts`](src/main.ts)         | Creates the editor in [`index.html`](index.html)                                        |
| [`src/content.css`](src/content.css) | The styles of notes and of the elements of the schema                                   |

In the editor:

- Right-click a block, or press Shift+F10: its menu (toggles, insert, duplicate, move, clipboard, delete).
- Put the cursor in a note or a heading: its floating toolbar, which acts on the whole element.
- Click a breadcrumb (the second toolbar line): the menu of that element.
- Alt+Enter (Option+Enter on macOS): quick insert.
- Click the frame of a note, the tip or a step, or the status: it is selected as a whole. At the end of a block, the arrow keys select the next element; Esc in a note selects the note.
- Click an image, the medium or the linked image: a modal with its attributes (the `showElementAttributes` command). Double-click a note: the same for the note. It is in the menus too, as "Show attributes".

`pnpm --filter ckeditor5-elements-example build` builds a static site in `dist`.
