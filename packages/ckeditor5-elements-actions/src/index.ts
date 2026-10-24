/**
 * Element actions: move an element up or down, duplicate it, or delete it; and the clipboard commands that act on an
 * element: copy, cut, paste, paste before and paste after.
 *
 * @module ckeditor5-elements-actions
 */

// Plugins.
export { default as ElementActions } from './elementActions.js';
export { default as ElementClipboard } from './elementClipboard.js';

// Commands.
export { default as ElementMoveCommand, type ElementMoveDirection } from './elementMoveCommand.js';
export { default as ElementDuplicateCommand } from './elementDuplicateCommand.js';
export { default as ElementDeleteCommand } from './elementDeleteCommand.js';
export { default as ElementCopyCommand } from './elementCopyCommand.js';
export { default as ElementPasteCommand, type ElementPastePlacement } from './elementPasteCommand.js';

// Icons.
export {
	copyIcon,
	cutIcon,
	deleteIcon,
	duplicateIcon,
	moveDownIcon,
	moveUpIcon,
	pasteAfterIcon,
	pasteBeforeIcon,
	pasteIcon
} from './icons.js';

import './augmentation.js';
