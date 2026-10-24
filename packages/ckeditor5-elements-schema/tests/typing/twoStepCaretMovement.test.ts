import { keyCodes, _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { pressIn } from '../../../../testUtils/keyboard.js';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('two-step caret movement', () => {
	const { setUp, command, model, editor: currentEditor } = useSchemaCommandsEditor();

	const typeIn = async (data: string, keys: string): Promise<string> => {
		_setModelData(currentEditor().model, data);
		currentEditor().editing.view.focus();
		await userEvent.keyboard(keys);

		return model();
	};

	it('steps into an element at its start, and types there', async () => {
		await setUp();

		expect(await typeIn('<paragraph>a[]<bold>bc</bold></paragraph>', '{ArrowRight}')).toBe(
			'<paragraph>a<bold>[]bc</bold></paragraph>'
		);
		expect(command().isOn).toBe(true);

		await userEvent.keyboard('x');

		expect(model()).toBe('<paragraph>a<bold>x[]bc</bold></paragraph>');
	});

	it('steps out of an element at its end, and types there', async () => {
		await setUp();

		expect(await typeIn('<paragraph><bold>ab[]</bold>c</paragraph>', '{ArrowRight}x')).toBe(
			'<paragraph><bold>ab</bold>x[]c</paragraph>'
		);
		// At the end of the block too.
		expect(await typeIn('<paragraph>a<bold>bc[]</bold></paragraph>', '{ArrowRight}x')).toBe(
			'<paragraph>a<bold>bc</bold>x[]</paragraph>'
		);
	});

	it('steps backward: into an element at its end, out of it at its start', async () => {
		await setUp();

		expect(await typeIn('<paragraph><bold>ab</bold>[]c</paragraph>', '{ArrowLeft}x')).toBe(
			'<paragraph><bold>abx[]</bold>c</paragraph>'
		);
		expect(await typeIn('<paragraph>a<bold>[]bc</bold></paragraph>', '{ArrowLeft}x')).toBe(
			'<paragraph>ax[]<bold>bc</bold></paragraph>'
		);
	});

	it('leaves the typing to the browser where it types at the cursor', async () => {
		const editor = await setUp();
		const prevented: boolean[] = [];

		editor.editing.view.document.on(
			'insertText',
			(evt, data: { domEvent: Event }) => {
				prevented.push(data.domEvent.defaultPrevented);
			},
			{ priority: 'lowest' }
		);

		expect(await typeIn('<paragraph>a[]<bold>bc</bold></paragraph>', 'x')).toBe(
			'<paragraph>ax[]<bold>bc</bold></paragraph>'
		);
		expect(prevented).toEqual([false]);
	});

	it('steps once for each element, in nested ones', async () => {
		const editor = await setUp();
		const editable = editor.ui.getEditableElement()!;

		_setModelData(editor.model, '<paragraph>a[]<bold><italic>b</italic></bold></paragraph>');

		expect(pressIn(editable, keyCodes.arrowright)).toBe(true);
		expect(model()).toBe('<paragraph>a<bold>[]<italic>b</italic></bold></paragraph>');
		expect(pressIn(editable, keyCodes.arrowright)).toBe(true);
		expect(model()).toBe('<paragraph>a<bold><italic>[]b</italic></bold></paragraph>');
	});

	it('leaves the other keys, and the text, to the browser', async () => {
		const editor = await setUp();
		const editable = editor.ui.getEditableElement()!;

		_setModelData(editor.model, '<paragraph>a[]b<bold>c</bold></paragraph>');

		expect(pressIn(editable, keyCodes.arrowright)).toBe(false);
		expect(pressIn(editable, keyCodes.arrowdown)).toBe(false);

		_setModelData(editor.model, '<paragraph>a[]<bold>c</bold></paragraph>');

		expect(pressIn(editable, keyCodes.arrowright, { shiftKey: true })).toBe(false);

		_setModelData(editor.model, '<paragraph>[a]<bold>c</bold></paragraph>');

		expect(pressIn(editable, keyCodes.arrowright)).toBe(false);
	});
});
