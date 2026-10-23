# ckeditor5-elements-quick-insert

Quick insert for CKEditor 5 Elements: `QuickInsert` opens a searchable list of the elements allowed at the cursor on
Alt+Enter (Option+Enter on macOS). The `quickInsertBefore` and `quickInsertAfter` commands open it before or after an
element, e.g. from the element context menu.

## Installation

This package is part of `ckeditor5-elements`. Install the whole package to use it:

```sh
npm install ckeditor5 ckeditor5-elements
```

## Usage

```ts
import { QuickInsert } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';

// In the editor config:
plugins: [..., QuickInsert],
quickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1' } }
```

See the "Quick insert" guide of the documentation.

## License

MIT
