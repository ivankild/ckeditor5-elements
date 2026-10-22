import { ButtonView, Paragraph, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ElementClipboard from '../../src/clipboard/elementClipboard.js';
import { createElementClipboardItems } from '../../src/clipboard/elementClipboardItems.js';
import { createEditor } from '../../../../testUtils/editor.js';

describe('createElementClipboardItems()', () => {
	let editor: ClassicEditor;

	const paragraph = (): ModelElement => editor.model.document.getRoot()!.getChild(0) as ModelElement;

	afterEach(async () => {
		await editor.destroy();
	});

	it('creates a menu button per clipboard command', async () => {
		editor = await createEditor({ plugins: [Paragraph, ElementClipboard] });

		const buttons = createElementClipboardItems(paragraph(), editor);

		expect(buttons.map(button => button.label)).toEqual(['Copy', 'Cut', 'Paste', 'Paste before', 'Paste after']);
		expect(buttons.every(button => button instanceof ButtonView && button.withText)).toBe(true);
		expect(buttons.every(button => button.role === 'menuitem')).toBe(true);
	});

	it('binds the buttons to the commands', async () => {
		editor = await createEditor({ plugins: [Paragraph, ElementClipboard] });
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

		const [copy, cut] = createElementClipboardItems(paragraph(), editor);

		editor.enableReadOnlyMode('test');

		expect(copy.isEnabled).toBe(true);
		expect(cut.isEnabled).toBe(false);
	});

	it('executes the command with the element', async () => {
		editor = await createEditor({ plugins: [Paragraph, ElementClipboard] });

		const executeSpy = vi.spyOn(editor, 'execute').mockReturnValue(Promise.resolve());
		const buttons = createElementClipboardItems(paragraph(), editor);

		buttons[4]?.fire('execute');

		expect(executeSpy).toHaveBeenCalledWith('pasteElementAfter', paragraph());
	});

	it('skips the commands that are not registered', async () => {
		editor = await createEditor({ plugins: [Paragraph] });

		expect(createElementClipboardItems(paragraph(), editor)).toEqual([]);
	});
});
