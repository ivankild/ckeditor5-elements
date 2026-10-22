/**
 * The element context menu: commands, submenus and separators, configured by the `elementContextMenu` option.
 *
 * @module ckeditor5-elements-context-menu
 */

// Plugins.
export {
	default as ElementContextMenu,
	type ElementContextMenuItem,
	type ElementContextMenuItems,
	type ElementContextSubmenu
} from './elementContextMenu.js';

// Views.
export { default as ElementContextMenuView } from './elementContextMenuView.js';
export { default as SubmenuView } from './submenuView.js';
export { default as MenuSeparatorView } from './menuSeparatorView.js';

// Observer.
export { default as ContextMenuObserver, type ViewDocumentContextMenuEvent } from './contextMenuObserver.js';

import './augmentation.js';
