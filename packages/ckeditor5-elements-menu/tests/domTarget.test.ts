import { Paragraph, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BlockObject, createEditor } from '../../../testUtils/editor.js';
import { getDomTarget } from '../src/domTarget.js';

describe('getDomTarget()', () => {
	let editor: ClassicEditor;

	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, BlockObject] });
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph><element></element>');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('is the DOM element of an element', () => {
		const target = getDomTarget(editor, child(0));

		expect(target).toBeInstanceOf(HTMLElement);
		expect((target as HTMLElement).tagName).toBe('P');
	});

	it('is a DOM range at a position', () => {
		const target = getDomTarget(editor, editor.model.createPositionAt(child(0), 1));

		expect(target).toBeInstanceOf(Range);
		expect((target as Range).startContainer.textContent).toBe('foo');
	});

	it('is the selected element, or the range of the selection, without a target', () => {
		expect(getDomTarget(editor)).toBeInstanceOf(Range);

		editor.model.change(writer => {
			writer.setSelection(child(1), 'on');
		});

		expect((getDomTarget(editor) as HTMLElement).classList.contains('ck-element')).toBe(true);
	});

	it('is null for an element that is not rendered', () => {
		const removed = child(1);

		editor.model.change(writer => {
			writer.remove(removed);
		});

		expect(getDomTarget(editor, removed)).toBeNull();
	});
});
