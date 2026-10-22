import { Paragraph, _getModelData, _setModelData, type ButtonView, type ClassicEditor } from 'ckeditor5';
import ElementsEditing from '../src/elementsEditing.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ElementButtonView from '../src/elementButtonView.js';
import ElementCommand from '../src/elementCommand.js';
import { Elements, ElementsUI } from '../src/index.js';
import { createEditor } from '../../../testUtils/editor.js';

describe('Elements and ElementsUI', () => {
	let editor: ClassicEditor;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Elements] });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('Elements loads the core and the UI plugins', () => {
		expect(Elements.pluginName).toBe('Elements');
		expect(editor.plugins.get('ElementsEditing')).toBeInstanceOf(ElementsEditing);
		expect(editor.plugins.get('ElementsUI')).toBeInstanceOf(ElementsUI);
	});

	it('registers the `element` command', () => {
		const command = editor.commands.get('element');

		expect(command).toBeInstanceOf(ElementCommand);
		expect(command?.title).toBe('Element');
		expect(command?.icon).toContain('<svg');
	});

	it('registers the `element` button', () => {
		const button = editor.ui.componentFactory.create('element');

		expect(button).toBeInstanceOf(ElementButtonView);
		button.destroy();
	});

	describe('insertElement button', () => {
		let button: ButtonView;

		beforeEach(() => {
			button = editor.ui.componentFactory.create('insertElement') as ButtonView;
			button.render();
		});

		afterEach(() => {
			button.destroy();
		});

		it('has a label, an icon and a tooltip', () => {
			expect(button.label).toBe('Insert element');
			expect(button.icon).toContain('<svg');
			expect(button.tooltip).toBe(true);
		});

		it('follows the command state', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			expect(button.isEnabled).toBe(true);

			editor.enableReadOnlyMode('test');
			expect(button.isEnabled).toBe(false);
		});

		it('inserts an element and focuses the editor', () => {
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');

			_setModelData(editor.model, '<paragraph>foo[]</paragraph>');
			button.element!.click();

			expect(_getModelData(editor.model)).toBe('<paragraph>foo</paragraph>[<element></element>]');
			expect(focusSpy).toHaveBeenCalled();
		});
	});
});
