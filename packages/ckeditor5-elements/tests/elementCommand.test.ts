import { Bold, Paragraph, _getModelData, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import ElementsEditing from '../src/elementsEditing.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ElementCommand from '../src/elementCommand.js';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('ElementCommand', () => {
	let editor: ClassicEditor;
	let command: ElementCommand;

	const getData = (): string => _getModelData(editor.model);
	const root = (): ModelElement => editor.model.document.getRoot()!;
	const child = (index: number): ModelElement => root().getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Bold, Container, ElementsEditing] });

		command = new ElementCommand(editor);
		command.elementName = 'container';
		editor.commands.add('container', command);
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has default observable properties', () => {
		const defaults = new ElementCommand(editor);

		expect(defaults.isOn).toBe(false);
		expect(defaults.icon).toBeUndefined();
		expect(defaults.title).toBe('');
		expect(defaults.tooltip).toBe(true);
		expect(defaults.elementName).toBe('element');
		expect(defaults.elementAttributes).toEqual({});
	});

	describe('refresh()', () => {
		it('is off and enabled in a paragraph', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(command.isOn).toBe(false);
			expect(command.isEnabled).toBe(true);
		});

		it('is on and enabled inside a matching element', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			expect(command.isOn).toBe(true);
			expect(command.isEnabled).toBe(true);
		});

		it('ignores text attributes', () => {
			_setModelData(
				editor.model,
				'<container><paragraph><$text bold="true">fo[]o</$text></paragraph></container>'
			);

			expect(command.isOn).toBe(true);
		});

		it('uses the selected element', () => {
			_setModelData(editor.model, '<container>[<element></element>]</container>');

			expect(command.isOn).toBe(true);
		});

		it('uses the given position instead of the selection', () => {
			_setModelData(
				editor.model,
				'<paragraph>fo[]o</paragraph><container><paragraph>bar</paragraph></container>'
			);

			command.refresh(editor.model.createPositionAt(child(1).getChild(0) as ModelElement, 0));

			expect(command.isOn).toBe(true);
		});

		it('uses the given element instead of the selection', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>'
			);

			command.refresh(child(1));

			expect(command.isOn).toBe(false);
		});

		it('is disabled when the schema does not allow wrapping', () => {
			command.elementName = 'element';
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			command.refresh();

			expect(command.isEnabled).toBe(false);
		});

		it('is disabled when the schema does not allow unwrapping', () => {
			_setModelData(editor.model, '<container><containerItem>fo[]o</containerItem></container>');

			expect(command.isOn).toBe(true);
			expect(command.isEnabled).toBe(false);
		});

		it('is disabled for a position directly in the root', () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>');

			command.refresh(editor.model.createPositionAt(root(), 0));

			expect(command.isEnabled).toBe(false);
		});

		it('is disabled in read-only mode', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(command.isEnabled).toBe(false);
		});
	});

	describe('execute()', () => {
		it('wraps the paragraph at the selection', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			editor.execute('container');

			expect(getData()).toBe('<container><paragraph>fo[]o</paragraph></container>');
			expect(command.isOn).toBe(true);
		});

		it('unwraps the closest matching element', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>fo[]o</paragraph><paragraph>bar</paragraph></container>'
			);

			editor.execute('container');

			expect(getData()).toBe('<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');
			expect(command.isOn).toBe(false);
		});

		it('wraps the selected element', () => {
			_setModelData(editor.model, '[<element></element>]');

			editor.execute('container');

			expect(getData()).toBe('<container>[<element></element>]</container>');
		});

		it('wraps at the given position', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			command.execute(editor.model.createPositionAt(child(1), 0));

			expect(getData()).toBe('<paragraph>fo[]o</paragraph><container><paragraph>bar</paragraph></container>');
		});

		it('wraps the given element', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			command.execute(child(1));

			expect(getData()).toBe('<paragraph>fo[]o</paragraph><container><paragraph>bar</paragraph></container>');
		});

		it('does nothing when the schema does not allow wrapping', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			command.elementName = 'element';

			command.execute(child(0));

			expect(getData()).toBe('<paragraph>fo[]o</paragraph>');
		});

		it('does nothing when the schema does not allow unwrapping', () => {
			_setModelData(editor.model, '<container><containerItem>fo[]o</containerItem></container>');

			command.execute(child(0).getChild(0) as ModelElement);

			expect(getData()).toBe('<container><containerItem>fo[]o</containerItem></container>');
		});

		it('does nothing for a position directly in the root', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			command.execute(editor.model.createPositionAt(root(), 0));

			expect(getData()).toBe('<paragraph>fo[]o</paragraph>');
		});

		it('does nothing when the target cannot be edited', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			editor.model.on(
				'canEditAt',
				evt => {
					evt.return = false;
					evt.stop();
				},
				{ priority: 'highest' }
			);

			command.execute(child(1));

			expect(getData()).toBe('<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');
		});
	});

	describe('element attributes', () => {
		beforeEach(() => {
			command.elementAttributes = { type: 'note' };
		});

		it('matches only elements with the same attribute values', () => {
			_setModelData(editor.model, '<container type="note"><paragraph>fo[]o</paragraph></container>');
			expect(command.isOn).toBe(true);

			_setModelData(editor.model, '<container type="tip"><paragraph>fo[]o</paragraph></container>');
			expect(command.isOn).toBe(false);

			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			expect(command.isOn).toBe(false);
		});

		it('sets the attributes on new elements', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			editor.execute('container');

			expect(getData()).toBe('<container type="note"><paragraph>fo[]o</paragraph></container>');
		});

		it('isElement() checks the name and the attributes', () => {
			_setModelData(editor.model, '<container type="note"><paragraph>foo</paragraph></container>');

			expect(command.isElement(child(0))).toBe(true);
			expect(command.isElement(child(0).getChild(0) as ModelElement)).toBe(false);
			expect(command.isElement(root())).toBe(false);
		});
	});
});
