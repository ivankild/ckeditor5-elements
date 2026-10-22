/**
 * Clipboard commands that act on an element: copy, cut, paste, paste before and paste after.
 *
 * @module ckeditor5-elements-clipboard
 */

// Plugins.
export { default as ElementClipboard } from './elementClipboard.js';

// Commands.
export { default as ElementCopyCommand } from './elementCopyCommand.js';
export { default as ElementPasteCommand, type ElementPastePlacement } from './elementPasteCommand.js';

import './augmentation.js';
