import {
	ImageBlock,
	List,
	Paragraph,
	Table,
	Undo,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementActions from '../src/elementActions.js';
import ElementDeleteCommand from '../src/elementDeleteCommand.js';
import ElementDuplicateCommand from '../src/elementDuplicateCommand.js';
import ElementMoveCommand from '../src/elementMoveCommand.js';
import { deleteIcon, duplicateIcon, moveDownIcon, moveUpIcon } from '../src/icons.js';

describe('ElementActions', () => {
	let editor: ClassicEditor;

	const getData = (): string => _getModelData(editor.model, { withoutSelection: true });
	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);
	const isEnabled = (
		name: 'moveElementUp' | 'moveElementDown' | 'duplicateElement' | 'deleteElement',
		element: ModelElement
	): boolean => editor.commands.get(name)!.getState(element).isEnabled;

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container, List, Table, ImageBlock, Undo, ElementActions] });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	it('registers the commands, with titles and icons', () => {
		expect(ElementActions.pluginName).toBe('ElementActions');

		const commands = (['moveElementUp', 'moveElementDown', 'duplicateElement', 'deleteElement'] as const).map(
			name => editor.commands.get(name)
		);

		expect(commands[0]).toBeInstanceOf(ElementMoveCommand);
		expect(editor.commands.get('moveElementUp')?.direction).toBe('up');
		expect(editor.commands.get('moveElementDown')?.direction).toBe('down');
		expect(commands[2]).toBeInstanceOf(ElementDuplicateCommand);
		expect(commands[3]).toBeInstanceOf(ElementDeleteCommand);
		expect(commands.map(command => command?.title)).toEqual(['Move up', 'Move down', 'Duplicate', 'Delete']);
		expect(commands.map(command => command?.icon)).toEqual([moveUpIcon, moveDownIcon, duplicateIcon, deleteIcon]);
	});

	describe('moveElementUp', () => {
		it('swaps the element with the one before it, keeping the selection in it', () => {
			_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b</paragraph><paragraph>c[]</paragraph>');

			editor.execute('moveElementUp');

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>a</paragraph><paragraph>c[]</paragraph><paragraph>b</paragraph>'
			);
		});

		it('moves the given element', () => {
			_setModelData(
				editor.model,
				'<paragraph>a[]</paragraph><paragraph>b</paragraph><container><paragraph>c</paragraph></container>'
			);

			// `executeFor()` acts on the target even when the command is disabled at the selection, as here.
			editor.commands.get('moveElementUp')!.executeFor(child(2));

			expect(getData()).toBe(
				'<paragraph>a</paragraph><container><paragraph>c</paragraph></container><paragraph>b</paragraph>'
			);
		});

		it('is disabled for the first element of its parent', () => {
			_setModelData(
				editor.model,
				'<paragraph>a[]</paragraph><container><paragraph>b</paragraph><paragraph>c</paragraph></container>'
			);

			expect(isEnabled('moveElementUp', child(0))).toBe(false);
			expect(isEnabled('moveElementUp', child(1, 0))).toBe(false);
			expect(isEnabled('moveElementUp', child(1, 1))).toBe(true);
			expect(isEnabled('moveElementUp', child(1))).toBe(true);
		});

		it('is one undo step', () => {
			_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b[]</paragraph>');

			editor.execute('moveElementUp');
			editor.execute('undo');

			expect(_getModelData(editor.model)).toBe('<paragraph>a</paragraph><paragraph>b[]</paragraph>');
		});
	});

	describe('moveElementDown', () => {
		it('swaps the element with the one after it, keeping the selection in it', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph><paragraph>b</paragraph><paragraph>c</paragraph>');

			editor.execute('moveElementDown');

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>b</paragraph><paragraph>a[]</paragraph><paragraph>c</paragraph>'
			);
		});

		it('is disabled for the last element of its parent', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>a[]</paragraph><paragraph>b</paragraph></container><paragraph>c</paragraph>'
			);

			expect(isEnabled('moveElementDown', child(1))).toBe(false);
			expect(isEnabled('moveElementDown', child(0, 1))).toBe(false);
			expect(isEnabled('moveElementDown', child(0, 0))).toBe(true);
			expect(isEnabled('moveElementDown', child(0))).toBe(true);
		});
	});

	describe('duplicateElement', () => {
		it('inserts the same element, empty, after it, with the selection in it', () => {
			_setModelData(editor.model, '<paragraph>a[]b</paragraph><paragraph>c</paragraph>');

			editor.execute('duplicateElement');

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>ab</paragraph><paragraph>[]</paragraph><paragraph>c</paragraph>'
			);
		});

		it('keeps the attributes, and gives an element that holds blocks an empty paragraph', () => {
			_setModelData(editor.model, '<container type="warning"><paragraph>a[]</paragraph></container>');

			editor.execute('duplicateElement', child(0));

			expect(_getModelData(editor.model)).toBe(
				'<container type="warning"><paragraph>a</paragraph></container><container type="warning"><paragraph>[]</paragraph></container>'
			);
		});

		it('makes a new list item, not a second block of the same one', () => {
			_setModelData(
				editor.model,
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">one[]</paragraph>'
			);

			editor.execute('duplicateElement');

			const [first, copy] = [child(0), child(1)];

			expect(copy.getAttribute('listType')).toBe('bulleted');
			expect(copy.getAttribute('listItemId')).not.toBe(first.getAttribute('listItemId'));
			expect(editor.getData()).toMatch(/^<ul><li [^>]+>one<\/li><li [^>]+>&nbsp;<\/li><\/ul>$/);
		});

		it('copies an object with its content, and selects the copy', () => {
			_setModelData(
				editor.model,
				'[<table><tableRow><tableCell><paragraph>x</paragraph></tableCell></tableRow></table>]'
			);

			editor.execute('duplicateElement');

			expect(_getModelData(editor.model)).toBe(
				'<table><tableRow><tableCell><paragraph>x</paragraph></tableCell></tableRow></table>' +
					'[<table><tableRow><tableCell><paragraph>x</paragraph></tableCell></tableRow></table>]'
			);
		});
	});

	describe('deleteElement', () => {
		it('deletes the element', () => {
			_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b[]</paragraph><paragraph>c</paragraph>');

			editor.execute('deleteElement');

			expect(getData()).toBe('<paragraph>a</paragraph><paragraph>c</paragraph>');
		});

		it('leaves an empty paragraph, with the selection, in a parent it was the only element of', () => {
			_setModelData(editor.model, '<container><paragraph>a[]</paragraph></container><paragraph>b</paragraph>');

			editor.execute('deleteElement');

			expect(_getModelData(editor.model)).toBe(
				'<container><paragraph>[]</paragraph></container><paragraph>b</paragraph>'
			);
		});

		it('leaves the editor with a paragraph when it deletes the last element', () => {
			_setModelData(editor.model, '[<imageBlock src="x.png"></imageBlock>]');

			editor.execute('deleteElement');

			expect(getData()).toBe('<paragraph></paragraph>');
		});
	});

	describe('all of them', () => {
		const names = ['moveElementUp', 'moveElementDown', 'duplicateElement', 'deleteElement'] as const;

		it('are disabled for the parts of a structure, such as table cells and rows', () => {
			_setModelData(
				editor.model,
				'<paragraph>[]a</paragraph><table><tableRow><tableCell><paragraph>b</paragraph></tableCell>' +
					'<tableCell><paragraph>c</paragraph></tableCell></tableRow>' +
					'<tableRow><tableCell><paragraph>d</paragraph></tableCell><tableCell><paragraph>e</paragraph></tableCell></tableRow></table>'
			);

			for (const name of names) {
				expect([name, isEnabled(name, child(1, 0, 1))]).toEqual([name, false]);
				expect([name, isEnabled(name, child(1, 1))]).toEqual([name, false]);
			}

			const data = getData();

			for (const name of names) {
				editor.commands.get(name)!.executeFor(child(1, 0, 1));
				// With the target, `editor.execute()` checks it too, not only the selection, where they are enabled.
				editor.execute(name, child(1, 0, 1));
			}

			expect(getData()).toBe(data);
		});

		it('are disabled in read-only mode', () => {
			_setModelData(editor.model, '<paragraph>a</paragraph><paragraph>b[]</paragraph><paragraph>c</paragraph>');
			editor.enableReadOnlyMode('test');

			for (const name of names) {
				expect([name, editor.commands.get(name)!.isEnabled]).toEqual([name, false]);
			}
		});

		it('are disabled for an element that is removed', () => {
			_setModelData(editor.model, '<paragraph>a[]</paragraph><paragraph>b</paragraph><paragraph>c</paragraph>');

			const removed = child(1);

			editor.model.change(writer => {
				writer.remove(removed);
			});

			for (const name of names) {
				expect([name, isEnabled(name, removed)]).toEqual([name, false]);
			}
		});
	});
});
