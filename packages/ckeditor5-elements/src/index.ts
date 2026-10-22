/**
 * An example element feature (`Elements`: the `element` model element, the `insertElement` and `element` commands
 * and buttons). The commands and button views it uses are in `ckeditor5-elements-ui`.
 *
 * @module ckeditor5-elements
 */

// Plugins.
export { default as Elements } from './elements.js';
export { default as ElementsEditing } from './elementsEditing.js';
export { default as ElementsUI } from './elementsUI.js';

// Commands.
export { default as InsertElementCommand } from './insertElementCommand.js';

import './augmentation.js';
