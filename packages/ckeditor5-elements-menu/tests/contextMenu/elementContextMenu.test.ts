import {
	Bold,
	DropdownMenuRootListView,
	Paragraph,
	_setModelData,
	keyCodes,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { ElementContainerCommand } from 'ckeditor5-elements-core';
import ElementMenu, { type ElementMenuConfig } from '../../src/elementMenu.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../../testUtils/editor.js';
import { press } from '../../../../testUtils/keyboard.js';
import ElementContextMenu from '../../src/contextMenu/elementContextMenu.js';

describe('ElementContextMenu', () => {
	let editor: ClassicEditor;
	let plugin: ElementContextMenu;
	let menu: ElementMenu;
	let containerCommand: ElementContainerCommand;

	/**
	 * Creates the editor with a `container` toggle command (titled "Container"). The menu config defaults to just that
	 * command; `null` means no config. The selection is in the paragraph inside the container; the second paragraph has bold text.
	 */
	async function setUp(elementContextMenu: ElementMenuConfig | null = () => [containerCommand]): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Bold, Container, ElementContextMenu],
			...(elementContextMenu ? { elementContextMenu } : {})
		});

		plugin = editor.plugins.get('ElementContextMenu');
		menu = editor.plugins.get('ElementMenu');

		containerCommand = new ElementContainerCommand(editor, 'container');
		containerCommand.set({ title: 'Container', icon: '<svg></svg>' });
		editor.commands.add('container', containerCommand);

		_setModelData(
			editor.model,
			'<container><paragraph>f[]oo</paragraph></container><paragraph><$text bold="true">bar</$text></paragraph>'
		);
	}

	/**
	 * Fires `contextmenu` on the DOM element and returns whether the native menu was prevented. `button: -1` is what a
	 * browser sends for the context menu opened with the keyboard.
	 */
	function contextMenu(domElement: Element, button = 2): boolean {
		const event = new MouseEvent('contextmenu', {
			bubbles: true,
			cancelable: true,
			clientX: 10,
			clientY: 20,
			button
		});

		domElement.dispatchEvent(event);

		return event.defaultPrevented;
	}

	const pressShiftF10 = (): boolean => press(editor.keystrokes, keyCodes.f10, { shiftKey: true });

	const editable = (): HTMLElement => editor.ui.getEditableElement()!;
	const child = (index: number): ModelElement => editor.model.document.getRoot()!.getChild(index) as ModelElement;
	const labels = (): string[] =>
		menu.view instanceof DropdownMenuRootListView ? menu.view.buttons.map(button => button.label ?? '') : [];

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name and loads ElementMenu, but not the clipboard commands', async () => {
		await setUp();

		expect(ElementContextMenu.pluginName).toBe('ElementContextMenu');
		expect(editor.plugins.get(ElementMenu)).toBe(menu);
		expect(editor.plugins.has('ElementClipboard')).toBe(false);
	});

	describe('right-click in the editable', () => {
		it('opens the menu of the element with the configured items', async () => {
			await setUp();

			expect(contextMenu(editable().querySelector('section p')!)).toBe(true);
			expect(labels()).toEqual(['Container']);
			expect(menu.view?.element?.getAttribute('aria-label')).toBe('Element menu');
		});

		it('passes the closest model element and the editor to the config callback', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);
			contextMenu(editable().querySelector('section p')!);

			expect(items).toHaveBeenCalledWith(child(0).getChild(0), editor);
		});

		it('skips text attribute elements', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);
			contextMenu(editable().querySelector('strong')!);

			expect(items).toHaveBeenCalledWith(child(1), editor);
		});

		it('keeps the native menu without the config option', async () => {
			await setUp(null);

			expect(contextMenu(editable().querySelector('p')!)).toBe(false);
			expect(plugin.open(child(0), new DOMRect())).toBe(false);
			expect(menu.view).toBeNull();
		});

		it('keeps the native menu when there are no items', async () => {
			await setUp(() => [undefined, null]);

			expect(contextMenu(editable().querySelector('section p')!)).toBe(false);
			expect(menu.view).toBeNull();
		});

		it('keeps the native menu when right-clicking outside any element', async () => {
			await setUp();

			expect(contextMenu(editable())).toBe(false);
			expect(menu.view).toBeNull();
		});
	});

	describe('keyboard', () => {
		it('the context menu key opens the menu of the element at the cursor', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);

			// The browser fires `contextmenu` on the editable itself, not on the element at the cursor.
			expect(contextMenu(editable(), -1)).toBe(true);
			expect(items).toHaveBeenCalledWith(child(0).getChild(0), editor);
			expect(menu.view).not.toBeNull();
		});

		it('Shift+F10 opens the menu of the element at the cursor', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);

			expect(pressShiftF10()).toBe(true);
			expect(items).toHaveBeenCalledWith(child(0).getChild(0), editor);
			expect(document.activeElement).toBe((menu.view as DropdownMenuRootListView).buttons[0]?.element);
		});

		it('Shift+F10 opens the menu of the selected element, next to it', async () => {
			const items = vi.fn<ElementMenuConfig>(() => [containerCommand]);

			await setUp(items);

			// Only objects can be selected as a whole.
			editor.model.schema.register('box', { inheritAllFrom: '$blockObject' });
			editor.conversion.elementToElement({ model: 'box', view: { name: 'div', classes: 'box' } });
			_setModelData(editor.model, '<paragraph>foo</paragraph>[<box></box>]');

			const openSpy = vi.spyOn(menu, 'open');

			pressShiftF10();

			expect(items).toHaveBeenCalledWith(child(1), editor);
			expect(openSpy.mock.calls[0]?.[1]).toBe(editable().querySelector('div.box'));
		});

		it('Shift+F10 does nothing without the config option', async () => {
			await setUp(null);

			expect(pressShiftF10()).toBe(false);
			expect(menu.view).toBeNull();
		});

		it('is listed in the accessibility help', async () => {
			await setUp();

			const keystrokes = [...editor.accessibility.keystrokeInfos.values()]
				.flatMap(category => [...category.groups.values()])
				.flatMap(group => group.keystrokes);

			expect(keystrokes).toContainEqual(
				expect.objectContaining({ label: 'Open the menu of the element at the cursor', keystroke: 'Shift+F10' })
			);
		});
	});

	describe('openAtSelection()', () => {
		it('opens the menu next to the cursor', async () => {
			await setUp();

			const openSpy = vi.spyOn(menu, 'open');

			expect(plugin.openAtSelection()).toBe(true);
			expect(openSpy.mock.calls[0]?.[0]).toBe(child(0).getChild(0));
			expect(openSpy.mock.calls[0]?.[1]).toBeInstanceOf(Range);
		});
	});

	describe('getModelElement()', () => {
		it('maps a view element, or its closest mapped ancestor, to a model element', async () => {
			await setUp();

			const viewRoot = editor.editing.view.document.getRoot()!;
			const viewParagraph = editor.editing.mapper.toViewElement(child(1))!;
			const viewStrong = viewParagraph.getChild(0);

			expect(plugin.getModelElement(viewParagraph)).toBe(child(1));
			expect(viewStrong?.is('attributeElement') && plugin.getModelElement(viewStrong)).toBe(child(1));
			expect(plugin.getModelElement(viewRoot)).toBeNull();
		});
	});
});
