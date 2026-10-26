import { _setModelData } from 'ckeditor5';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('ElementInlineCommand', () => {
	const { setUp, command, model, child, execute } = useSchemaCommandsEditor();

	describe('on selected text', () => {
		it('wraps the text', async () => {
			await setUp();

			expect(execute('<paragraph>a[bc]d</paragraph>')).toBe('<paragraph>a<bold>[bc]</bold>d</paragraph>');
			expect(command().isOn).toBe(true);
		});

		it('wraps the text that is not in the element, and merges the elements next to it', async () => {
			await setUp();

			expect(execute('<paragraph>a[b<bold>c]d</bold></paragraph>')).toBe(
				'<paragraph>a<bold>[bc]d</bold></paragraph>'
			);
			expect(execute('<paragraph><bold>a[b</bold>x<bold>c]d</bold></paragraph>')).toBe(
				'<paragraph><bold>a[bxc]d</bold></paragraph>'
			);
		});

		it('unwraps the whole elements when all the text is in them', async () => {
			await setUp();

			expect(command().isOn).toBe(false);
			expect(execute('<paragraph><bold>a[b]c</bold></paragraph>')).toBe('<paragraph>a[b]c</paragraph>');
			expect(execute('<paragraph><bold>a[b</bold><bold>c]d</bold></paragraph>')).toBe(
				'<paragraph>a[bc]d</paragraph>'
			);
		});

		it('wraps the text of each block, across blocks', async () => {
			await setUp();

			expect(execute('<paragraph>a[b</paragraph><paragraph>c</paragraph><paragraph>d]e</paragraph>')).toBe(
				'<paragraph>a<bold>[b</bold></paragraph><paragraph><bold>c</bold></paragraph>' +
					'<paragraph><bold>d]</bold>e</paragraph>'
			);
		});

		it('wraps in other inline elements and next to them', async () => {
			await setUp();

			expect(execute('<paragraph><italic>a[b</italic>c]</paragraph>')).toBe(
				'<paragraph><italic>a<bold>[b</bold></italic><bold>c]</bold></paragraph>'
			);
		});

		it('keeps a backward selection backward', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '<paragraph>a[bc]d</paragraph>', { lastRangeBackward: true });
			editor.execute('bold');

			expect(editor.model.document.selection.isBackward).toBe(true);

			editor.execute('bold');

			expect(editor.model.document.selection.isBackward).toBe(true);
		});

		it('is disabled where there is no text for the element', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '[<divider></divider><divider></divider>]');

			expect(command().isEnabled).toBe(false);
		});
	});

	describe('on the cursor', () => {
		it('inserts an empty element with the cursor in it, and the text typed there goes in it', async () => {
			const editor = await setUp();

			expect(execute('<paragraph>a[]b</paragraph>')).toBe('<paragraph>a<bold>[]</bold>b</paragraph>');
			expect(command().isOn).toBe(true);

			editor.execute('insertText', { text: 'x' });

			expect(model()).toBe('<paragraph>a<bold>x[]</bold>b</paragraph>');
		});

		it('types in the new element with the keyboard of the browser', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '<paragraph>a[]b</paragraph>');
			editor.editing.view.focus();
			editor.execute('bold');
			await userEvent.keyboard('xy');

			expect(model()).toBe('<paragraph>a<bold>xy[]</bold>b</paragraph>');
		});

		it('removes an empty element', async () => {
			await setUp();

			expect(execute('<paragraph>a<bold>[]</bold>b</paragraph>')).toBe('<paragraph>a[]b</paragraph>');
		});

		it('moves the cursor out of the element at its end or start, so that what is typed next is out of it', async () => {
			const editor = await setUp();

			expect(execute('<paragraph><bold>ab[]</bold>c</paragraph>')).toBe(
				'<paragraph><bold>ab</bold>[]c</paragraph>'
			);
			expect(command().isOn).toBe(false);

			editor.execute('insertText', { text: 'x' });

			expect(model()).toBe('<paragraph><bold>ab</bold>x[]c</paragraph>');
			expect(execute('<paragraph>a<bold>[]bc</bold></paragraph>')).toBe(
				'<paragraph>a[]<bold>bc</bold></paragraph>'
			);
		});

		it('unwraps the element in the middle of it', async () => {
			await setUp();

			expect(execute('<paragraph><bold>a[]b</bold></paragraph>')).toBe('<paragraph>a[]b</paragraph>');
		});

		it('is disabled where the element cannot be', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '<divider></divider>');
			editor.model.change(writer => {
				writer.setSelection(editor.model.document.getRoot()!, 0);
			});

			expect(command().isEnabled).toBe(false);
		});
	});

	describe('on an element', () => {
		it('unwraps the selected element, and selects its text', async () => {
			await setUp();

			expect(execute('<paragraph>a[<bold>bc</bold>]d</paragraph>')).toBe('<paragraph>a[bc]d</paragraph>');
		});

		it('wraps a selected inline object, and keeps it selected', async () => {
			await setUp();

			expect(execute('<paragraph>a[<mention></mention>]</paragraph>')).toBe(
				'<paragraph>a<bold>[<mention></mention>]</bold></paragraph>'
			);
		});

		it('has a state and executes for an element, e.g. of a context menu', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '<paragraph>[]a<bold>b</bold></paragraph>');

			expect(command().getState(child(0, 1))).toEqual({ isEnabled: true, isOn: true });
			// A block cannot be in the element.
			expect(command().getState(child(0))).toEqual({ isEnabled: false, isOn: false });

			command().executeFor(child(0, 1));

			expect(model()).toBe('<paragraph>[]ab</paragraph>');
		});
	});

	it('looks at the selected text once, for both its state and whether it is on', async () => {
		const editor = await setUp();
		const bold = command('bold') as unknown as Record<'_getWrapRanges' | '_getElementsIn', () => unknown>;
		const getWrapRanges = vi.spyOn(bold, '_getWrapRanges');
		const getElementsIn = vi.spyOn(bold, '_getElementsIn');

		for (const data of [
			'<paragraph>[ab</paragraph><paragraph>cd]</paragraph>',
			'<paragraph><bold>[ab</bold></paragraph><paragraph><bold>cd]</bold></paragraph>'
		]) {
			_setModelData(editor.model, data);
			getWrapRanges.mockClear();
			getElementsIn.mockClear();
			command('bold').refresh();

			expect([getWrapRanges.mock.calls.length, getElementsIn.mock.calls.length]).toEqual(
				data.includes('<bold>') ? [1, 1] : [1, 0]
			);
		}
	});
});
