/**
 * The element context menu: right-clicking an element (or Shift+F10, or the menu key) opens the menu of the element,
 * configured by the `elementContextMenu` option. The menus are shown by `ElementMenu` from `ckeditor5-elements-core`.
 *
 * @module ckeditor5-elements-context-menu
 */

// Plugins.
export { default as ElementContextMenu } from './elementContextMenu.js';

// Observer.
export { default as ContextMenuObserver, type ViewDocumentContextMenuEvent } from './contextMenuObserver.js';

import './augmentation.js';
