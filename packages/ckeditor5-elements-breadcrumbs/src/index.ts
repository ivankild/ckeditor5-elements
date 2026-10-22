/**
 * Breadcrumbs: the element path at the selection, optionally clickable with a configured menu.
 *
 * @module ckeditor5-elements-breadcrumbs
 */

// Plugins.
export {
	default as Breadcrumbs,
	type BreadcrumbsConfig,
	type BreadcrumbsMenu,
	type BreadcrumbsMenuItems,
	type BreadcrumbsMenuOptions
} from './breadcrumbs.js';

// Views.
export {
	default as BreadcrumbsView,
	type BreadcrumbsViewExecuteEvent,
	type BreadcrumbsViewOptions
} from './breadcrumbsView.js';
export {
	default as BreadcrumbItemView,
	type BreadcrumbItem,
	type BreadcrumbItemViewOptions
} from './breadcrumbItemView.js';
export { default as BreadcrumbLabelView } from './breadcrumbLabelView.js';

import './augmentation.js';
