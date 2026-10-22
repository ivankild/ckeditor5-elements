// Plugins.
export { default as QuickInsert, type QuickInsertConfig } from './quickInsert.js';

// Commands.
export { default as QuickInsertCommand } from './quickInsertCommand.js';

// Views and items.
export { default as QuickInsertView } from './quickInsertView.js';
export { default as QuickInsertListView, type QuickInsertItem } from './quickInsertListView.js';
export { createElementInsertItems } from './elementInsertItems.js';

import './augmentation.js';
