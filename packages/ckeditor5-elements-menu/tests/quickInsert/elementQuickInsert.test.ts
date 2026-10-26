import {
	Heading,
	Paragraph,
	ShiftEnter,
	_getModelData,
	_setModelData,
	keyCodes,
	ModelSelection,
	env,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ElementMenu from '../../src/elementMenu.js';
import ElementQuickInsert from '../../src/quickInsert/elementQuickInsert.js';
import QuickInsertCommand from '../../src/quickInsert/quickInsertCommand.js';
import QuickInsertView from '../../src/quickInsert/quickInsertView.js';
import { BlockObject, createEditor } from '../../../../testUtils/editor.js';
import { press } from '../../../../testUtils/keyboard.js';

describe('ElementQuickInsert', () => {
	let editor: ClassicEditor;
	let plugin: ElementQuickInsert;
	let menu: ElementMenu;

	const getView = (): QuickInsertView | null => {
		const view = menu.view;

		return view instanceof QuickInsertView ? view : null;
	};

	const pressAltEnter = (): boolean => press(editor.keystrokes, keyCodes.enter, { altKey: true });

	beforeEach(async () => {
		editor = await createEditor({
			plugins: [Paragraph, Heading, ShiftEnter, BlockObject, ElementQuickInsert],
			elementQuickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1' }, exclude: ['heading3'] }
		});

		plugin = editor.plugins.get('ElementQuickInsert');
		menu = editor.plugins.get(ElementMenu);
		editor.editing.view.focus();
		// The position before the selected object is between blocks.
		_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name, requires ElementMenu (not the context menu) and registers the command', () => {
		expect(ElementQuickInsert.pluginName).toBe('ElementQuickInsert');
		expect(editor.plugins.has('ElementMenu')).toBe(true);
		expect(editor.plugins.has('ElementContextMenu')).toBe(false);
		expect(editor.commands.get('quickInsert')).toBeInstanceOf(QuickInsertCommand);
	});

	it('getItems() lists the allowed elements with their labels, without the excluded ones', () => {
		expect(plugin.getItems()).toEqual([
			{ name: 'paragraph', label: 'Paragraph' },
			{ name: 'heading1', label: 'Heading 1' },
			{ name: 'heading2', label: 'heading2' },
			{ name: 'element', label: 'element' }
		]);
	});

	it('getItems() lists only the elements allowed at exactly the selection', () => {
		_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

		expect(plugin.getItems()).toEqual([{ name: 'softBreak', label: 'softBreak' }]);
	});

	it('hasItems() tells whether getItems() lists an element, without the excluded ones', () => {
		const root = editor.model.document.getRoot()!;

		expect(plugin.hasItems()).toBe(true);

		editor.config.set('elementQuickInsert.exclude', ['paragraph', 'heading1', 'heading2', 'heading3', 'element']);

		expect(plugin.hasItems(editor.model.createPositionAt(root, 0))).toBe(false);
		expect(plugin.getItems(editor.model.createPositionAt(root, 0))).toEqual([]);
	});

	it('opens the menu on Alt+Enter', () => {
		expect(pressAltEnter()).toBe(true);
		expect(getView()).toBeInstanceOf(QuickInsertView);
		expect(Array.from(getView()!.listView.items)).toHaveLength(4);
		expect(_getModelData(editor.model)).toBe('<paragraph>foo</paragraph>[<element></element>]');
	});

	it('focuses the search field', () => {
		plugin.open();

		expect(document.activeElement).toBe(getView()!.queryView.fieldView.element);
	});

	it('does not open the menu when the command is disabled', () => {
		editor.enableReadOnlyMode('test');

		expect(pressAltEnter()).toBe(false);
		expect(plugin.open()).toBe(false);
		expect(menu.view).toBeNull();
	});

	it('opens for a given position, next to the given target', () => {
		const target = new DOMRect(10, 10, 0, 0);
		const position = editor.model.createPositionAt(editor.model.document.getRoot()!, 'end');

		expect(plugin.open(position, target)).toBe(true);
		expect(Array.from(getView()!.listView.items)).toHaveLength(4);

		getView()!.fire('execute', { value: 'heading2' });

		expect(_getModelData(editor.model)).toBe(
			'<paragraph>foo</paragraph><element></element><heading2>[]</heading2>'
		);
	});

	it('does not open for a position that cannot be edited', () => {
		editor.model.on(
			'canEditAt',
			evt => {
				evt.return = false;
				evt.stop();
			},
			{ priority: 'highest' }
		);

		expect(plugin.open(editor.model.createPositionAt(editor.model.document.getRoot()!, 0))).toBe(false);
	});

	it('inserts the chosen element, closes the menu and focuses the editor', () => {
		const focusSpy = vi.spyOn(editor.editing.view, 'focus');

		plugin.open();
		getView()!.fire('execute', { value: 'heading1' });

		expect(_getModelData(editor.model)).toBe(
			'<paragraph>foo</paragraph><heading1>[]</heading1><element></element>'
		);
		expect(menu.view).toBeNull();
		expect(focusSpy).toHaveBeenCalled();
	});

	describe('targets', () => {
		const root = (): ModelElement => editor.model.document.getRoot()!;

		it('getItems() and open() accept an element: the position before it', () => {
			const paragraph = root().getChild(0) as ModelElement;

			expect(plugin.getItems(paragraph).map(item => item.name)).toContain('heading1');
			expect(plugin.open(paragraph)).toBe(true);

			getView()!.fire('execute', { value: 'heading1' });

			expect(_getModelData(editor.model)).toBe(
				'<heading1>[]</heading1><paragraph>foo</paragraph><element></element>'
			);
		});

		it('opens next to the element, by default', () => {
			const showSpy = vi.spyOn(menu, 'show');

			plugin.open(root().getChild(0) as ModelElement);

			expect(showSpy.mock.calls[0]?.[1]).toBe(editor.ui.getEditableElement()!.querySelector('p'));
		});

		it('opens next to a position, by default', () => {
			const showSpy = vi.spyOn(menu, 'show');

			plugin.open(editor.model.createPositionAt(root(), 1));

			expect(showSpy.mock.calls[0]?.[1]).toBeInstanceOf(Range);
		});

		it('checks the target, not the selection', () => {
			const paragraph = root().getChild(0) as ModelElement;

			editor.model.on(
				'canEditAt',
				(evt, [selection]) => {
					// Only the position before the paragraph can be edited.
					const position = selection instanceof ModelSelection ? selection.getFirstPosition() : null;

					evt.return = !!position?.isEqual(editor.model.createPositionBefore(paragraph));
					evt.stop();
				},
				{ priority: 'highest' }
			);
			editor.commands.get('quickInsert')!.refresh();

			expect(editor.commands.get('quickInsert')!.isEnabled).toBe(false);
			expect(plugin.open()).toBe(false);
			expect(plugin.open(paragraph)).toBe(true);

			getView()!.fire('execute', { value: 'heading1' });

			expect(_getModelData(editor.model, { withoutSelection: true })).toBe(
				'<heading1></heading1><paragraph>foo</paragraph><element></element>'
			);
		});

		it('closes the menu when the document changes while it is open', () => {
			plugin.open();

			editor.model.change(writer => {
				writer.insertText('x', root().getChild(0) as ModelElement, 0);
			});

			expect(menu.view).toBeNull();
		});

		it('does not close another menu opened later', () => {
			plugin.open();
			menu.show(new QuickInsertView(editor.locale, []), new DOMRect());

			const other = menu.view;

			editor.model.change(writer => {
				writer.insertText('x', root().getChild(0) as ModelElement, 0);
			});

			expect(menu.view).toBe(other);
		});
	});

	describe('the quickInsert command without an element name', () => {
		it('opens the menu for the target', () => {
			const openSpy = vi.spyOn(plugin, 'open');
			const paragraph = root().getChild(0) as ModelElement;

			editor.execute('quickInsert', paragraph);

			expect(openSpy).toHaveBeenCalledWith(paragraph);
			expect(getView()).toBeInstanceOf(QuickInsertView);
		});

		it('can be a menu item: executeFor() opens the menu for the element', () => {
			const command = editor.commands.get('quickInsert')!;
			const paragraph = root().getChild(0) as ModelElement;

			expect(command.title).toBe('Insert element');

			command.executeFor(paragraph);
			getView()!.fire('execute', { value: 'heading1' });

			expect(_getModelData(editor.model)).toBe(
				'<heading1>[]</heading1><paragraph>foo</paragraph><element></element>'
			);
		});

		function root(): ModelElement {
			return editor.model.document.getRoot()!;
		}
	});
});

describe('ElementQuickInsert keystroke config', () => {
	let editor: ClassicEditor;

	const accessibilityKeystrokes = (): unknown[] =>
		[...editor.accessibility.keystrokeInfos.values()]
			.flatMap(category => [...category.groups.values()])
			.flatMap(group => group.keystrokes);

	afterEach(async () => {
		await editor.destroy();
	});

	it('uses the configured keystroke', async () => {
		editor = await createEditor({
			plugins: [Paragraph, ElementQuickInsert],
			elementQuickInsert: { keystroke: 'Ctrl+Space' }
		});
		editor.editing.view.focus();

		expect(press(editor.keystrokes, keyCodes.enter, { altKey: true })).toBe(false);
		// `Ctrl` means Cmd on macOS.
		expect(press(editor.keystrokes, keyCodes.space, env.isMac ? { metaKey: true } : { ctrlKey: true })).toBe(true);
	});

	it('registers no keystroke with `false`', async () => {
		editor = await createEditor({
			plugins: [Paragraph, ElementQuickInsert],
			elementQuickInsert: { keystroke: false }
		});

		expect(press(editor.keystrokes, keyCodes.enter, { altKey: true })).toBe(false);
	});

	it('lists the keystroke in the accessibility help', async () => {
		editor = await createEditor({
			plugins: [Paragraph, ElementQuickInsert],
			elementQuickInsert: { keystroke: 'Ctrl+Space' }
		});

		expect(accessibilityKeystrokes()).toContainEqual(
			expect.objectContaining({ label: 'Insert an element at the cursor', keystroke: 'Ctrl+Space' })
		);
	});

	it('lists no keystroke with `false`', async () => {
		editor = await createEditor({
			plugins: [Paragraph, ElementQuickInsert],
			elementQuickInsert: { keystroke: false }
		});

		expect(accessibilityKeystrokes()).not.toContainEqual(
			expect.objectContaining({ label: 'Insert an element at the cursor' })
		);
	});
});
