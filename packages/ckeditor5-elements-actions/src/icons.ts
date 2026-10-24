import { IconCopy, IconRemove } from 'ckeditor5';

/**
 * The icons of the element actions and of the clipboard commands, in the style of the CKEditor 5 icons (20×20).
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

/**
 * Copy: CKEditor's own copy icon.
 */
export const copyIcon = IconCopy;

/**
 * Cut: scissors.
 */
export const cutIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M5.3 2.9 6.6 2.1l6.2 10.3a3 3 0 1 1-1.3.8L10 10.7 8.5 13.2a3 3 0 1 1-1.3-.8l2-3.3zm7.4 11.1a1.5 1.5 0 1 0 2.1 2.1 ' +
	'1.5 1.5 0 0 0-2.1-2.1zm-7.4 0a1.5 1.5 0 1 0 2.1 2.1 1.5 1.5 0 0 0-2.1-2.1zm5.4-5.3 3.9-6.6 1.3.8-4.4 7.3z"/></svg>';

/**
 * Paste: a clipboard.
 */
export const pasteIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M7.5 2h5a1 1 0 0 1 1 1v.5h1.7a1.3 1.3 0 0 1 1.3 1.3v11.9a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3V4.8a1.3 ' +
	'1.3 0 0 1 1.3-1.3h1.7V3a1 1 0 0 1 1-1zM8 3.5V5h4V3.5zM5 5v11.5h10V5h-1.5v.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V5zm2 ' +
	'4h6v1.5H7zm0 3h4v1.5H7z"/></svg>';

/**
 * Paste before: a small clipboard above a block.
 */
export const pasteBeforeIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M8.5 1.5h3v1h1.4a.6.6 0 0 1 .6.6v5.3a.6.6 0 0 1-.6.6H7.1a.6.6 0 0 1-.6-.6V3.1a.6.6 0 0 1 .6-.6h1.4zM8 4v3.5h4V4zM3.5 ' +
	'11h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm.5 1.5v4h12v-4z"/></svg>';

/**
 * Paste after: a block above a small clipboard.
 */
export const pasteAfterIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M3.5 2h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm.5 1.5v4h12v-4zM8.5 10.5h3v1h1.4a.6.6 0 0 ' +
	'1 .6.6v5.3a.6.6 0 0 1-.6.6H7.1a.6.6 0 0 1-.6-.6v-5.3a.6.6 0 0 1 .6-.6h1.4zM8 13v3.5h4V13z"/></svg>';
