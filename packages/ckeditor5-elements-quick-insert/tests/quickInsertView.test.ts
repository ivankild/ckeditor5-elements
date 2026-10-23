import { keyCodes, type Locale, type ClassicEditor, Paragraph } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuickInsertListView from '../src/quickInsertListView.js';
import QuickInsertView from '../src/quickInsertView.js';
import { createEditor } from '../../../testUtils/editor.js';
import { keystroke } from '../../../testUtils/keyboard.js';

const items = [
	{ name: 'paragraph', label: 'Paragraph' },
	{ name: 'heading1', label: 'Heading 1' },
	{ name: 'heading2', label: 'Heading 2' }
];

describe('QuickInsert views', () => {
	let editor: ClassicEditor;
	let locale: Locale;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph] });
		locale = editor.locale;
	});

	afterEach(async () => {
		await editor.destroy();
	});

	describe('QuickInsertListView', () => {
		let view: QuickInsertListView;

		beforeEach(() => {
			view = new QuickInsertListView(locale, items);
			view.render();
		});

		afterEach(() => {
			view.destroy();
		});

		it('renders a button per item', () => {
			expect(view.role).toBe('listbox');
			expect(view.element?.querySelectorAll('.ck-button')).toHaveLength(3);
			expect(view.element?.textContent).toContain('Heading 1');
		});

		it('fires `execute` with the element name', () => {
			const executeSpy = vi.fn();

			view.on('execute', executeSpy);
			view.element!.querySelectorAll('button')[1].click();

			expect(executeSpy).toHaveBeenCalledWith(expect.anything(), { value: 'heading1' });
		});

		it('filters by label and by name', () => {
			expect(view.filter(/head/i)).toEqual({ resultsCount: 2, totalItemsCount: 3 });
			expect(view.getFirstVisibleItem()?.name).toBe('heading1');

			expect(view.filter(/heading2/)).toEqual({ resultsCount: 1, totalItemsCount: 3 });

			expect(view.filter(/nothing/)).toEqual({ resultsCount: 0, totalItemsCount: 3 });
			expect(view.getFirstVisibleItem()).toBeNull();

			expect(view.filter(null)).toEqual({ resultsCount: 3, totalItemsCount: 3 });
		});
	});

	describe('QuickInsertView', () => {
		let view: QuickInsertView;

		beforeEach(() => {
			view = new QuickInsertView(locale, items);
			view.render();
			document.body.append(view.element!);
			view.focus();
		});

		afterEach(() => {
			view.element?.remove();
			view.destroy();
		});

		it('has a search field and the list', () => {
			expect(view.element?.classList.contains('ck-elements-quick-insert')).toBe(true);
			expect(view.queryView.fieldView.element?.tagName).toBe('INPUT');
			expect(view.filteredView).toBe(view.listView);
		});

		it('filters the list when searching', () => {
			view.search('head');

			expect(view.resultsCount).toBe(2);
			expect(view.totalItemsCount).toBe(3);
		});

		it('chooses the first matching item on Enter in the search field', () => {
			const executeSpy = vi.fn();

			view.on('execute', executeSpy);
			view.search('head');
			view.keystrokes.press(keystroke(keyCodes.enter));

			expect(executeSpy).toHaveBeenCalledWith(expect.anything(), { value: 'heading1' });
		});

		it('does nothing on Enter when nothing matches', () => {
			const executeSpy = vi.fn();

			view.on('execute', executeSpy);
			view.search('nothing');
			view.keystrokes.press(keystroke(keyCodes.enter));

			expect(executeSpy).not.toHaveBeenCalled();
		});

		it('moves the focus to the list on the down arrow in the search field', () => {
			view.keystrokes.press(keystroke(keyCodes.arrowdown));

			expect(document.activeElement?.textContent).toBe('Paragraph');
		});

		it('leaves the arrow keys to the list when the list is focused', () => {
			view.listView.focusFirst();

			const data = keystroke(keyCodes.arrowdown);

			view.keystrokes.press(data);

			expect(document.activeElement?.textContent).toBe('Paragraph');
		});
	});
});
