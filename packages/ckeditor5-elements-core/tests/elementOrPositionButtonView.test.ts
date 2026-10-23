import {
	Notification,
	Paragraph,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementButtonView from '../src/elementButtonView.js';
import ElementCommand from '../src/elementCommand.js';
import ElementOrPositionButtonView from '../src/elementOrPositionButtonView.js';
import ElementOrPositionCommand from '../src/elementOrPositionCommand.js';

describe('ElementOrPositionButtonView', () => {
	let editor: ClassicEditor;
	let command: ElementCommand;
	let view: ElementOrPositionButtonView | undefined;

	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container] });

		command = new ElementCommand(editor);
		command.elementName = 'container';
		command.set({ title: 'Container', icon: '<svg></svg>', tooltip: 'Wrap with a container' });
		editor.commands.add('container', command);

		_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>');
	});

	afterEach(async () => {
		view?.destroy();
		await editor.destroy();
	});

	it('is the base of the element button', () => {
		expect(new ElementButtonView(editor.locale, command)).toBeInstanceOf(ElementOrPositionButtonView);
	});

	describe('without a target', () => {
		beforeEach(() => {
			view = new ElementOrPositionButtonView(editor.locale, command);
			view.render();
		});

		it('shows the icon with the title as the tooltip, not as text', () => {
			expect(view!.withText).toBe(false);
			expect(view!.label).toBe('Container');
			expect(view!.icon).toBe('<svg></svg>');
			expect(view!.tooltip).toBe('Wrap with a container');
			expect(view!.target).toBeUndefined();
		});

		it('follows the command title, icon and enabled state', () => {
			command.set({ title: 'Box', icon: '<svg id="box"></svg>' });
			editor.enableReadOnlyMode('test');

			expect(view!.label).toBe('Box');
			expect(view!.icon).toBe('<svg id="box"></svg>');
			expect(view!.isEnabled).toBe(false);
		});

		it('is never "on" (the base command has no such state)', () => {
			expect(view!.isOn).toBe(false);
		});

		it('focuses the editor, then executes the command for the selection', () => {
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');
			const executeSpy = vi.spyOn(command, 'execute');

			view!.element!.click();

			expect(focusSpy).toHaveBeenCalled();
			expect(executeSpy).toHaveBeenCalledWith();
			expect(focusSpy.mock.invocationCallOrder[0]).toBeLessThan(executeSpy.mock.invocationCallOrder[0]);
			expect(_getModelData(editor.model)).toBe('<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');
		});
	});

	describe('with text', () => {
		it('renders the title and has no tooltip', () => {
			view = new ElementOrPositionButtonView(editor.locale, command, { withText: true });

			expect(view.withText).toBe(true);
			expect(view.label).toBe('Container');
			expect(view.tooltip).toBe(false);
		});
	});

	describe('with a function as the target', () => {
		it('acts on the element the function returns, and follows it', () => {
			let target: ModelElement | null = child(1);

			view = new ElementOrPositionButtonView(editor.locale, command, { target: () => target });
			view.render();

			expect(view.isOn).toBe(false);

			target = child(0).getChild(0) as ModelElement;
			editor.model.change(writer => {
				writer.setSelection(child(1), 0);
			});

			expect(view.isOn).toBe(true);

			target = child(1);
			view.element!.click();

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><container><paragraph>bar</paragraph></container>'
			);
		});

		it('is disabled, and does nothing, when the function returns null', () => {
			view = new ElementOrPositionButtonView(editor.locale, command, { target: () => null });
			view.render();

			expect(view.isEnabled).toBe(false);

			view.fire('execute');

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><paragraph>bar</paragraph>'
			);
		});
	});

	describe('with a target', () => {
		beforeEach(() => {
			view = new ElementOrPositionButtonView(editor.locale, command, { target: child(1) });
			view.render();
		});

		it('shows the command state for the target, not for the selection', () => {
			expect(command.isOn).toBe(true);
			expect(view!.target).toBe(child(1));
			expect(view!.isOn).toBe(false);
			expect(view!.isEnabled).toBe(true);
		});

		it('updates the state when the document or the read-only mode changes', () => {
			editor.model.change(writer => {
				writer.wrap(writer.createRangeOn(child(1)), writer.createElement('container'));
			});

			expect(view!.isOn).toBe(true);

			editor.enableReadOnlyMode('test');

			expect(view!.isEnabled).toBe(false);
		});

		it('is disabled while the command is force-disabled', () => {
			command.forceDisabled('test');

			expect(view!.isEnabled).toBe(false);

			command.clearForceDisabled('test');

			expect(view!.isEnabled).toBe(true);
		});

		it('executes the command for the target', () => {
			const paragraph = child(1);

			view!.element!.click();

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<container><paragraph>foo</paragraph></container><container><paragraph>bar</paragraph></container>'
			);
			expect(command.isOn).toBe(true);
			expect(paragraph.parent?.is('element', 'container')).toBe(true);
		});

		it('stops updating when destroyed', () => {
			const getStateSpy = vi.spyOn(command, 'getState');

			view!.destroy();
			editor.enableReadOnlyMode('test');

			expect(getStateSpy).not.toHaveBeenCalled();
			view = undefined;
		});
	});

	it('is toggleable only for a toggleable command', () => {
		const plain = new ElementOrPositionCommand(editor);

		view = new ElementOrPositionButtonView(editor.locale, plain);
		view.render();

		expect(view.isToggleable).toBe(false);
		expect(view.element?.hasAttribute('aria-pressed')).toBe(false);

		view.destroy();
		view = new ElementOrPositionButtonView(editor.locale, command);
		view.render();

		expect(view.isToggleable).toBe(true);
	});

	it('works with any element or position command', () => {
		const generic = new ElementOrPositionCommand(editor);

		generic.title = 'Generic';
		view = new ElementOrPositionButtonView(editor.locale, generic, { withText: true, target: child(1) });

		expect(view.label).toBe('Generic');
		expect(view.isEnabled).toBe(true);
	});

	describe('failed commands', () => {
		class FailingCommand extends ElementOrPositionCommand {
			public override execute(): Promise<void> {
				return Promise.reject(new Error('Write permission denied.'));
			}
		}

		it('are reported with a warning of the Notification plugin', async () => {
			const otherEditor = await createEditor({ plugins: [Paragraph, Notification] });
			const failing = new FailingCommand(otherEditor);
			const warnings: unknown[] = [];

			failing.title = 'Copy';
			failing.refresh();
			otherEditor.plugins.get(Notification).on(
				'show:warning',
				(evt, data) => {
					warnings.push(data);
					evt.stop();
				},
				{ priority: 'high' }
			);

			view = new ElementOrPositionButtonView(otherEditor.locale, failing);
			view.fire('execute');
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(warnings).toEqual([
				expect.objectContaining({ message: 'Write permission denied.', title: 'Could not complete "Copy".' })
			]);

			view.destroy();
			view = undefined;
			await otherEditor.destroy();
		});

		it('are not handled without the Notification plugin', async () => {
			const failing = new FailingCommand(editor);
			const unhandled: unknown[] = [];
			const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
				unhandled.push(event.reason);
				event.preventDefault();
			};

			window.addEventListener('unhandledrejection', onUnhandledRejection);
			failing.refresh();
			view = new ElementOrPositionButtonView(editor.locale, failing);
			view.fire('execute');
			await new Promise(resolve => setTimeout(resolve, 50));
			window.removeEventListener('unhandledrejection', onUnhandledRejection);

			expect(unhandled).toEqual([new Error('Write permission denied.')]);
		});
	});
});
