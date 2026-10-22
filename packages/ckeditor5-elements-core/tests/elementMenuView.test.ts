import { ButtonView, keyCodes, type KeystrokeInfo } from 'ckeditor5';
import { createPlainView } from '../../../testUtils/editor.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ElementMenuView from '../src/elementMenuView.js';

function press(view: ElementMenuView, keyCode: number, shiftKey = false): void {
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

describe('ElementMenuView', () => {
	let view: ElementMenuView;
	let first: ButtonView;
	let second: ButtonView;

	beforeEach(() => {
		view = new ElementMenuView();
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
		expect(view.element?.classList.contains('ck-elements-menu')).toBe(true);
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

	it('has no accessible name unless given', () => {
		expect(view.element?.hasAttribute('aria-label')).toBe(false);

		const named = new ElementMenuView(undefined, { label: 'Element menu' });

		named.render();
		expect(named.element?.getAttribute('aria-label')).toBe('Element menu');
		named.destroy();
	});

	it('prevents the native context menu in it', () => {
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

		first.element!.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
	});
});
