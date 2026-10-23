import { _getModelData, _setModelData, type ClassicEditor } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import { exampleConfig, exampleData } from '../src/index.js';

describe('the full example', () => {
	let editor: ClassicEditor;

	beforeEach(async () => {
		editor = await createEditor({ ...exampleConfig, root: { initialData: exampleData } });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has all the features', () => {
		for (const name of [
			'Note',
			'ElementContextMenu',
			'ElementClipboard',
			'ElementActions',
			'ElementToolbar',
			'QuickInsert',
			'Breadcrumbs'
		] as const) {
			expect([name, editor.plugins.has(name)]).toEqual([name, true]);
		}
	});

	it('keeps its data', () => {
		// CKEditor gives list items ids.
		expect(editor.getData().replace(/ data-list-item-id="\w+"/g, '')).toBe(exampleData);
	});

	describe('Note', () => {
		it('`note` wraps blocks with a note, and unwraps any note', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');

			editor.execute('note');
			expect(_getModelData(editor.model)).toBe('<note><paragraph>a[]</paragraph></note>');

			_setModelData(editor.model, '<note type="warning"><paragraph>a[]</paragraph></note>');
			expect(editor.commands.get('note')?.isOn).toBe(true);

			editor.execute('note');
			expect(_getModelData(editor.model)).toBe('<paragraph>a[]</paragraph>');
		});

		it('`warning` wraps blocks with a warning, which is a note of the `warning` type', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');

			editor.execute('warning');

			expect(_getModelData(editor.model)).toBe('<note type="warning"><paragraph>a[]</paragraph></note>');
			expect(editor.getData()).toBe('<aside class="note warning"><p>a</p></aside>');
		});

		it('`warning` is off in a note of another type', () => {
			_setModelData(editor.model, '<note><paragraph>a[]</paragraph></note>');

			expect(editor.commands.get('warning')?.isOn).toBe(false);
		});
	});

	it('quick insert lists the blocks between blocks, without tables', () => {
		_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b</paragraph>');

		const position = editor.model.createPositionAt(editor.model.document.getRoot()!, 1);
		const labels = editor.plugins
			.get('QuickInsert')
			.getItems(position)
			.map(item => item.label);

		expect(labels).toEqual(
			expect.arrayContaining(['Paragraph', 'Heading 1', 'Note', 'Block quote', 'Horizontal line'])
		);
		expect(labels).not.toContain('table');
	});
});
