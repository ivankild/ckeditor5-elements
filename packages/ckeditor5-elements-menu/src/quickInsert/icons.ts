import { IconPlus } from 'ckeditor5';

/**
 * The icons of the quick insert commands, in the style of the CKEditor 5 icons (20×20).
 */

/**
 * Insert element: CKEditor's own plus icon.
 */
export const insertIcon = IconPlus;

/**
 * Insert before: a plus above a block.
 */
export const insertBeforeIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M9.25 1.5h1.5v2.75h2.75v1.5h-2.75V8.5h-1.5V5.75H6.5v-1.5h2.75zM3.5 11h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 ' +
	'1-1-1v-5a1 1 0 0 1 1-1zm.5 1.5v4h12v-4z"/></svg>';

/**
 * Insert after: a block above a plus.
 */
export const insertAfterIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="' +
	'M3.5 2h13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm.5 1.5v4h12v-4zM9.25 11h1.5v2.75h2.75v1.5' +
	'h-2.75V18h-1.5v-2.75H6.5v-1.5h2.75z"/></svg>';
