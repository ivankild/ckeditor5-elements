import { _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('ElementInsertCommand', () => {
	const { setUp, command, model, child, execute } = useSchemaCommandsEditor();

	it('inserts a block-level element after the block, or splits it, and selects it', async () => {
		await setUp();

		expect(execute('<paragraph>a[]</paragraph>', 'divider')).toBe('<paragraph>a</paragraph>[<divider></divider>]');
		expect(execute('<paragraph>a[]b</paragraph>', 'divider')).toBe(
			'<paragraph>a</paragraph>[<divider></divider>]<paragraph>b</paragraph>'
		);
		expect(command('divider').isOn).toBe(false);
	});

	it('inserts an inline object in place of the selection, and selects it', async () => {
		await setUp();

		expect(execute('<paragraph>a[bc]d</paragraph>', 'mention')).toBe(
			'<paragraph>a[<mention></mention>]d</paragraph>'
		);
	});

	it('inserts an inline container with a paragraph and the cursor in it', async () => {
		await setUp();

		expect(execute('<paragraph>a[]b</paragraph>', 'chip')).toBe(
			'<paragraph>a<chip><paragraph>[]</paragraph></chip>b</paragraph>'
		);
	});

	it('inserts at a position, or after an element', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '<paragraph>[]a</paragraph><paragraph>b</paragraph>');
		command('divider').executeFor(child(0));

		expect(model()).toBe('<paragraph>a</paragraph>[<divider></divider>]<paragraph>b</paragraph>');

		command('mention').executeFor(editor.model.createPositionAt(child(2), 1));

		expect(model()).toBe(
			'<paragraph>a</paragraph><divider></divider><paragraph>b[<mention></mention>]</paragraph>'
		);
	});

	it('ignores a target that is not in the document', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '<paragraph>[]a</paragraph><paragraph>b</paragraph>');

		const removed = child(1);

		editor.model.change(writer => {
			writer.remove(removed);
		});
		command('divider').execute(removed);

		expect(model()).toBe('<paragraph>[]a</paragraph>');
	});

	it('is disabled where the element cannot be', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '<paragraph>[]a</paragraph>');

		expect(command('mention').getState(editor.model.createPositionAt(editor.model.document.getRoot()!, 0))).toEqual(
			{
				isEnabled: false,
				isOn: false
			}
		);
		expect(command('mention').isEnabled).toBe(true);
	});
});
