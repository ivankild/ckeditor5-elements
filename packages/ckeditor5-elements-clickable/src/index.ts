/**
 * Clickable elements: call a function, with the model element, when an element that matches a name or a filter is
 * clicked or double-clicked.
 *
 * @module ckeditor5-elements-clickable
 */

// Plugins.
export {
	default as ElementClickable,
	type ElementClickableDefinition,
	type ElementClickableEvent
} from './elementClickable.js';

// Observers.
export { default as DoubleClickObserver, type ViewDocumentDoubleClickEvent } from './doubleClickObserver.js';

import './augmentation.js';
