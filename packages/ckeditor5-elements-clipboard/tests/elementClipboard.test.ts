import { Paragraph, _getModelData, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import ElementClipboard from '../src/elementClipboard.js';
import ElementCopyCommand from '../src/elementCopyCommand.js';
import ElementPasteCommand from '../src/elementPasteCommand.js';
import { Container, createEditor } from '../../../testUtils/editor.js';

function clipboardItem(data: Record<string, string>): ClipboardItem {
	return new ClipboardItem(
		Object.fromEntries(Object.entries(data).map(([type, value]) => [type, new Blob([value], { type })]))
	);
}

describe('ElementClipboard', () => {
	let editor: ClassicEditor;

	const getData = (): string => _getModelData(editor.model, { withoutSelection: true });
	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container, ElementClipboard] });
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await editor.destroy();
	});

	it('registers the commands', () => {
		expect(ElementClipboard.pluginName).toBe('ElementClipboard');

		expect(editor.commands.get('copyElement')).toBeInstanceOf(ElementCopyCommand);
		expect(editor.commands.get('copyElement')?.cut).toBe(false);
		expect(editor.commands.get('cutElement')?.cut).toBe(true);
		expect(editor.commands.get('pasteElement')?.placement).toBe('replace');
		expect(editor.commands.get('pasteElementBefore')).toBeInstanceOf(ElementPasteCommand);
		expect(editor.commands.get('pasteElementBefore')?.placement).toBe('before');
		expect(editor.commands.get('pasteElementAfter')?.placement).toBe('after');

		expect(
			[
				editor.commands.get('copyElement'),
				editor.commands.get('cutElement'),
				editor.commands.get('pasteElement'),
				editor.commands.get('pasteElementBefore'),
				editor.commands.get('pasteElementAfter')
			].map(command => command?.title)
		).toEqual(['Copy', 'Cut', 'Paste', 'Paste before', 'Paste after']);
	});

	it('enables the commands in a secure context only', () => {
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
		expect(editor.commands.get('copyElement')?.isEnabled).toBe(true);
		expect(editor.commands.get('pasteElement')?.isEnabled).toBe(true);

		vi.spyOn(window, 'isSecureContext', 'get').mockReturnValue(false);
		editor.commands.get('copyElement')?.refresh();
		editor.commands.get('pasteElement')?.refresh();

		expect(editor.commands.get('copyElement')?.isEnabled).toBe(false);
		expect(editor.commands.get('pasteElement')?.isEnabled).toBe(false);
	});

	it('keeps copying enabled in read-only mode, but not cutting or pasting', () => {
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
		editor.enableReadOnlyMode('test');

		expect(editor.commands.get('copyElement')?.isEnabled).toBe(true);
		expect(editor.commands.get('cutElement')?.isEnabled).toBe(false);
		expect(editor.commands.get('pasteElement')?.isEnabled).toBe(false);
	});

	describe('copy and cut', () => {
		let write: MockInstance<Clipboard['write']>;

		beforeEach(() => {
			write = vi.spyOn(navigator.clipboard, 'write').mockResolvedValue();
		});

		async function written(): Promise<Record<string, string>> {
			const [item] = write.mock.calls[0][0];

			return {
				html: await (await item.getType('text/html')).text(),
				text: await (await item.getType('text/plain')).text()
			};
		}

		it('copies the element as HTML and plain text', async () => {
			_setModelData(editor.model, '<container><paragraph>foo</paragraph><paragraph>bar</paragraph></container>');

			await editor.execute('copyElement', child(0));

			expect(await written()).toEqual({
				html: '<section class="container"><p>foo</p><p>bar</p></section>',
				text: 'foo\n\nbar'
			});
			expect(getData()).toBe('<container><paragraph>foo</paragraph><paragraph>bar</paragraph></container>');
		});

		it('cuts the element', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');

			await editor.execute('cutElement', child(0));

			expect((await written()).html).toBe('<p>foo</p>');
			expect(getData()).toBe('<paragraph>bar</paragraph>');
		});

		it('does nothing for a detached element', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');
			const element = child(0);

			editor.model.change(writer => {
				writer.remove(element);
			});

			await editor.execute('copyElement', element);

			expect(write).not.toHaveBeenCalled();
		});

		it('does not cut in read-only mode', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');
			editor.enableReadOnlyMode('test');

			await editor.execute('cutElement', child(0));

			expect(write).not.toHaveBeenCalled();
			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph>');
		});

		it('does not remove the element if it was removed while copying', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');
			const element = child(0);

			write.mockImplementation(() => {
				editor.model.change(writer => {
					writer.remove(element);
				});

				return Promise.resolve();
			});

			await editor.execute('cutElement', element);

			expect(getData()).toBe('<paragraph>bar</paragraph>');
		});
	});

	describe('targets', () => {
		let write: MockInstance<Clipboard['write']>;

		beforeEach(() => {
			write = vi.spyOn(navigator.clipboard, 'write').mockResolvedValue();
		});

		async function writtenHtml(): Promise<string> {
			const [item] = write.mock.calls[0][0];

			return (await item.getType('text/html')).text();
		}

		it('uses the element at the selection when no target is given', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>ba[]r</paragraph>');

			await editor.execute('cutElement');

			expect(await writtenHtml()).toBe('<p>bar</p>');
			expect(getData()).toBe('<paragraph>foo</paragraph>');
		});

		it('uses the parent of the given position', async () => {
			_setModelData(editor.model, '<container><paragraph>foo</paragraph></container>');

			await editor.execute('copyElement', editor.model.createPositionAt(child(0), 0));

			expect(await writtenHtml()).toBe('<section class="container"><p>foo</p></section>');
		});

		it('is disabled and does nothing for a position directly in the root', async () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>');

			const position = editor.model.createPositionAt(editor.model.document.getRoot()!, 0);
			const command = editor.commands.get('copyElement')!;

			command.refresh(position);
			expect(command.isEnabled).toBe(false);

			await command.execute(position);
			expect(write).not.toHaveBeenCalled();
		});

		it('pastes relative to the element at the selection', async () => {
			vi.spyOn(navigator.clipboard, 'read').mockResolvedValue([clipboardItem({ 'text/html': '<p>new</p>' })]);
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			await editor.execute('pasteElementBefore');

			expect(getData()).toBe('<paragraph>new</paragraph><paragraph>foo</paragraph>');
		});

		it('paste does nothing without an element', async () => {
			const read = vi.spyOn(navigator.clipboard, 'read');

			_setModelData(editor.model, '<paragraph>foo</paragraph>');
			await editor.commands
				.get('pasteElement')!
				.execute(editor.model.createPositionAt(editor.model.document.getRoot()!, 0));

			expect(read).not.toHaveBeenCalled();
		});
	});

	describe('paste', () => {
		let read: MockInstance<Clipboard['read']>;

		beforeEach(() => {
			read = vi
				.spyOn(navigator.clipboard, 'read')
				.mockResolvedValue([clipboardItem({ 'text/html': '<p>new</p>' })]);
			_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');
		});

		it('replaces the element', async () => {
			await editor.execute('pasteElement', child(0));

			expect(getData()).toBe('<paragraph>new</paragraph><paragraph>bar</paragraph>');
		});

		it('inserts before the element', async () => {
			await editor.execute('pasteElementBefore', child(1));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>new</paragraph><paragraph>bar</paragraph>');
		});

		it('inserts after the element', async () => {
			await editor.execute('pasteElementAfter', child(1));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph><paragraph>new</paragraph>');
		});

		it('pastes block content', async () => {
			read.mockResolvedValue([clipboardItem({ 'text/html': '<section class="container"><p>new</p></section>' })]);

			await editor.execute('pasteElementAfter', child(0));

			expect(getData()).toBe(
				'<paragraph>foo</paragraph><container><paragraph>new</paragraph></container><paragraph>bar</paragraph>'
			);
		});

		it('prefers HTML over plain text', async () => {
			read.mockResolvedValue([clipboardItem({ 'text/plain': 'plain', 'text/html': '<p>rich</p>' })]);

			await editor.execute('pasteElementAfter', child(1));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph><paragraph>rich</paragraph>');
		});

		it('falls back to plain text', async () => {
			read.mockResolvedValue([clipboardItem({ 'text/plain': 'one\n\ntwo' })]);

			await editor.execute('pasteElementAfter', child(1));

			expect(getData()).toBe(
				'<paragraph>foo</paragraph><paragraph>bar</paragraph><paragraph>one</paragraph><paragraph>two</paragraph>'
			);
		});

		it('does nothing when the clipboard has no supported content', async () => {
			read.mockResolvedValue([clipboardItem({ 'image/png': 'png' })]);

			await editor.execute('pasteElement', child(0));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph>');
		});

		it('does nothing when the clipboard is empty', async () => {
			read.mockResolvedValue([]);

			await editor.execute('pasteElement', child(0));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph>');
		});

		it('does nothing if the element was removed while reading the clipboard', async () => {
			const element = child(0);

			read.mockImplementation(() => {
				editor.model.change(writer => {
					writer.remove(element);
				});

				return Promise.resolve([clipboardItem({ 'text/html': '<p>new</p>' })]);
			});

			await editor.execute('pasteElement', element);

			expect(getData()).toBe('<paragraph>bar</paragraph>');
		});

		it('does nothing when the target cannot be edited', async () => {
			editor.model.on(
				'canEditAt',
				evt => {
					evt.return = false;
					evt.stop();
				},
				{ priority: 'highest' }
			);

			await editor.execute('pasteElement', child(0));

			expect(getData()).toBe('<paragraph>foo</paragraph><paragraph>bar</paragraph>');
		});
	});
});
