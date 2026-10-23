import { ClassicEditor, Paragraph, _getModelData, _setModelData, type ModelElement } from 'ckeditor5';
import { ElementOrPositionCommand } from 'ckeditor5-elements-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ElementsEditing, InsertElementCommand } from '../src/index.js';

describe('ElementsEditing', () => {
	let editor: ClassicEditor;

	beforeEach(async () => {
		const element = document.createElement('div');

		document.body.append(element);

		editor = await ClassicEditor.create({
			attachTo: element,
			licenseKey: 'GPL',
			plugins: [Paragraph, ElementsEditing]
		});
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name', () => {
		expect(ElementsEditing.pluginName).toBe('ElementsEditing');
		expect(editor.plugins.get('ElementsEditing')).toBeInstanceOf(ElementsEditing);
	});

	it('registers the `element` model element as a block object', () => {
		const schema = editor.model.schema;

		expect(schema.isRegistered('element')).toBe(true);
		expect(schema.isObject('element')).toBe(true);
		expect(schema.isBlock('element')).toBe(true);
	});

	it('converts the element to and from `<div class="ck-element">`', () => {
		editor.setData('<div class="ck-element"></div><p>foo</p>');

		expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
			'<element></element><paragraph>foo</paragraph>'
		);
		expect(editor.getData()).toBe('<div class="ck-element">&nbsp;</div><p>foo</p>');
	});

	describe('insertElement command', () => {
		it('is registered and is an element or position command', () => {
			expect(editor.commands.get('insertElement')).toBeInstanceOf(InsertElementCommand);
			expect(editor.commands.get('insertElement')).toBeInstanceOf(ElementOrPositionCommand);
		});

		it('is enabled in a paragraph', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(editor.commands.get('insertElement')?.isEnabled).toBe(true);
		});

		it('is disabled in read-only mode', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(editor.commands.get('insertElement')?.isEnabled).toBe(false);
		});

		it('inserts at the given position, or before the given element', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			const root = editor.model.document.getRoot()!;

			editor.execute('insertElement', editor.model.createPositionAt(root, 'end'));
			expect(_getModelData(editor.model)).toBe(
				'<paragraph>foo</paragraph><paragraph>bar</paragraph>[<element></element>]'
			);

			editor.execute('insertElement', root.getChild(1) as ModelElement);
			expect(_getModelData(editor.model)).toBe(
				'<paragraph>foo</paragraph>[<element></element>]<paragraph>bar</paragraph><element></element>'
			);
		});

		it('does nothing when the given target cannot be used', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			const root = editor.model.document.getRoot()!;

			editor.execute('insertElement', root);
			expect(_getModelData(editor.model)).toBe('<paragraph>fo[]o</paragraph>');

			editor.model.on(
				'canEditAt',
				evt => {
					evt.return = false;
					evt.stop();
				},
				{ priority: 'highest' }
			);

			editor.commands.get('insertElement')!.execute(editor.model.createPositionAt(root, 0));
			expect(_getModelData(editor.model)).toBe('<paragraph>fo[]o</paragraph>');
		});

		it('inserts an element and selects it', () => {
			_setModelData(editor.model, '<paragraph>foo[]</paragraph>');

			editor.execute('insertElement');

			expect(_getModelData(editor.model)).toBe('<paragraph>foo</paragraph>[<element></element>]');
		});
	});
});
