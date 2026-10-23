import {
	Heading,
	Paragraph,
	ShiftEnter,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement,
	type ModelPosition
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import QuickInsertCommand from '../src/quickInsertCommand.js';
import { BlockObject, Container, createEditor } from '../../../testUtils/editor.js';

describe('QuickInsertCommand', () => {
	let editor: ClassicEditor;
	let command: QuickInsertCommand;

	const getData = (): string => _getModelData(editor.model);
	const root = (): ModelElement => editor.model.document.getRoot()!;
	const inRoot = (offset: number): ModelPosition => editor.model.createPositionAt(root(), offset);

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Heading, ShiftEnter, Container, BlockObject] });

		command = new QuickInsertCommand(editor);
		editor.commands.add('quickInsert', command);
	});

	afterEach(async () => {
		await editor.destroy();
	});

	describe('getAllowedElements()', () => {
		it('lists only inline elements inside a paragraph', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(command.getAllowedElements()).toEqual(['softBreak']);
		});

		it('lists the blocks allowed between blocks, skipping generic items', () => {
			_setModelData(editor.model, '[<element></element>]<paragraph>foo</paragraph>');

			const names = command.getAllowedElements();

			expect(names).toEqual(expect.arrayContaining(['paragraph', 'heading1', 'container', 'element']));
			expect(names).not.toContain('softBreak');
			expect(names).not.toContain('containerItem');
			expect(names.some(name => name.startsWith('$'))).toBe(false);
		});

		it('uses the given position', () => {
			_setModelData(
				editor.model,
				'<paragraph>fo[]o</paragraph><container><paragraph>bar</paragraph></container>'
			);

			const container = root().getChild(1) as ModelElement;

			expect(command.getAllowedElements(editor.model.createPositionAt(container, 0))).toContain('containerItem');
			expect(command.getAllowedElements(inRoot(1))).not.toContain('containerItem');
		});

		it('skips the excluded elements', () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>');

			const names = command.getAllowedElements(inRoot(0), ['heading1', 'element']);

			expect(names).toContain('paragraph');
			expect(names).not.toContain('heading1');
			expect(names).not.toContain('element');
		});
	});

	describe('isEnabled', () => {
		it('is enabled in an editable place', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(command.isEnabled).toBe(true);
		});

		it('is disabled in read-only mode', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			editor.enableReadOnlyMode('test');

			expect(command.isEnabled).toBe(false);
		});
	});

	describe('execute()', () => {
		it('does not insert a block inside a paragraph', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			editor.execute('quickInsert', undefined, 'heading1');

			expect(getData()).toBe('<paragraph>fo[]o</paragraph>');
		});

		it('inserts an inline element inside a paragraph', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			editor.execute('quickInsert', undefined, 'softBreak');

			expect(getData()).toBe('<paragraph>fo<softBreak></softBreak>[]o</paragraph>');
		});

		it('inserts a block at the given position and puts the selection inside', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			command.execute(inRoot(1), 'heading1');

			expect(getData()).toBe('<paragraph>foo</paragraph><heading1>[]</heading1><paragraph>bar</paragraph>');
		});

		it('inserts before the given element', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');

			command.execute(root().getChild(1) as ModelElement, 'heading1');

			expect(getData()).toBe('<paragraph>foo</paragraph><heading1>[]</heading1><paragraph>bar</paragraph>');
		});

		it('inserts before the selected object', () => {
			_setModelData(editor.model, '<paragraph>foo</paragraph>[<element></element>]');

			editor.execute('quickInsert', undefined, 'heading1');

			expect(getData()).toBe('<paragraph>foo</paragraph><heading1>[]</heading1><element></element>');
		});

		it('selects inserted objects', () => {
			_setModelData(editor.model, '<paragraph>foo[]</paragraph>');

			command.execute(inRoot(1), 'element');

			expect(getData()).toBe('<paragraph>foo</paragraph>[<element></element>]');
		});

		it('puts a paragraph into elements that hold blocks', () => {
			_setModelData(editor.model, '<paragraph>foo[]</paragraph>');

			command.execute(inRoot(1), 'container');

			expect(getData()).toBe('<paragraph>foo</paragraph><container><paragraph>[]</paragraph></container>');
		});

		it('inserts elements allowed only in a specific parent', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const container = root().getChild(0) as ModelElement;

			command.execute(editor.model.createPositionAt(container, 0), 'containerItem');

			expect(getData()).toBe(
				'<container><containerItem>[]</containerItem><paragraph>foo</paragraph></container>'
			);
		});

		it('puts the selection next to elements that cannot hold text or blocks', () => {
			editor.model.schema.register('marker', { allowWhere: '$block' });
			editor.conversion.elementToElement({ model: 'marker', view: 'hr' });
			_setModelData(editor.model, '<paragraph>foo[]</paragraph>');

			command.execute(inRoot(1), 'marker');

			expect(getData()).toBe('<paragraph>foo[]</paragraph><marker></marker>');
		});

		it('does nothing when the position cannot be edited', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			editor.model.on(
				'canEditAt',
				evt => {
					evt.return = false;
					evt.stop();
				},
				{ priority: 'highest' }
			);

			command.execute(inRoot(0), 'heading1');

			expect(getData()).toBe('<paragraph>fo[]o</paragraph>');
		});
	});
});
