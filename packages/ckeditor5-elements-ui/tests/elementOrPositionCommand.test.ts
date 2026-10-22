import {
	Paragraph,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement,
	ModelSelection
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementCommand from '../src/elementCommand.js';
import ElementOrPositionCommand, { type PositionOrElement } from '../src/elementOrPositionCommand.js';
import { ElementsEditing } from 'ckeditor5-elements';

/**
 * Exposes the protected members.
 */
class TestCommand extends ElementOrPositionCommand {
	public getPositionOrElement(target?: PositionOrElement): PositionOrElement | null {
		return this._getPositionOrElement(target);
	}

	public getPosition(target?: PositionOrElement): ReturnType<ElementOrPositionCommand['_getPosition']> {
		return this._getPosition(target);
	}

	public getElement(target?: PositionOrElement): ModelElement | null {
		return this._getElement(target);
	}

	public setAffectsData(value: boolean): void {
		this.affectsData = value;
	}
}

describe('ElementOrPositionCommand', () => {
	let editor: ClassicEditor;
	let command: TestCommand;

	const root = (): ModelElement => editor.model.document.getRoot()!;
	const child = (index: number): ModelElement => root().getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container, ElementsEditing] });

		command = new TestCommand(editor);
		editor.commands.add('test', command);
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has the observable icon, title and tooltip', () => {
		expect(command.icon).toBeUndefined();
		expect(command.title).toBe('');
		expect(command.tooltip).toBe(true);

		let title = '';

		command.on('change:title', (evt, name, value: string) => {
			title = value;
		});
		command.title = 'Test';

		expect(title).toBe('Test');
	});

	it('is the base of the element commands', () => {
		expect(new ElementCommand(editor)).toBeInstanceOf(ElementOrPositionCommand);
	});

	describe('refresh()', () => {
		it('is enabled when the target can be edited', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(command.isEnabled).toBe(true);
		});

		it('uses the given target', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			editor.model.on(
				'canEditAt',
				// The event gets the target as a selection.
				(evt, [selection]) => {
					evt.return = !(selection instanceof ModelSelection && selection.getSelectedElement() === child(1));
					evt.stop();
				},
				{ priority: 'highest' }
			);

			command.refresh(child(1));
			expect(command.isEnabled).toBe(false);

			command.refresh(child(0));
			expect(command.isEnabled).toBe(true);
		});

		it('is disabled in read-only mode', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(command.isEnabled).toBe(false);
		});
	});

	describe('getState()', () => {
		it('returns the state for the target, without changing the command', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>'
			);

			const toggle = new ElementCommand(editor);

			toggle.elementName = 'container';
			editor.commands.add('container', toggle);
			toggle.refresh();

			expect(toggle.isOn).toBe(true);
			expect(toggle.getState(child(1))).toEqual({ isEnabled: true, isOn: false });
			expect(toggle.getState()).toEqual({ isEnabled: true, isOn: true });
			expect(toggle.isOn).toBe(true);
		});

		it('is never "on" by default', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(command.getState(child(0))).toEqual({ isEnabled: true, isOn: false });
		});

		it('is disabled in read-only mode only for commands that change the data', () => {
			// Nothing can be edited in read-only mode, so use a command that does not need it.
			class AlwaysEnabledCommand extends TestCommand {
				protected override _isEnabledFor(): boolean {
					return true;
				}
			}

			const alwaysEnabled = new AlwaysEnabledCommand(editor);

			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(alwaysEnabled.getState(child(0)).isEnabled).toBe(false);

			alwaysEnabled.setAffectsData(false);

			expect(alwaysEnabled.getState(child(0)).isEnabled).toBe(true);
		});
	});

	describe('executeFor()', () => {
		it('executes for the target even when the command is disabled for the selection', () => {
			_setModelData(
				editor.model,
				'<container><containerItem>fo[]o</containerItem></container><paragraph>bar</paragraph>'
			);

			const toggle = new ElementCommand(editor);

			toggle.elementName = 'container';
			editor.commands.add('container', toggle);
			toggle.refresh();

			// Unwrapping is not allowed at the selection (`containerItem` is allowed only in a container).
			expect(toggle.isEnabled).toBe(false);

			toggle.executeFor(child(1));

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><containerItem>foo</containerItem></container><container><paragraph>bar</paragraph></container>'
			);
			expect(toggle.isEnabled).toBe(false);
		});

		it('executes for an editable target when the selection cannot be edited', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			const toggle = new ElementCommand(editor);

			toggle.elementName = 'container';
			editor.commands.add('container', toggle);
			editor.model.on(
				'canEditAt',
				(evt, [selection]) => {
					// Only the second paragraph (and what is in it) can be edited.
					evt.return =
						selection instanceof ModelSelection &&
						(selection.getSelectedElement() === child(1) ||
							selection.getFirstPosition()?.parent === child(1));
					evt.stop();
				},
				{ priority: 'highest' }
			);
			toggle.refresh();

			expect(toggle.isEnabled).toBe(false);

			toggle.executeFor(child(1));

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<paragraph>foo</paragraph><container><paragraph>bar</paragraph></container>'
			);
		});

		it('passes the other arguments to execute()', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			const executeSpy = vi.spyOn(command, 'execute');

			command.executeFor(child(0), 'name', 1);

			expect(executeSpy).toHaveBeenCalledWith(child(0), 'name', 1);
		});

		it('does nothing when the command is disabled for the target', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			const executeSpy = vi.fn();

			command.on('execute', executeSpy);
			editor.enableReadOnlyMode('test');
			command.executeFor(child(0));

			expect(executeSpy).not.toHaveBeenCalled();
		});
	});

	describe('target helpers', () => {
		it('return the given target', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			const position = editor.model.createPositionAt(child(1), 1);

			expect(command.getPositionOrElement(position)).toBe(position);
			expect(command.getPositionOrElement(child(1))).toBe(child(1));
		});

		it('resolve the target from the selection: the selected element, or the first position', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			expect(command.getPositionOrElement()).toEqual(editor.model.document.selection.getFirstPosition());

			_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');
			expect(command.getPositionOrElement()).toBe(child(1));
		});

		it('_getPosition() turns an element into the position before it', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			const position = editor.model.createPositionAt(child(0), 2);

			expect(command.getPosition(position)).toBe(position);
			expect(command.getPosition(child(1))?.isEqual(editor.model.createPositionAt(root(), 1))).toBe(true);
			expect(command.getPosition(root())).toBeNull();
		});

		it('_getElement() turns a position into its parent element, never a root', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const paragraph = child(0).getChild(0) as ModelElement;

			expect(command.getElement()).toBe(paragraph);
			expect(command.getElement(child(0))).toBe(child(0));
			expect(command.getElement(editor.model.createPositionAt(child(0), 0))).toBe(child(0));
			expect(command.getElement(editor.model.createPositionAt(root(), 0))).toBeNull();
			expect(command.getElement(root())).toBeNull();
		});
	});
});
