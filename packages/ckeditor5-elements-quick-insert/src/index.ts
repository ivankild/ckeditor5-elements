/**
 * Quick insert: search and insert the elements allowed at a position.
 *
 * @module ckeditor5-elements-quick-insert
 */

// Plugins.
export { default as QuickInsert, type QuickInsertConfig } from './quickInsert.js';

// Commands.
export { default as QuickInsertCommand } from './quickInsertCommand.js';
export { default as QuickInsertPositionCommand, type QuickInsertPlacement } from './quickInsertPositionCommand.js';

// Views.
export { default as QuickInsertView } from './quickInsertView.js';
export { default as QuickInsertListView, type QuickInsertItem } from './quickInsertListView.js';

// Icons.
export { insertAfterIcon, insertBeforeIcon, insertIcon } from './icons.js';

import './augmentation.js';
