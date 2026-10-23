import { IconRemove } from 'ckeditor5';

/**
 * The icons of the element actions, in the style of the CKEditor 5 icons (20×20).
 */

/**
 * Move up: an arrow up, above a block.
 */
export const moveUpIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M10 1.5l3.75 3.75-1.05 1.05-1.95-1.95V8.5h-1.5V4.35L7.3 6.3 6.25 5.25zM3.5 11h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 ' +
	'1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm.5 1.5v4h12v-4z"/></svg>';

/**
 * Move down: a block, above an arrow down.
 */
export const moveDownIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M3.5 2h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm.5 1.5v4h12v-4zM10 18.5l-3.75-3.75 ' +
	'1.05-1.05 1.95 1.95V11.5h1.5v4.15l1.95-1.95 1.05 1.05z"/></svg>';

/**
 * Duplicate: a block, above a new block.
 */
export const duplicateIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M3.5 2h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm.5 1.5v4h12v-4zM3.5 11h13a1 1 0 0 1 1 ' +
	'1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm.5 1.5v4h12v-4zM9.25 13h1.5v.75h.75v1.5h-.75V16h-1.5v-.75H8.5' +
	'v-1.5h.75z"/></svg>';

/**
 * Delete: CKEditor's own remove icon.
 */
export const deleteIcon = IconRemove;
