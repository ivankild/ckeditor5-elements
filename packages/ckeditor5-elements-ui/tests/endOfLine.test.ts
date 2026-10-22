import { Bold, Paragraph, type ClassicEditor } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import EndOfLine from '../src/endOfLine.js';
import EndOfLineView from '../src/endOfLineView.js';
import { createEditor } from '../../../testUtils/editor.js';

describe('EndOfLine', () => {
	let editor: ClassicEditor;

	beforeEach(async () => {
		editor = await createEditor({
			plugins: [Paragraph, Bold, EndOfLine],
			toolbar: { items: ['bold', '#', 'bold'], shouldNotGroupWhenFull: true }
		});
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name', () => {
		expect(EndOfLine.pluginName).toBe('EndOfLine');
	});

	it('registers the `#` component', () => {
		expect(editor.ui.componentFactory.create('#')).toBeInstanceOf(EndOfLineView);
	});

	it('can be placed in a toolbar', () => {
		const items = Array.from(editor.ui.view.toolbar.items);

		expect(items).toHaveLength(3);
		expect(items[1]).toBeInstanceOf(EndOfLineView);
	});

	it('renders an empty element hidden from assistive technologies', () => {
		const view = new EndOfLineView();

		view.render();

		expect(view.element?.tagName).toBe('SPAN');
		expect(view.element?.classList.contains('ck-elements-end-of-line')).toBe(true);
		expect(view.element?.getAttribute('aria-hidden')).toBe('true');
		expect(view.element?.childNodes).toHaveLength(0);

		view.destroy();
	});
});
