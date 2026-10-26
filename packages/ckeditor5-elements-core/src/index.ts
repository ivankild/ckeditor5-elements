/**
 * The base of the element-first features: every feature acts on an element, through commands. `ElementOrPositionCommand`
 * is a command for an element (or a position, where an element is or goes), with its title, icon and state for any
 * target; `ElementCommand` is the base of the commands of one element, with a command for each kind of element (inline,
 * block, container, list, inserted); and their button views. `keyboardPriorities` orders the keyboard listeners of the
 * features. The menus of commands are in `ckeditor5-elements-menu`.
 *
 * @module ckeditor5-elements-core
 */

import './singleCopyGuard.js';

// Commands.
export { default as ElementOrPositionCommand, type ElementOrPosition } from './elementOrPositionCommand.js';
export { default as ElementCommand } from './commands/elementCommand.js';
export { default as ElementInlineCommand } from './commands/elementInlineCommand.js';
export { default as ElementBlockCommand } from './commands/elementBlockCommand.js';
export { default as ElementContainerCommand } from './commands/elementContainerCommand.js';
export { default as ElementListCommand } from './commands/elementListCommand.js';
export { default as ElementInsertCommand } from './commands/elementInsertCommand.js';

// Views.
export {
	default as ElementOrPositionButtonView,
	bindButtonToCommand,
	type ElementOrPositionButtonViewOptions,
	type ElementOrPositionTarget
} from './elementOrPositionButtonView.js';
export { default as ElementButtonView } from './elementButtonView.js';

// Keyboard.
export { keyboardPriorities } from './keyboardPriorities.js';

// Utils.
export { findBlock, getElementAtSelection, isInDocument, isStandalone, selectNewElement } from './utils.js';
export { findPlugin, getElementsAround, matchesElement, type ElementMatcher } from './matching.js';
