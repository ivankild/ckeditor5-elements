import { _getModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('verbatim blocks', () => {
	const { setUp, model, editor: currentEditor } = useSchemaCommandsEditor();

	/**
	 * Sets a verbatim block with the text, and the cursor at the offset (or the text selected from `offset` to `end`),
	 * then presses the keys. The model data of the tests cannot have new lines: its text is normalized.
	 */
	const press = async (text: string, keys: string, offset = text.length, end = offset): Promise<string> => {
		const editor = currentEditor();

		editor.model.change(writer => {
			const root = editor.model.document.getRoot()!;
			const code = writer.createElement('code');

			writer.remove(writer.createRangeIn(root));
			writer.insertText(text, code);
			writer.insert(code, root);
			writer.setSelection(
				writer.createRange(writer.createPositionAt(code, offset), writer.createPositionAt(code, end))
			);
		});
		editor.editing.view.focus();
		await userEvent.keyboard(keys);

		return model();
	};

	it('keep their whitespace in the data, as a `pre`, in the editor too', async () => {
		const editor = await setUp();
		const data = '<pre class="code">if (a) {\n  b();\n}</pre>';

		editor.setData(data);

		expect(editor.getData()).toBe(data);
		expect(_getModelData(editor.model, { withoutSelection: true })).toBe('<code>if (a) {\n  b();\n}</code>');
		expect(editor.ui.getEditableElement()!.innerHTML).toContain(
			'<pre class="code ck-elements-verbatim">if (a) {\n  b();\n}<br></pre>'
		);
	});

	it('get a new line for Enter and Shift+Enter, not a new block', async () => {
		await setUp();

		expect(await press('ab', '{Enter}', 1)).toBe('<code>a\n[]b</code>');
		expect(await press('ab', '{Shift>}{Enter}{/Shift}', 1)).toBe('<code>a\n[]b</code>');
	});

	it('type on the new last line: a `<br>` in the editor makes it a line, where the browser has none', async () => {
		await setUp();

		expect(await press('a', '{Enter}b')).toBe('<code>a\nb[]</code>');
		// An empty block: one line, and no block filler.
		expect(await press('', 'x')).toBe('<code>x[]</code>');
	});

	it('are left by Enter on an empty last line, for a paragraph after them', async () => {
		await setUp();

		expect(await press('a\n', '{Enter}')).toBe('<code>a</code><paragraph>[]</paragraph>');
		// Not in the middle of the text, and not with Shift.
		expect(await press('a\n\nb', '{Enter}', 2)).toBe('<code>a\n\n[]\nb</code>');
		expect(await press('a\n', '{Shift>}{Enter}{/Shift}')).toBe('<code>a\n\n[]</code>');
	});

	it('replace the selected text with the new line', async () => {
		await setUp();

		expect(await press('abcd', '{Enter}', 1, 3)).toBe('<code>a\n[]d</code>');
	});

	it('insert a new line in a list item too: Enter of a verbatim block goes before Enter of a list', async () => {
		const editor = await setUp();

		editor.model.change(writer => {
			const root = editor.model.document.getRoot()!;
			const list = writer.createElement('bullets');
			const item = writer.createElement('item');
			const code = writer.createElement('code');

			writer.remove(writer.createRangeIn(root));
			writer.insertText('ab', code);
			writer.append(code, item);
			writer.append(item, list);
			writer.insert(list, root);
			writer.setSelection(code, 1);
		});
		editor.editing.view.focus();
		await userEvent.keyboard('{Enter}');

		expect(model()).toBe('<bullets><item><code>a\n[]b</code></item></bullets>');
	});
});
