import { ButtonView, keyCodes, type KeystrokeInfo } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubmenuView from '../src/submenuView.js';

function keystroke(keyCode: number): KeystrokeInfo & { preventDefault(): void; stopPropagation(): void } {
	return {
		keyCode,
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn()
	};
}

function createButton(label: string): ButtonView {
	const button = new ButtonView();

	button.set({ label, withText: true });

	return button;
}

describe('SubmenuView', () => {
	let view: SubmenuView;
	let first: ButtonView;
	let second: ButtonView;

	beforeEach(() => {
		first = createButton('First');
		second = createButton('Second');
		view = new SubmenuView(undefined, 'More', [first, second]);
		view.render();
		document.body.append(view.element!);
	});

	afterEach(() => {
		view.element?.remove();
		view.destroy();
	});

	it('renders a menu item and a closed nested menu', () => {
		const button = view.buttonView.element!;

		expect(view.buttonView.label).toBe('More');
		expect(view.buttonView.role).toBe('menuitem');
		expect(button.getAttribute('aria-haspopup')).toBe('true');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(view.panelView.element?.classList.contains('ck-hidden')).toBe(true);
		expect(view.panelView.element?.getAttribute('aria-label')).toBe('More');
		expect(view.isOpen).toBe(false);
	});

	it('focus() focuses the menu item', () => {
		view.focus();

		expect(document.activeElement).toBe(view.buttonView.element);
	});

	it('opens on click and focuses the first nested item, and closes on the next click', () => {
		view.buttonView.element!.click();

		expect(view.isOpen).toBe(true);
		expect(view.buttonView.isOn).toBe(true);
		expect(view.buttonView.element?.getAttribute('aria-expanded')).toBe('true');
		expect(view.panelView.element?.classList.contains('ck-hidden')).toBe(false);
		expect(document.activeElement).toBe(first.element);

		view.buttonView.element!.click();

		expect(view.isOpen).toBe(false);
		expect(document.activeElement).toBe(view.buttonView.element);
	});

	it('opens with the right arrow and closes with the left arrow, repeatedly', () => {
		for (let round = 0; round < 2; round++) {
			view.focus();
			view.keystrokes.press(keystroke(keyCodes.arrowright));

			expect(view.isOpen).toBe(true);
			expect(document.activeElement).toBe(first.element);

			view.keystrokes.press(keystroke(keyCodes.arrowleft));

			expect(view.isOpen).toBe(false);
			expect(document.activeElement).toBe(view.buttonView.element);
		}
	});

	it('ignores the right arrow inside the nested menu and the left arrow on the menu item', () => {
		view.open();
		view.keystrokes.press(keystroke(keyCodes.arrowright));
		expect(document.activeElement).toBe(first.element);

		view.close();
		view.keystrokes.press(keystroke(keyCodes.arrowleft));
		expect(view.isOpen).toBe(false);
	});

	it('closes on Esc in the nested menu', () => {
		view.open();
		view.panelView.keystrokes.press(keystroke(keyCodes.esc));

		expect(view.isOpen).toBe(false);
		expect(document.activeElement).toBe(view.buttonView.element);
	});

	it('fires `execute` when a nested item is executed, but not when it opens', () => {
		const executeSpy = vi.fn();

		view.on('execute', executeSpy);
		view.buttonView.fire('execute');
		expect(executeSpy).not.toHaveBeenCalled();

		second.fire('execute');
		expect(executeSpy).toHaveBeenCalledTimes(1);
	});
});
