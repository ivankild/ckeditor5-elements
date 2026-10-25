/**
 * The base of the element-first features: every feature acts on an element, through commands. `ElementOrPositionCommand`
 * is a command for an element (or a position, where an element is or goes), with its title, icon and state for any
 * target; `ElementCommand` toggles an element; and their button views. The menus of commands are in
 * `ckeditor5-elements-menu`.
 *
 * @module ckeditor5-elements-core
 */

import './singleCopyGuard.js';

// Commands.
export { default as ElementOrPositionCommand, type ElementOrPosition } from './elementOrPositionCommand.js';
export { default as ElementCommand } from './elementCommand.js';

// Views.
export {
	default as ElementOrPositionButtonView,
	bindButtonToCommand,
	type ElementOrPositionButtonViewOptions,
	type ElementOrPositionTarget
} from './elementOrPositionButtonView.js';
export { default as ElementButtonView } from './elementButtonView.js';

// Utils.
export { getElementAtSelection, isInDocument, isStandalone, selectNewElement } from './utils.js';
export { findPlugin, getElementsAround, matchesElement, type ElementMatcher } from './matching.js';
