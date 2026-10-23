import { Paragraph, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BlockObject, Container, createEditor } from '../../../testUtils/editor.js';
import { getElementAtSelection, isInDocument, isStandalone } from '../src/utils.js';

describe('utils', () => {
	let editor: ClassicEditor;

	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container, BlockObject] });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	describe('getElementAtSelection()', () => {
		it('returns the element with the cursor', () => {
			_setModelData(editor.model, '<container><paragraph>f[]oo</paragraph></container>');

			expect(getElementAtSelection(editor.model.document.selection)).toBe(child(0, 0));
		});

		it('returns the selected element, not its parent', () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');

			expect(getElementAtSelection(editor.model.document.selection)).toBe(child(1));
		});

		it('returns null for a selection directly in the root', () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>');

			// The selection of the document would be moved into a paragraph.
			expect(getElementAtSelection(editor.model.createSelection(editor.model.document.getRoot()!, 0))).toBeNull();
		});
	});

	it('isInDocument() is false for a removed element', () => {
		_setModelData(editor.model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>');

		const element = child(0);

		expect(isInDocument(element)).toBe(true);

		editor.model.change(writer => {
			writer.remove(element);
		});

		expect(isInDocument(element)).toBe(false);
	});

	it('isStandalone() is false only for limit elements that are not objects', () => {
		editor.model.schema.register('part', { isLimit: true, allowIn: '$root', allowContentOf: '$block' });
		_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');

		const part = editor.model.change(writer => writer.createElement('part'));

		expect(isStandalone(editor.model.schema, child(0))).toBe(true);
		expect(isStandalone(editor.model.schema, child(1))).toBe(true);
		expect(isStandalone(editor.model.schema, part)).toBe(false);
	});
});
