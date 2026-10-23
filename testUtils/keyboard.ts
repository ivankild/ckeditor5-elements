import type { KeystrokeInfo } from 'ckeditor5';
import { vi, type Mock } from 'vitest';

/**
 * The modifier keys of a keystroke.
 */
export interface Modifiers {
	shiftKey?: boolean;
	altKey?: boolean;
	ctrlKey?: boolean;
	metaKey?: boolean;
}

/**
 * The data of a keystroke, as CKEditor's `KeystrokeHandler` gets it, with spies on `preventDefault()` and
 * `stopPropagation()`.
 */
export type KeystrokeData = KeystrokeInfo & { preventDefault: Mock<() => void>; stopPropagation: Mock<() => void> };

/**
 * Creates the data of a keystroke, e.g. for `KeystrokeHandler#press()`.
 */
export function keystroke(keyCode: number, modifiers: Modifiers = {}): KeystrokeData {
	return {
		keyCode,
		shiftKey: false,
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		...modifiers,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn()
	};
}

/**
 * Presses a key on a `KeystrokeHandler` (e.g. `editor.keystrokes`, or `view.keystrokes`). Returns whether the keystroke
 * was handled, i.e. its default action was prevented.
 */
export function press(
	handler: { press(data: KeystrokeData): boolean },
	keyCode: number,
	modifiers?: Modifiers
): boolean {
	const data = keystroke(keyCode, modifiers);

	handler.press(data);

	return data.preventDefault.mock.calls.length > 0;
}

/**
 * Presses a key in an element, as the browser does: a `keydown` event that bubbles, e.g. to the toolbar the element is
 * in. Returns whether the event was handled.
 */
export function pressIn(target: EventTarget, keyCode: number, modifiers: Modifiers = {}): boolean {
	const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...modifiers });

	// CKEditor reads the key code, which the constructor does not set.
	Object.defineProperty(event, 'keyCode', { value: keyCode });
	target.dispatchEvent(event);

	return event.defaultPrevented;
}
