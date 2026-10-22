import {
	ButtonView,
	Heading,
	Paragraph,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { SubmenuView } from 'ckeditor5-elements-context-menu';
import QuickInsert from '../src/quickInsert.js';
import { createElementInsertItems } from '../src/elementInsertItems.js';
import QuickInsertView from '../src/quickInsertView.js';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('createElementInsertItems()', () => {
	let editor: ClassicEditor;

	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;

	function getSubmenu(element: ModelElement): SubmenuView {
		const [submenu] = createElementInsertItems(element, editor);

		if (!(submenu instanceof SubmenuView)) {
			throw new Error('Expected a submenu.');
		}

		return submenu;
	}

	const buttons = (submenu: SubmenuView): ButtonView[] =>
		Array.from(submenu.panelView.items).filter(item => item instanceof ButtonView);

	afterEach(async () => {
		await editor.destroy();
	});

	it('returns no items without the QuickInsert plugin', async () => {
		editor = await createEditor({ plugins: [Paragraph] });

		expect(createElementInsertItems(child(0), editor)).toEqual([]);
	});

	describe('with QuickInsert', () => {
		let quickInsert: QuickInsert;
		let contextMenu: ElementContextMenu;

		async function setUp(data: string): Promise<void> {
			editor = await createEditor({ plugins: [Paragraph, Heading, Container, QuickInsert] });
			quickInsert = editor.plugins.get('QuickInsert');
			contextMenu = editor.plugins.get('ElementContextMenu');
			editor.editing.view.focus();
			_setModelData(editor.model, data);
		}

		it('creates an "Insert" submenu with "Insert before" and "Insert after"', async () => {
			await setUp('<paragraph>fo[]o</paragraph>');

			const submenu = getSubmenu(child(0));

			expect(submenu.buttonView.label).toBe('Insert');
			expect(buttons(submenu).map(button => button.label)).toEqual(['Insert before', 'Insert after']);
		});

		it('opens quick insert for the position before or after the element, next to it', async () => {
			await setUp('<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			const openSpy = vi.spyOn(quickInsert, 'open');
			const submenu = getSubmenu(child(0));
			const domParagraph = editor.ui.getEditableElement()!.querySelector('p');

			submenu.panelView.items.get(0)!.fire('execute');
			expect(openSpy).toHaveBeenLastCalledWith(editor.model.createPositionBefore(child(0)), domParagraph);

			submenu.panelView.items.get(1)!.fire('execute');
			expect(openSpy).toHaveBeenLastCalledWith(editor.model.createPositionAfter(child(0)), domParagraph);
		});

		it('inserts at the position chosen in the context menu', async () => {
			await setUp('<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			contextMenu.open(child(0), new DOMRect());

			const submenu = contextMenu.view!.items.first;

			if (!(submenu instanceof SubmenuView)) {
				throw new Error('Expected a submenu.');
			}

			submenu.open();
			submenu.panelView.items.get(1)!.fire('execute');

			const view = contextMenu.view?.items.first;

			expect(view).toBeInstanceOf(QuickInsertView);

			view?.fire('execute', { value: 'heading1' });

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>foo</paragraph><heading1>[]</heading1><paragraph>bar</paragraph>'
			);
			expect(contextMenu.view).toBeNull();
		});

		it('disables the items when nothing can be inserted at the position', async () => {
			await setUp('<container><containerItem>fo[]o</containerItem></container>');

			// Exclude everything that is allowed in a container, except `containerItem`, which is not allowed in the root.
			editor.config.set('quickInsert.exclude', ['paragraph', 'heading1', 'heading2', 'heading3', 'container']);

			const item = child(0).getChild(0) as ModelElement;
			const [before, after] = buttons(getSubmenu(item));
			const [rootBefore] = buttons(getSubmenu(child(0)));

			expect(before.isEnabled).toBe(true);
			expect(after.isEnabled).toBe(true);
			expect(rootBefore.isEnabled).toBe(false);
		});

		it('is added to the default context menu items, before the clipboard actions', async () => {
			await setUp('<paragraph>fo[]o</paragraph>');

			const items = contextMenu.getDefaultItems(child(0));

			expect(items[0]).toBeInstanceOf(SubmenuView);
			expect(items).toHaveLength(6);
		});
	});
});
