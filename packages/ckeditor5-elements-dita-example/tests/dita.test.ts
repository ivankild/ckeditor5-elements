import { _getModelData, _setModelData, type ClassicEditor } from 'ckeditor5';
import { validateElementSchema, type ElementListCommand } from 'ckeditor5-elements';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createEditor } from '../../../testUtils/editor.js';
import { DITA_PROLOG, ditaConfig, ditaData } from '../src/index.js';
import schema from '../src/schema.json';

describe('the DITA example', () => {
	let editor: ClassicEditor;

	const model = (): string => _getModelData(editor.model, { withoutSelection: true });

	/**
	 * Sets the model, with the selection, and presses the keys in the editor.
	 */
	const press = async (data: string, keys: string): Promise<string> => {
		_setModelData(editor.model, data);
		editor.editing.view.focus();
		await userEvent.keyboard(keys);

		return model();
	};

	beforeEach(async () => {
		editor = await createEditor({ ...ditaConfig, root: { initialData: ditaData } });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a valid element schema, with the paragraph of CKEditor as `p`', () => {
		expect(validateElementSchema(schema, { external: { paragraph: { type: 'block', isInline: false } } })).toEqual(
			[]
		);
	});

	describe('the data', () => {
		it('is the topic, saved as it is loaded, with its `id`', () => {
			expect(editor.getData()).toBe(ditaData);
			expect(ditaData.startsWith(`${DITA_PROLOG}<topic id="editing-dita">`)).toBe(true);
		});

		it('is the elements of the model, by their DITA names', () => {
			expect(model()).toContain(
				'<title>A topic in Lightweight DITA</title><shortdesc>This topic is <b>XDITA</b>'
			);
			expect(model()).toContain('<ul><li><paragraph>Put the cursor here');
			expect(model()).toContain('<note type="tip"><paragraph>');
			expect(model()).toContain('<xref href="https://www.oasis-open.org/committees/dita/">DITA</xref>');
		});
	});

	describe('the elements', () => {
		it('keep a list to its items, and sections in the body', () => {
			const schema = editor.model.schema;

			expect(schema.checkChild(['$root', 'body', 'ul'], 'paragraph')).toBe(false);
			expect(schema.checkChild(['$root', 'body', 'ul'], 'li')).toBe(true);
			expect(schema.checkChild(['$root'], 'section')).toBe(false);
			expect(schema.checkChild(['$root', 'body'], 'section')).toBe(true);
		});

		it('make the next list item for Enter, and leave the list in an empty one', async () => {
			expect(await press('<body><ul><li><paragraph>a[]</paragraph></li></ul></body>', '{Enter}b')).toBe(
				'<body><ul><li><paragraph>a</paragraph></li><li><paragraph>b</paragraph></li></ul></body>'
			);
			expect(
				await press(
					'<body><ul><li><paragraph>a</paragraph></li><li><paragraph>[]</paragraph></li></ul></body>',
					'{Enter}'
				)
			).toBe('<body><ul><li><paragraph>a</paragraph></li></ul><paragraph></paragraph></body>');
		});

		it('keep the whitespace of `pre`, where Enter inserts a new line', async () => {
			await press('<body><pre>a[]</pre></body>', '{Enter}b');

			expect(editor.getData()).toContain('<pre>a\nb</pre>');
		});

		it('make lists with their commands, and switch them', () => {
			_setModelData(editor.model, '<body><paragraph>[a</paragraph><paragraph>b]</paragraph></body>');
			editor.execute('ul');

			expect(model()).toBe(
				'<body><ul><li><paragraph>a</paragraph></li><li><paragraph>b</paragraph></li></ul></body>'
			);

			editor.execute('ol');

			expect(model()).toBe(
				'<body><ol><li><paragraph>a</paragraph></li><li><paragraph>b</paragraph></li></ol></body>'
			);
			expect((editor.commands.get('ol') as unknown as ElementListCommand).isOn).toBe(true);
		});
	});

	describe('the features', () => {
		it('show the path of the DITA elements in the breadcrumbs', () => {
			_setModelData(editor.model, '<body><section><ul><li><paragraph>a[]</paragraph></li></ul></section></body>');

			expect(editor.plugins.get('Breadcrumbs').items.map(item => item.label)).toEqual([
				'body',
				'section',
				'ul',
				'li',
				'p'
			]);
		});

		it('have the buttons of the toolbar, and mark the editable for the styles', () => {
			for (const name of [
				'title',
				'shortdesc',
				'section',
				'ul',
				'ol',
				'note',
				'pre',
				'b',
				'i',
				'u',
				'sourceEditing'
			]) {
				expect([name, editor.ui.componentFactory.has(name)]).toEqual([name, true]);
			}

			expect(editor.ui.getEditableElement()!.classList.contains('dita')).toBe(true);
		});
	});
});
