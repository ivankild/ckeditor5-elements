import { ButtonView, keyCodes, type KeystrokeInfo } from 'ckeditor5';
import { createPlainView } from '../../../testUtils/editor.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ElementContextMenuView from '../src/elementContextMenuView.js';

function press(view: ElementContextMenuView, keyCode: number, shiftKey = false): void {
	const data: KeystrokeInfo & { preventDefault(): void; stopPropagation(): void } = {
		keyCode,
		shiftKey,
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn()
	};

	view.keystrokes.press(data);
}

function createButton(label: string): ButtonView {
	const button = new ButtonView();

	button.set({ label, withText: true });

	return button;
}

describe('ElementContextMenuView', () => {
	let view: ElementContextMenuView;
	let first: ButtonView;
	let second: ButtonView;

	beforeEach(() => {
		view = new ElementContextMenuView();
		first = createButton('First');
		second = createButton('Second');

		// A view that cannot be focused, e.g. a separator.
		view.items.addMany([first, createPlainView(), second]);
		view.render();
		document.body.append(view.element!);
	});

	afterEach(() => {
		view.element?.remove();
		view.destroy();
	});

	it('renders a menu', () => {
		expect(view.element?.getAttribute('role')).toBe('menu');
		expect(view.element?.classList.contains('ck-elements-context-menu')).toBe(true);
		expect(view.element?.children).toHaveLength(3);
	});

	it('focus() focuses the first focusable item', () => {
		view.focus();

		expect(document.activeElement).toBe(first.element);
	});

	it('moves the focus with the arrow keys and Tab, skipping views that cannot be focused', () => {
		view.focus();

		press(view, keyCodes.arrowdown);
		expect(document.activeElement).toBe(second.element);

		press(view, keyCodes.arrowup);
		expect(document.activeElement).toBe(first.element);

		press(view, keyCodes.tab);
		expect(document.activeElement).toBe(second.element);

		press(view, keyCodes.tab, true);
		expect(document.activeElement).toBe(first.element);
	});

	it('registers items added after rendering', () => {
		const third = createButton('Third');

		view.items.add(third);
		view.focus();
		press(view, keyCodes.arrowup);

		expect(document.activeElement).toBe(third.element);
	});

	it('fires `cancel` on Esc', () => {
		const cancelSpy = vi.fn();

		view.on('cancel', cancelSpy);
		press(view, keyCodes.esc);

		expect(cancelSpy).toHaveBeenCalled();
	});
});
