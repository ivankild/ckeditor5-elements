import { _setModelData } from 'ckeditor5';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { useSchemaCommandsEditor } from '../schemaCommandsEditor.js';

describe('lists', () => {
	const { setUp, model, editor: currentEditor } = useSchemaCommandsEditor();

	const press = async (data: string, keys = '{Enter}'): Promise<string> => {
		_setModelData(currentEditor().model, data);
		currentEditor().editing.view.focus();
		await userEvent.keyboard(keys);

		return model();
	};

	it('hold only their items, which are only in their lists', async () => {
		const editor = await setUp();
		const schema = editor.model.schema;

		expect(schema.checkChild(['$root', 'bullets'], 'item')).toBe(true);
		expect(schema.checkChild(['$root', 'bullets'], 'paragraph')).toBe(false);
		expect(schema.checkChild(['$root', 'bullets', 'item'], 'paragraph')).toBe(true);
		expect(schema.checkChild(['$root'], 'item')).toBe(false);
		expect(schema.checkChild(['$root', 'callout'], 'item')).toBe(false);
	});

	it('get the next item for Enter, with what follows the cursor', async () => {
		await setUp();

		expect(await press('<bullets><item><paragraph>ab[]cd</paragraph></item></bullets>')).toBe(
			'<bullets><item><paragraph>ab</paragraph></item><item><paragraph>[]cd</paragraph></item></bullets>'
		);
	});

	it('are left by Enter in an empty item, which becomes a paragraph after the list', async () => {
		await setUp();

		expect(
			await press(
				'<bullets><item><paragraph>a</paragraph></item><item><paragraph>[]</paragraph></item></bullets>'
			)
		).toBe('<bullets><item><paragraph>a</paragraph></item></bullets><paragraph>[]</paragraph>');
		// The only item: the list goes away.
		expect(await press('<bullets><item><paragraph>[]</paragraph></item></bullets>')).toBe(
			'<paragraph>[]</paragraph>'
		);
	});

	it('are split by Enter in an empty item in the middle', async () => {
		await setUp();

		expect(
			await press(
				'<numbers><item><paragraph>a</paragraph></item><item><paragraph>[]</paragraph></item>' +
					'<item><paragraph>c</paragraph></item></numbers>'
			)
		).toBe(
			'<numbers><item><paragraph>a</paragraph></item></numbers><paragraph>[]</paragraph>' +
				'<numbers><item><paragraph>c</paragraph></item></numbers>'
		);
	});

	it('leave Shift+Enter, and Enter in a verbatim block of an item, as they are', async () => {
		await setUp();

		expect(
			await press('<bullets><item><paragraph>a[]</paragraph></item></bullets>', '{Shift>}{Enter}{/Shift}')
		).toBe('<bullets><item><paragraph>a<softBreak></softBreak>[]</paragraph></item></bullets>');
		expect(await press('<bullets><item><code>a[]</code></item></bullets>')).toBe(
			'<bullets><item><code>a\n[]</code></item></bullets>'
		);
	});
});
