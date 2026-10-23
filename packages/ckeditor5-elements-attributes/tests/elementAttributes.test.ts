import { Dialog, ImageBlock, Paragraph, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementAttributes from '../src/elementAttributes.js';
import ElementAttributesCommand from '../src/elementAttributesCommand.js';
import { attributesIcon } from '../src/icons.js';

describe('ElementAttributes', () => {
	let editor: ClassicEditor;

	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);
	const command = (): ElementAttributesCommand => editor.commands.get('showElementAttributes')!;
	const dialog = (): Dialog => editor.plugins.get(Dialog);
	const title = (): string | undefined => document.querySelector('.ck-dialog .ck-form__header__label')?.textContent;
	const rows = (): string[][] =>
		[...document.querySelectorAll('.ck-dialog .ck-elements-attributes tr')].map(row =>
			[...row.children].map(cell => cell.textContent)
		);

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container, ImageBlock, ElementAttributes] });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('registers the command, with a title and an icon, and loads the dialog', () => {
		expect(ElementAttributes.pluginName).toBe('ElementAttributes');
		expect(command()).toBeInstanceOf(ElementAttributesCommand);
		expect(command().title).toBe('Show attributes');
		expect(command().icon).toBe(attributesIcon);
		expect(editor.plugins.has(Dialog)).toBe(true);
	});

	describe('execute()', () => {
		it('shows the attributes of the given element in a modal dialog, titled with its name', () => {
			_setModelData(
				editor.model,
				'<paragraph>a</paragraph><container type="warning"><paragraph>b[]</paragraph></container>'
			);

			command().executeFor(child(1));

			expect(dialog().id).toBe('elementAttributes');
			expect(title()).toBe('<container>');
			expect(rows()).toEqual([['type', 'warning']]);
			expect(document.querySelector('.ck-dialog-overlay')).not.toBeNull();
		});

		it('uses the element at the selection without a target', () => {
			_setModelData(editor.model, '<container type="info"><paragraph>a[]</paragraph></container>');

			command().execute();

			expect(title()).toBe('<paragraph>');
			expect(rows()).toEqual([['No attributes']]);
		});

		it('shows the selected element, e.g. an image', () => {
			_setModelData(editor.model, '[<imageBlock src="x.png" alt="An image"></imageBlock>]');

			command().execute();

			expect(title()).toBe('<imageBlock>');
			expect(rows()).toEqual(
				expect.arrayContaining([
					['src', 'x.png'],
					['alt', 'An image']
				])
			);
		});

		it('shows values that are not strings as JSON, and cuts long values', () => {
			_setModelData(editor.model, '<container type="a"><paragraph>a[]</paragraph></container>');
			editor.model.change(writer => {
				writer.setAttribute('count', 3, child(0));
				writer.setAttribute('flags', { bold: true }, child(0));
				writer.setAttribute('long', 'x'.repeat(200), child(0));
			});

			command().executeFor(child(0));

			const [, count, flags, long] = rows();

			expect(count).toEqual(['count', '3']);
			expect(flags).toEqual(['flags', '{"bold":true}']);
			expect(long[1]).toHaveLength(120);
			expect(long[1].endsWith('…')).toBe(true);
		});

		it('replaces the dialog that is open', () => {
			_setModelData(editor.model, '<container type="a"><paragraph>a[]</paragraph></container>');

			command().executeFor(child(0));
			command().executeFor(child(0, 0));

			expect(document.querySelectorAll('.ck-dialog')).toHaveLength(1);
			expect(title()).toBe('<paragraph>');
		});

		it('is closed by the Close button', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');
			command().execute();

			const close = [...document.querySelectorAll<HTMLElement>('.ck-dialog .ck-button_with-text')].find(
				button => button.textContent.trim() === 'Close'
			);

			close!.click();

			expect(dialog().id).toBeNull();
		});

		it('does nothing for a removed element', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph><paragraph>b</paragraph>');

			const removed = child(1);

			editor.model.change(writer => {
				writer.remove(removed);
			});
			command().executeFor(removed);

			expect(dialog().id).toBeNull();
		});
	});

	describe('state', () => {
		it('is enabled for an element, also in read-only mode, as it does not change the data', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(command().isEnabled).toBe(true);
			expect(command().getState(child(0)).isEnabled).toBe(true);
		});

		it('is disabled for a removed element, and for a selection directly in the root', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph><paragraph>b</paragraph>');

			const removed = child(1);

			editor.model.change(writer => {
				writer.remove(removed);
			});

			expect(command().getState(removed).isEnabled).toBe(false);
			expect(
				command().getState(editor.model.createPositionAt(editor.model.document.getRoot()!, 0)).isEnabled
			).toBe(false);
		});
	});

	it('getAttributes() returns the attributes as the dialog shows them', () => {
		_setModelData(editor.model, '<container type="warning"><paragraph>a[]</paragraph></container>');

		expect(command().getAttributes(child(0))).toEqual([['type', 'warning']]);
		expect(command().getAttributes()).toEqual([]);
	});
});
