import {
	Heading,
	Paragraph,
	ShiftEnter,
	_getModelData,
	_setModelData,
	keyCodes,
	type ClassicEditor,
	type KeystrokeInfo
} from 'ckeditor5';
import { ElementsEditing } from 'ckeditor5-elements';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import QuickInsert from '../src/quickInsert.js';
import QuickInsertCommand from '../src/quickInsertCommand.js';
import QuickInsertView from '../src/quickInsertView.js';
import { createEditor } from '../../../testUtils/editor.js';

describe('QuickInsert', () => {
	let editor: ClassicEditor;
	let plugin: QuickInsert;
	let contextMenu: ElementContextMenu;

	const getView = (): QuickInsertView | null => {
		const view = contextMenu.view?.items.first;

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
		contextMenu = editor.plugins.get(ElementContextMenu);
		editor.editing.view.focus();
		// The position before the selected object is between blocks.
		_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name, requires the context menu and registers the command', () => {
		expect(QuickInsert.pluginName).toBe('QuickInsert');
		expect(editor.plugins.has('ElementContextMenu')).toBe(true);
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
		expect(contextMenu.view).toBeNull();
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
		expect(contextMenu.view).toBeNull();
		expect(focusSpy).toHaveBeenCalled();
	});
});
