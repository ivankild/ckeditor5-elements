import { Paragraph, _getModelData, _setModelData, type ClassicEditor, type Editor } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ElementBlockCommand from '../../src/commands/elementBlockCommand.js';
import ElementInlineCommand from '../../src/commands/elementInlineCommand.js';
import ElementInsertCommand from '../../src/commands/elementInsertCommand.js';
import ElementListCommand from '../../src/commands/elementListCommand.js';
import { createEditor } from '../../../../testUtils/editor.js';

/**
 * An element of each kind, with a `type` attribute: `mark` in a line of text, a `heading`, a `rule` that is inserted,
 * and two lists of `item`s.
 */
function Elements(editor: Editor): void {
	const schema = editor.model.schema;
	const views = { mark: 'span', heading: 'h2', rule: 'hr', list: 'ul', steps: 'ol', item: 'li' };

	schema.register('mark', {
		allowWhere: '$text',
		allowContentOf: '$block',
		isInline: true,
		allowAttributes: ['type']
	});
	schema.register('heading', { inheritAllFrom: '$block', allowAttributes: ['type'] });
	schema.register('rule', { inheritAllFrom: '$blockObject', allowAttributes: ['type'] });
	schema.register('list', { allowWhere: '$block', allowAttributes: ['type'] });
	schema.register('steps', { allowWhere: '$block' });
	schema.register('item', { allowIn: ['list', 'steps'], allowContentOf: '$root' });

	for (const [model, view] of Object.entries(views)) {
		editor.conversion.elementToElement({ model, view });
		editor.conversion.attributeToAttribute({ model: { name: model, key: 'type' }, view: 'data-type' });
	}
}

describe('elementAttributes of the commands of each kind', () => {
	let editor: ClassicEditor;

	const getData = (): string => _getModelData(editor.model);
	const execute = (command: { execute: () => void }, data: string): string => {
		_setModelData(editor.model, data);
		command.execute();

		return getData();
	};

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Elements] });
	});

	afterEach(async () => {
		await editor.destroy();
	});

	describe('ElementInlineCommand', () => {
		let command: ElementInlineCommand;

		beforeEach(() => {
			command = new ElementInlineCommand(editor, 'mark');
			command.elementAttributes = { type: 'note' };
		});

		it('wraps text with an element with the attributes', () => {
			expect(execute(command, '<paragraph>a[b]c</paragraph>')).toBe(
				'<paragraph>a<mark type="note">[b]</mark>c</paragraph>'
			);
		});

		it('inserts an element with the attributes at the cursor', () => {
			expect(execute(command, '<paragraph>a[]c</paragraph>')).toBe(
				'<paragraph>a<mark type="note">[]</mark>c</paragraph>'
			);
		});

		it('merges a new element only with the ones next to it with the same attributes', () => {
			expect(execute(command, '<paragraph><mark type="note">a</mark>[b]<mark>c</mark></paragraph>')).toBe(
				'<paragraph><mark type="note">a[b]</mark><mark>c</mark></paragraph>'
			);
		});

		it('is on only in an element with the attributes', () => {
			_setModelData(editor.model, '<paragraph><mark>a[]b</mark></paragraph>');
			command.refresh();
			expect(command.isOn).toBe(false);

			_setModelData(editor.model, '<paragraph><mark type="note">a[]b</mark></paragraph>');
			command.refresh();
			expect(command.isOn).toBe(true);
		});
	});

	describe('ElementBlockCommand', () => {
		let command: ElementBlockCommand;

		beforeEach(() => {
			command = new ElementBlockCommand(editor, 'heading');
			command.elementAttributes = { type: 'note' };
		});

		it('renames blocks to the element, with the attributes', () => {
			expect(execute(command, '<paragraph>a[]b</paragraph>')).toBe('<heading type="note">a[]b</heading>');
		});

		it('gives the attributes to a block of the element without them', () => {
			expect(execute(command, '<heading>a[]b</heading>')).toBe('<heading type="note">a[]b</heading>');
		});

		it('turns an element with the attributes back into a paragraph, without them', () => {
			expect(execute(command, '<heading type="note">a[]b</heading>')).toBe('<paragraph>a[]b</paragraph>');
		});
	});

	describe('ElementInsertCommand', () => {
		it('inserts an element with the attributes', () => {
			const command = new ElementInsertCommand(editor, 'rule');

			command.elementAttributes = { type: 'note' };

			expect(execute(command, '<paragraph>a[]</paragraph>')).toBe(
				'<paragraph>a</paragraph>[<rule type="note"></rule>]'
			);
		});
	});

	describe('ElementListCommand', () => {
		let command: ElementListCommand;

		beforeEach(() => {
			command = new ElementListCommand(editor, 'list', 'item', ['steps']);
			command.elementAttributes = { type: 'note' };
		});

		it('takes the name of its items and the other lists with them', () => {
			expect(command.itemName).toBe('item');
			expect(Array.from(command.otherLists)).toEqual(['steps']);
			expect(new ElementListCommand(editor, 'list', 'item').otherLists.size).toBe(0);
		});

		it('makes a list with the attributes', () => {
			expect(execute(command, '<paragraph>a[]</paragraph>')).toBe(
				'<list type="note"><item><paragraph>a[]</paragraph></item></list>'
			);
		});

		it('turns another list with the same items into its own, with the attributes', () => {
			expect(execute(command, '<steps><item><paragraph>a[]</paragraph></item></steps>')).toBe(
				'<list type="note"><item><paragraph>a[]</paragraph></item></list>'
			);
		});

		it('gives the attributes to a list of the element without them, and unwraps a list with them', () => {
			expect(execute(command, '<list><item><paragraph>a[]</paragraph></item></list>')).toBe(
				'<list type="note"><item><paragraph>a[]</paragraph></item></list>'
			);
			expect(command.isOn).toBe(true);

			command.execute();

			expect(getData()).toBe('<paragraph>a[]</paragraph>');
		});
	});
});
