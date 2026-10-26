import { _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import ElementListCommand from '../../src/commands/elementListCommand.js';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('ElementListCommand', () => {
	const { setUp, command, model, execute } = useSchemaCommandsEditor();

	it('is the command of a list, with the name of its item', async () => {
		await setUp();

		expect(command('bullets')).toBeInstanceOf(ElementListCommand);
		expect((command('bullets') as ElementListCommand).itemName).toBe('item');
		expect(command('bullets').isToggleable).toBe(true);
	});

	it('makes a list of the selected blocks, each in an item, and unwraps it', async () => {
		await setUp();

		expect(execute('<paragraph>[a</paragraph><paragraph>b]</paragraph>', 'bullets')).toBe(
			'<bullets><item><paragraph>[a</paragraph></item><item><paragraph>b]</paragraph></item></bullets>'
		);
		expect(command('bullets').isOn).toBe(true);
		expect(command('numbers').isOn).toBe(false);

		expect(execute(model(), 'bullets')).toBe('<paragraph>[a</paragraph><paragraph>b]</paragraph>');
	});

	it('turns a list with the same items into its own', async () => {
		await setUp();

		expect(execute('<bullets><item><paragraph>a[]</paragraph></item></bullets>', 'numbers')).toBe(
			'<numbers><item><paragraph>a[]</paragraph></item></numbers>'
		);
	});

	it('is disabled where there is no block for a list', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '<paragraph>[]a</paragraph>');

		expect(command('bullets').getState(editor.model.createPositionAt(editor.model.document.getRoot()!, 0))).toEqual(
			{
				isEnabled: false,
				isOn: false
			}
		);
		expect(command('bullets').isEnabled).toBe(true);
	});
});
