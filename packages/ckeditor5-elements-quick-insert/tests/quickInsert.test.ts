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
	type KeystrokeInfo,
	type ModelElement
} from 'ckeditor5';
import { ElementsEditing } from 'ckeditor5-elements-example';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElementMenu } from 'ckeditor5-elements-core';
import QuickInsert from '../src/quickInsert.js';
import QuickInsertCommand from '../src/quickInsertCommand.js';
import QuickInsertView from '../src/quickInsertView.js';
import { createEditor } from '../../../testUtils/editor.js';

describe('QuickInsert', () => {
	let editor: ClassicEditor;
	let plugin: QuickInsert;
	let menu: ElementMenu;

	const getView = (): QuickInsertView | null => {
		const view = menu.view;

		return view instanceof QuickInsertView ? view : null;
	};

	function pressAltEnter(): { prevented: boolean } {
		const preventDefault = vi.fn();
		const data: KeystrokeInfo & { preventDefault(): void; stopPropagation(): void } = {
			keyCode: keyCodes.enter,
			altKey: true,
			ctrlKey: false,
			metaKey: false,
			shiftKey: false,
			preventDefault,
			stopPropagation: vi.fn()
		};

		editor.keystrokes.press(data);

		return { prevented: preventDefault.mock.calls.length > 0 };
	}

	beforeEach(async () => {
		editor = await createEditor({
			plugins: [Paragraph, Heading, ShiftEnter, ElementsEditing, QuickInsert],
			quickInsert: { labels: { paragraph: 'Paragraph', heading1: 'Heading 1' }, exclude: ['heading3'] }
		});

		plugin = editor.plugins.get('QuickInsert');
		menu = editor.plugins.get(ElementMenu);
		editor.editing.view.focus();
		// The position before the selected object is between blocks.
		_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name, requires ElementMenu (not the context menu) and registers the command', () => {
		expect(QuickInsert.pluginName).toBe('QuickInsert');
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

	it('opens the menu on Alt+Enter', () => {
		const { prevented } = pressAltEnter();

		expect(prevented).toBe(true);
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

		expect(pressAltEnter().prevented).toBe(false);
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

describe('QuickInsert keystroke config', () => {
	let editor: ClassicEditor;

	const accessibilityKeystrokes = (): unknown[] =>
		[...editor.accessibility.keystrokeInfos.values()]
			.flatMap(category => [...category.groups.values()])
			.flatMap(group => group.keystrokes);

	afterEach(async () => {
		await editor.destroy();
	});

	function press(keystroke: Partial<KeystrokeInfo>): boolean {
		const preventDefault = vi.fn();

		editor.keystrokes.press({
			keyCode: keyCodes.enter,
			altKey: false,
			ctrlKey: false,
			metaKey: false,
			shiftKey: false,
			...keystroke,
			preventDefault,
			stopPropagation: vi.fn()
		} as KeystrokeInfo & { preventDefault(): void; stopPropagation(): void });

		return preventDefault.mock.calls.length > 0;
	}

	it('uses the configured keystroke', async () => {
		editor = await createEditor({ plugins: [Paragraph, QuickInsert], quickInsert: { keystroke: 'Ctrl+Space' } });
		editor.editing.view.focus();

		expect(press({ altKey: true })).toBe(false);
		// `Ctrl` means Cmd on macOS.
		expect(press({ keyCode: keyCodes.space, ...(env.isMac ? { metaKey: true } : { ctrlKey: true }) })).toBe(true);
	});

	it('registers no keystroke with `false`', async () => {
		editor = await createEditor({ plugins: [Paragraph, QuickInsert], quickInsert: { keystroke: false } });

		expect(press({ altKey: true })).toBe(false);
	});

	it('lists the keystroke in the accessibility help', async () => {
		editor = await createEditor({ plugins: [Paragraph, QuickInsert], quickInsert: { keystroke: 'Ctrl+Space' } });

		expect(accessibilityKeystrokes()).toContainEqual(
			expect.objectContaining({ label: 'Insert an element at the cursor', keystroke: 'Ctrl+Space' })
		);
	});

	it('lists no keystroke with `false`', async () => {
		editor = await createEditor({ plugins: [Paragraph, QuickInsert], quickInsert: { keystroke: false } });

		expect(accessibilityKeystrokes()).not.toContainEqual(
			expect.objectContaining({ label: 'Insert an element at the cursor' })
		);
	});
});
