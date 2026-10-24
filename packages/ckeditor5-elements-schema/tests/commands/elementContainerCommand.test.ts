import { _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('ElementContainerCommand', () => {
	const { setUp, command, child, execute } = useSchemaCommandsEditor();

	it('wraps the block with the cursor, and unwraps the element', async () => {
		await setUp();

		expect(execute('<paragraph>a[]</paragraph>', 'callout')).toBe('<callout><paragraph>a[]</paragraph></callout>');
		expect(command('callout').isOn).toBe(true);
		expect(execute('<callout><paragraph>a[]</paragraph><paragraph>b</paragraph></callout>', 'callout')).toBe(
			'<paragraph>a[]</paragraph><paragraph>b</paragraph>'
		);
	});

	it('wraps the selected blocks, or their ancestors in the parent they share', async () => {
		await setUp();

		expect(execute('<paragraph>[a</paragraph><paragraph>b]</paragraph><paragraph>c</paragraph>', 'callout')).toBe(
			'<callout><paragraph>[a</paragraph><paragraph>b]</paragraph></callout><paragraph>c</paragraph>'
		);
		expect(execute('<title>[a</title><callout><paragraph>b]</paragraph></callout>', 'callout')).toBe(
			'<callout><title>[a</title><callout><paragraph>b]</paragraph></callout></callout>'
		);
	});

	it('wraps a selected object', async () => {
		await setUp();

		expect(execute('[<divider></divider>]', 'callout')).toBe('<callout>[<divider></divider>]</callout>');
	});

	it('is disabled where there is no block, and has a state for an element', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '<paragraph>a<bold>b</bold></paragraph>');

		expect(command('callout').getState(editor.model.createPositionAt(editor.model.document.getRoot()!, 0))).toEqual(
			{
				isEnabled: false,
				isOn: false
			}
		);
		// The block of an inline element.
		expect(command('callout').getState(child(0, 1))).toEqual({ isEnabled: true, isOn: false });
	});
});
