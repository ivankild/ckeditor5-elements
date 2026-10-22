# ckeditor5-elements

An example element feature for CKEditor 5, built on `ckeditor5-elements-core`.

`Elements` loads `ElementsEditing` (the `element` model element, converted to `<div class="ck-element">`, and the
`insertElement` command) and `ElementsUI` (the `element` toggle button and the `insertElement` button).

```ts
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { Elements } from 'ckeditor5-elements';

import 'ckeditor5/ckeditor5.css';

ClassicEditor.create({
	attachTo: document.querySelector('#editor'),
	licenseKey: 'GPL',
	plugins: [Essentials, Paragraph, Elements],
	toolbar: ['element', 'insertElement', '|', 'undo', 'redo']
});
```
