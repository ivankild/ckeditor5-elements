/**
 * Element actions: move an element up or down, duplicate it, or delete it.
 *
 * @module ckeditor5-elements-actions
 */

// Plugins.
export { default as ElementActions } from './elementActions.js';

// Commands.
export { default as ElementMoveCommand, type ElementMoveDirection } from './elementMoveCommand.js';
export { default as ElementDuplicateCommand } from './elementDuplicateCommand.js';
export { default as ElementDeleteCommand } from './elementDeleteCommand.js';

// Icons.
export { deleteIcon, duplicateIcon, moveDownIcon, moveUpIcon } from './icons.js';

import './augmentation.js';
