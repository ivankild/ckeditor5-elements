import { _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import type { ElementBlockCommand } from 'ckeditor5-elements-core';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('ElementBlockCommand', () => {
	const { setUp, command, model, child, execute } = useSchemaCommandsEditor();

	it('renames the block with the cursor, and back to a paragraph', async () => {
		await setUp();

		expect(execute('<paragraph>a[]b</paragraph>', 'title')).toBe('<title>a[]b</title>');
		expect(command('title').isOn).toBe(true);
		expect(execute('<title>a[]b</title>', 'title')).toBe('<paragraph>a[]b</paragraph>');
		expect(command('title').isOn).toBe(false);
	});

	it('renames the selected blocks, unless they are all the element', async () => {
		await setUp();

		expect(execute('<title>[a</title><paragraph>b]</paragraph>', 'title')).toBe(
			'<title>[a</title><title>b]</title>'
		);
		expect(execute('<title>[a</title><title>b]</title>', 'title')).toBe(
			'<paragraph>[a</paragraph><paragraph>b]</paragraph>'
		);
	});

	it('renames blocks in containers, and leaves what it cannot rename', async () => {
		await setUp();

		expect(
			execute('<callout><paragraph>[a</paragraph></callout><divider></divider><paragraph>b]</paragraph>', 'title')
		).toBe('<callout><title>[a</title></callout><divider></divider><title>b]</title>');
	});

	it('turns the blocks back into its default element', async () => {
		await setUp();

		(command('title') as ElementBlockCommand).defaultElement = 'callout';

		// A callout cannot hold text: the title stays.
		expect(execute('<title>a[]</title>', 'title')).toBe('<title>a[]</title>');
		expect(command('title').isEnabled).toBe(false);
	});

	it('is disabled on an object, and has a state for an element, e.g. of a context menu', async () => {
		const editor = await setUp();

		_setModelData(editor.model, '[<divider></divider>]<paragraph>a</paragraph>');

		expect(command('title').isEnabled).toBe(false);
		expect(command('title').getState(child(1))).toEqual({ isEnabled: true, isOn: false });

		command('title').executeFor(child(1));

		expect(model()).toBe('[<divider></divider>]<title>a</title>');
	});
});
