import { IconBold, env, keyCodes, _setModelData } from 'ckeditor5';
import {
	ElementBlockCommand,
	ElementButtonView,
	ElementContainerCommand,
	ElementInlineCommand,
	ElementInsertCommand,
	ElementListCommand
} from 'ckeditor5-elements-core';
import { describe, expect, it } from 'vitest';
import { press } from '../../../testUtils/keyboard.js';
import ElementSchema from '../src/elementSchema.js';
import ElementSchemaCommands from '../src/elementSchemaCommands.js';
import { useSchemaCommandsEditor } from './schemaCommandsEditor.js';

describe('ElementSchemaCommands', () => {
	const { setUp, command, model, execute } = useSchemaCommandsEditor();

	it('has a plugin name, requires the element schema, and adds commands with a title and an icon', async () => {
		const editor = await setUp();

		expect(ElementSchemaCommands.pluginName).toBe('ElementSchemaCommands');
		expect(editor.plugins.has(ElementSchema)).toBe(true);
		expect(command().elementName).toBe('bold');
		expect(command().title).toBe('Bold');
		expect(command().icon).toBe(IconBold);
	});

	it('adds the command of the kind of each element', async () => {
		await setUp();

		expect(command('bold')).toBeInstanceOf(ElementInlineCommand);
		expect(command('title')).toBeInstanceOf(ElementBlockCommand);
		expect(command('callout')).toBeInstanceOf(ElementContainerCommand);
		expect(command('divider')).toBeInstanceOf(ElementInsertCommand);
		expect(command('mention')).toBeInstanceOf(ElementInsertCommand);
		expect(command('chip')).toBeInstanceOf(ElementInsertCommand);
		expect(command('code')).toBeInstanceOf(ElementBlockCommand);
		expect(command('bullets')).toBeInstanceOf(ElementListCommand);
		expect(command('bold').isToggleable).toBe(true);
		expect(command('title').isToggleable).toBe(true);
		expect(command('callout').isToggleable).toBe(true);
		expect(command('divider').isToggleable).toBe(false);
	});

	it('adds nothing without elements', async () => {
		const editor = await setUp({});

		expect(editor.ui.componentFactory.has('bold')).toBe(false);
		expect(editor.commands.get('bold')).toBeUndefined();
	});

	it('can name the command apart from the element, also for an element of another plugin', async () => {
		await setUp({ strong: { element: 'bold', title: 'Bold' }, text: { element: 'paragraph', title: 'Text' } });

		expect(execute('<paragraph>[ab]</paragraph>', 'strong')).toBe('<paragraph><bold>[ab]</bold></paragraph>');
		expect(command('text')).toBeInstanceOf(ElementBlockCommand);
	});

	it('rejects an unknown element', async () => {
		await expect(setUp({ bold: { element: 'bolt', title: 'Bold' } })).rejects.toThrow(
			'elementSchemaCommands.bold: unknown element "bolt".'
		);
	});

	describe('the keystrokes', () => {
		it('executes the command with the keystroke', async () => {
			const editor = await setUp();

			_setModelData(editor.model, '<paragraph>[ab]</paragraph>');
			press(editor.keystrokes, keyCodes.b, env.isMac ? { metaKey: true } : { ctrlKey: true });

			expect(model()).toBe('<paragraph><bold>[ab]</bold></paragraph>');
		});
	});

	it('adds a toolbar button that reflects the command, and executes it', async () => {
		const editor = await setUp();
		const button = editor.ui.componentFactory.create('bold') as ElementButtonView;

		expect(button).toBeInstanceOf(ElementButtonView);
		expect(button.label).toBe('Bold');
		expect(button.icon).toBe(IconBold);
		expect(button.keystroke).toBe('Ctrl+B');
		expect(button.isToggleable).toBe(true);

		_setModelData(editor.model, '<paragraph>[ab]</paragraph>');

		expect(button.isOn).toBe(false);
		expect(button.isEnabled).toBe(true);

		button.fire('execute');

		expect(model()).toBe('<paragraph><bold>[ab]</bold></paragraph>');
		expect(button.isOn).toBe(true);
	});
});
