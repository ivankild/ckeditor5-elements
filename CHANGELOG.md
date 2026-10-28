# Changelog

All notable changes to CKEditor 5 Elements. The packages are released together, in the same version: the version of
CKEditor 5 they are built for. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [49.0.0] - 2026-10-28

The initial release: element-first editing for CKEditor 5 v49. The content is a tree of named elements, each with its
attributes, formatting included, and every feature acts on an element.

Install `ckeditor5-elements`, which brings all the packages below in the same version, and its stylesheet,
`ckeditor5-elements/index.css`. It needs `ckeditor5` `^49.0.0`.

### Commands and buttons (`ckeditor5-elements-core`)

- `ElementOrPositionCommand`: a command for an element, or a position where an element is or goes, with its title,
  icon and state for any target. `getState(target)` tells whether it is enabled and "on" there, and
  `executeFor(target)` executes it there, e.g. for the element of a menu. `editor.execute(name, target)` checks the
  target too.
- The commands of one element, by its kind, on a base of their own, `ElementCommand`:
    - `ElementInlineCommand` toggles an inline element with text, as CKEditor's bold does its mark;
    - `ElementBlockCommand` renames blocks, as a heading;
    - `ElementContainerCommand` wraps blocks, as a block quote;
    - `ElementListCommand` makes a list of the blocks, each in an item;
    - `ElementInsertCommand` inserts an element, as a horizontal line.

    `elementAttributes` makes a command for one kind of an element, e.g. a `note` with `type="warning"`.

- `ElementOrPositionButtonView` and `ElementButtonView`, which reflect a command and its "on" state, also for a given
  element. Failed commands are reported with a notification.

### Element actions (`ckeditor5-elements-actions`)

- `ElementActions`: `moveElementUp`, `moveElementDown`, `duplicateElement` and `deleteElement`.
- `ElementClipboard`: `copyElement`, `cutElement`, `pasteElement`, `pasteElementBefore` and `pasteElementAfter`, with
  the system clipboard.

The parts of a structure, such as table cells and rows, are not moved, copied or deleted on their own.

### Element attributes (`ckeditor5-elements-attributes`)

- `ElementAttributes`: `showElementAttributes` shows the attributes of an element in a modal dialog.

### Selecting and clicking (`ckeditor5-elements-interaction`)

- `ElementSelectable` (the `elementSelectable` option): selects an element as a whole, by a click, the arrow keys or
  Esc, without widgets.
- `ElementClickable` (the `elementClickable` option): a callback when an element is clicked or double-clicked.

### Element toolbar (`ckeditor5-elements-toolbar`)

- `ElementToolbar` (the `elementToolbar` option): floating toolbars for the elements that match a name or a filter, whose
  buttons act on that element.

### Menus (`ckeditor5-elements-menu`)

- `ElementMenu`: the menu of an element, of commands, submenus and separators, on CKEditor's dropdown menu.
- `ElementContextMenu` (the `elementContextMenu` option): the menu of the right-clicked element, or of the element at
  the cursor with Shift+F10.
- `ElementBreadcrumbs` (the `elementBreadcrumbs` option): the path of the elements at the cursor, as labels or as buttons
  that open the menu of their element.
- `ElementQuickInsert` (the `elementQuickInsert` option): Alt+Enter opens a searchable list of the elements allowed at
  the cursor. The `quickInsert` command inserts an element by name; `quickInsertBefore` and `quickInsertAfter` open the
  list for the position before or after an element, e.g. in a menu.

### Element schema (`ckeditor5-elements-schema`)

- `ElementSchema` (the `elementSchema` option): declares the elements of the content from a plain object, e.g. a JSON
  file, with three types (`empty`, `block`, `container`), inline or not, and `allowChildren`, `allowIn` and
  `allowAttributes`.
- Two kinds of elements, with their typing: `verbatim` blocks keep their whitespace, and Enter inserts a new line;
  `listItem` makes a container a list, where Enter makes the next item. At the ends of inline elements with text, the
  arrow keys move in two steps, as CKEditor's two-step caret movement does.
- The validation rejects a contradictory schema, or one that refers to unknown elements, with every problem at once
  (`ElementSchemaError`). `validateElementSchema()` and `parseElementSchema()` check a schema without an editor, also
  in Node.js, from `ckeditor5-elements/validate-schema`.
- Converters of the elements, one to one (the `elementSchemaConverters` option): as `div` and `span` with the name as the
  class, or the `tag` of an element; or with the names of the elements and their attributes in the data (`'names'`).
  `editingTag` sets another tag for the editor only.
- `ElementSchemaCommands` (the `elementSchemaCommands` option): a command, a toolbar button and a keystroke for each
  element, the command of its kind.

### Documentation

- The [guide](https://ivankild.github.io/ckeditor5-elements/), with a live demo of each feature and its source, and the
  API reference.
- [Examples](https://ivankild.github.io/ckeditor5-elements/examples/): an editor with all the features, a Simplified
  DocBook editor and a Lightweight DITA editor.

[49.0.0]: https://github.com/ivankild/ckeditor5-elements/releases/tag/v49.0.0
