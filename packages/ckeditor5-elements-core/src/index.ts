/**
 * The base of the element commands, their buttons and menus: `ElementOrPositionCommand` (a command for a position or
 * an element, with its title, icon and state for any target), `ElementCommand` (toggles an element), their button
 * views, and `ElementMenu` (menus of commands, submenus and separators, used by the context menu, the breadcrumbs and
 * quick insert).
 *
 * @module ckeditor5-elements-core
 */

// Plugins.
export {
	default as ElementMenu,
	type ElementMenuConfig,
	type ElementMenuItem,
	type ElementMenuShowOptions,
	type ElementSubmenu
} from './elementMenu.js';

// Commands.
export { default as ElementOrPositionCommand, type ElementOrPosition } from './elementOrPositionCommand.js';
export { default as ElementCommand } from './elementCommand.js';

// Views.
export {
	default as ElementOrPositionButtonView,
	type ElementOrPositionButtonViewOptions
} from './elementOrPositionButtonView.js';
export { default as ElementButtonView } from './elementButtonView.js';
export { default as ElementMenuView, type ElementMenuViewOptions } from './elementMenuView.js';
export { default as SubmenuView } from './submenuView.js';
export { default as MenuSeparatorView } from './menuSeparatorView.js';

// Utils.
export { isInDocument } from './utils.js';

import './augmentation.js';
