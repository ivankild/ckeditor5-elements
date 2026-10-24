/**
 * Element menus: `ElementMenu` shows the menu of an element, built from commands, submenus and separators, and the
 * features that open it: the element context menu (a right-click, Shift+F10 or the menu key), the breadcrumbs (the
 * element path at the selection, clickable with a menu) and quick insert (search and insert the elements allowed at a
 * position).
 *
 * @module ckeditor5-elements-menu
 */

// Plugins.
export {
	default as ElementMenu,
	type ElementMenuConfig,
	type ElementMenuItem,
	type ElementMenuShowOptions,
	type ElementSubmenu
} from './elementMenu.js';
export { default as ElementContextMenu } from './contextMenu/elementContextMenu.js';
export { default as Breadcrumbs, type BreadcrumbsConfig } from './breadcrumbs/breadcrumbs.js';
export { default as QuickInsert, type QuickInsertConfig } from './quickInsert/quickInsert.js';

// Commands.
export { default as QuickInsertCommand } from './quickInsert/quickInsertCommand.js';
export {
	default as QuickInsertPositionCommand,
	type QuickInsertPlacement
} from './quickInsert/quickInsertPositionCommand.js';

// Views.
export { default as ElementMenuView } from './elementMenuView.js';
export {
	default as BreadcrumbsView,
	type BreadcrumbsViewExecuteEvent,
	type BreadcrumbsViewOptions
} from './breadcrumbs/breadcrumbsView.js';
export {
	default as BreadcrumbItemView,
	type BreadcrumbItem,
	type BreadcrumbItemViewOptions
} from './breadcrumbs/breadcrumbItemView.js';
export { default as BreadcrumbLabelView } from './breadcrumbs/breadcrumbLabelView.js';
export { default as QuickInsertView } from './quickInsert/quickInsertView.js';
export { default as QuickInsertListView, type QuickInsertItem } from './quickInsert/quickInsertListView.js';

// Observers.
export {
	default as ContextMenuObserver,
	type ViewDocumentContextMenuEvent
} from './contextMenu/contextMenuObserver.js';

// Icons.
export { insertAfterIcon, insertBeforeIcon, insertIcon } from './quickInsert/icons.js';

import './augmentation.js';
