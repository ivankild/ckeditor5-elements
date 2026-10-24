/**
 * Element interaction, without CKEditor's widgets: select an element as a whole by a click or by the arrow keys, and call
 * a function, with the model element, when an element that matches a name or a filter is clicked or double-clicked.
 *
 * @module ckeditor5-elements-interaction
 */

// Plugins.
export { default as ElementSelectable, type ElementSelectableMatcher } from './elementSelectable.js';
export {
	default as ElementClickable,
	type ElementClickableDefinition,
	type ElementClickableEvent
} from './elementClickable.js';

// Observers.
export { default as DoubleClickObserver, type ViewDocumentDoubleClickEvent } from './doubleClickObserver.js';

import './augmentation.js';
