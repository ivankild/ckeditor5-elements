import { Heading, Paragraph, _getModelData, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { ElementMenuView, type ElementMenu, type ElementMenuConfig } from 'ckeditor5-elements-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import QuickInsert from '../src/quickInsert.js';
import { insertAfterIcon, insertBeforeIcon, insertIcon } from '../src/icons.js';
import QuickInsertPositionCommand from '../src/quickInsertPositionCommand.js';
import QuickInsertView from '../src/quickInsertView.js';

describe('QuickInsertPositionCommand', () => {
	let editor: ClassicEditor;
	let quickInsert: QuickInsert;
	let menu: ElementMenu;

	// The menu of an element, with the insert commands in a submenu.
	const insertMenu: ElementMenuConfig = (element, editor) => [
		{
			title: 'Insert',
			items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
		}
	];

	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Heading, Container, QuickInsert] });
		quickInsert = editor.plugins.get('QuickInsert');
		menu = editor.plugins.get('ElementMenu');
		editor.editing.view.focus();
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('is registered as `quickInsertBefore` and `quickInsertAfter`, with titles', () => {
		const before = editor.commands.get('quickInsertBefore');
		const after = editor.commands.get('quickInsertAfter');

		expect(before).toBeInstanceOf(QuickInsertPositionCommand);
		expect(before?.placement).toBe('before');
		expect(before?.title).toBe('Insert before');
		expect(after?.placement).toBe('after');
		expect(after?.title).toBe('Insert after');
		expect(before?.icon).toBe(insertBeforeIcon);
		expect(after?.icon).toBe(insertAfterIcon);
		expect(editor.commands.get('quickInsert')?.icon).toBe(insertIcon);
	});

	it('opens quick insert for the position before or after the element, next to it', () => {
		const openSpy = vi.spyOn(quickInsert, 'open');
		const domParagraph = editor.ui.getEditableElement()!.querySelector('p');

		editor.commands.get('quickInsertBefore')!.execute(child(0));
		expect(openSpy).toHaveBeenLastCalledWith(editor.model.createPositionBefore(child(0)), domParagraph);

		editor.commands.get('quickInsertAfter')!.execute(child(0));
		expect(openSpy).toHaveBeenLastCalledWith(editor.model.createPositionAfter(child(0)), domParagraph);
	});

	it('uses the element at the selection when no target is given', () => {
		const openSpy = vi.spyOn(quickInsert, 'open');

		editor.execute('quickInsertAfter');

		expect(openSpy).toHaveBeenCalledWith(editor.model.createPositionAfter(child(0)), expect.anything());
	});

	it('does nothing without an element', () => {
		const openSpy = vi.spyOn(quickInsert, 'open');

		editor.commands
			.get('quickInsertAfter')!
			.execute(editor.model.createPositionAt(editor.model.document.getRoot()!, 0));

		expect(openSpy).not.toHaveBeenCalled();
	});

	it('is enabled only when something can be inserted at the position', () => {
		_setModelData(editor.model, '<container><containerItem>fo[]o</containerItem></container>');
		editor.config.set('quickInsert.exclude', ['paragraph', 'heading1', 'heading2', 'heading3', 'container']);

		const command = editor.commands.get('quickInsertBefore')!;

		// Inside the container, `containerItem` can be inserted; in the root, nothing is left.
		expect(command.getState(child(0).getChild(0) as ModelElement).isEnabled).toBe(true);
		expect(command.getState(child(0)).isEnabled).toBe(false);
		expect(command.getState(editor.model.createPositionAt(editor.model.document.getRoot()!, 0)).isEnabled).toBe(
			false
		);
	});

	describe('in an element menu', () => {
		it('inserts at the position chosen in the menu', () => {
			menu.open(child(0), new DOMRect(), insertMenu);

			const menuView = menu.view;

			if (!(menuView instanceof ElementMenuView)) {
				throw new Error('Expected the menu of an element.');
			}

			const [, after] = menuView.buttons;

			expect(after.label).toBe('Insert after');

			menuView.menus[0].isOpen = true;
			after.element!.click();

			const view = menu.view;

			expect(view).toBeInstanceOf(QuickInsertView);

			view?.fire('execute', { value: 'heading1' });

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>foo</paragraph><heading1>[]</heading1><paragraph>bar</paragraph>'
			);
			expect(menu.view).toBeNull();
		});
	});
});
