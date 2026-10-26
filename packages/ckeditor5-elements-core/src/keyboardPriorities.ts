import { priorities, type PriorityString } from 'ckeditor5';

/**
 * The priorities of the keyboard listeners of the element features, on the events of the view document (`keydown`,
 * `insertText`, `enter`). They are in one place, as their order matters where several features handle the same key: a
 * listener with a higher priority goes first, and stops the event when it handles it.
 *
 * In their order, from the first:
 *
 * 1. {@link twoStepCaretMovement}: the arrow keys at the ends of an inline element with text.
 * 2. {@link verbatimEnter}: Enter in a verbatim block.
 * 3. {@link selectable}, {@link listEnter}, {@link typing}: the arrow keys that select an element, Enter in a list item,
 *    and the text typed at the cursor. They handle different events, so they do not meet.
 * 4. CKEditor's own listeners, e.g. its Enter and its widgets, with the `normal` priority.
 * 5. {@link selectableEsc}: Esc, which selects the element around the cursor.
 */
export const keyboardPriorities = {
	/**
	 * The arrow keys of two-step caret movement, before anything else that moves the cursor: e.g. `ElementSelectable`
	 * selects an inline object that the cursor reaches, and it may be just after the end of an inline element.
	 */
	twoStepCaretMovement: 'highest',

	/**
	 * Enter in a verbatim block, which inserts a new line: before Enter in a list item, as a verbatim block can be in an
	 * item, and before CKEditor's Enter, which would split the block.
	 */
	verbatimEnter: priorities.get('high') + 1,

	/**
	 * The arrow keys of `ElementSelectable`, on `keydown`: before CKEditor's widgets, which handle the arrow keys of
	 * every object (as the `arrowKey` event).
	 */
	selectable: 'high',

	/**
	 * Enter in a list item, which makes the next item: before CKEditor's Enter, which would split the block in the item.
	 */
	listEnter: 'high',

	/**
	 * The text typed at the cursor at an end of an inline element (`insertText`): before CKEditor's typing, which would
	 * type it where the browser puts it.
	 */
	typing: 'high',

	/**
	 * Esc, which selects the element around the cursor: after what else uses it, e.g. closing a balloon.
	 */
	selectableEsc: 'low'
} as const satisfies Record<string, PriorityString>;
