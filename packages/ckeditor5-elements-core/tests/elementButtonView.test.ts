import { Paragraph, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ElementButtonView from '../src/elementButtonView.js';
import ElementCommand from '../src/elementCommand.js';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('ElementButtonView', () => {
	let editor: ClassicEditor;
	let command: ElementCommand;
	let view: ElementButtonView;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container] });

		command = new ElementCommand(editor);
		command.elementName = 'container';
		editor.commands.add('container', command);

		view = new ElementButtonView(editor.locale, command);
		view.render();
	});

	afterEach(async () => {
		view.destroy();
		await editor.destroy();
	});

	it('keeps the command', () => {
		expect(view.command).toBe(command);
	});

	it('reflects the command state', () => {
		command.set({ title: 'Container', icon: '<svg></svg>', tooltip: 'Wrap with a container' });
		_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

		expect(view.label).toBe('Container');
		expect(view.icon).toBe('<svg></svg>');
		expect(view.tooltip).toBe('Wrap with a container');
		expect(view.isOn).toBe(true);
		expect(view.isEnabled).toBe(true);

		editor.enableReadOnlyMode('test');

		expect(view.isEnabled).toBe(false);
	});

	it('shows the "on" state for its target', () => {
		_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>');

		const paragraph = editor.model.document.getRoot()!.getChild(1) as ModelElement;
		const targeted = new ElementButtonView(editor.locale, command, { target: paragraph });

		expect(command.isOn).toBe(true);
		expect(targeted.isOn).toBe(false);

		targeted.destroy();
	});

	it('executes the command and focuses the editor when clicked', () => {
		const focusSpy = vi.spyOn(editor.editing.view, 'focus');

		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

		view.element!.click();

		expect(command.isOn).toBe(true);
		expect(focusSpy).toHaveBeenCalled();
	});

	it('tells assistive technology whether it is on', () => {
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

		expect(view.isToggleable).toBe(true);
		expect(view.element?.getAttribute('aria-pressed')).toBe('false');

		_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

		expect(view.element?.getAttribute('aria-pressed')).toBe('true');
	});
});
