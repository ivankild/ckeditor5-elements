import { type Editor, type ModelElement, type ModelPosition, type ModelWriter } from 'ckeditor5';
import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements-core';
import { insertIcon } from './icons.js';

/**
 * Inserts an element by its model name at a position, or opens the quick insert menu for that position.
 *
 * The target comes first, as in every {@link ElementOrPositionCommand}: a position, an element (meaning the position
 * before it), or none (the selection).
 *
 * ```ts
 * editor.execute('quickInsert', position, 'heading1'); // Inserts a heading at the position.
 * editor.execute('quickInsert'); // Opens the quick insert menu at the selection.
 * ```
 *
 * Only elements that the schema allows at exactly that position are inserted (see {@link getAllowedElements}):
 * nothing is split to make room, so e.g. a heading cannot be inserted inside a paragraph.
 *
 * After inserting, objects are selected; other elements get the selection inside them, in a new paragraph when they
 * can hold blocks.
 */
export default class QuickInsertCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = editor.t('Insert element');
		this.icon = insertIcon;
	}

	/**
	 * Returns the names of the model elements allowed at exactly the position (or the selection), in the order they
	 * were registered. Generic items (such as `$text` or `$block`) and the excluded names are skipped.
	 */
	public getAllowedElements(elementOrPosition?: ElementOrPosition, exclude: readonly string[] = []): string[] {
		const target = this._getPosition(elementOrPosition);

		if (!target) {
			return [];
		}

		const schema = this.editor.model.schema;

		return Object.keys(schema.getDefinitions()).filter(
			name => !name.startsWith('$') && !exclude.includes(name) && schema.checkChild(target, name)
		);
	}

	/**
	 * Returns the position where elements are inserted for the target: the position, the position before the element,
	 * or the selection.
	 */
	public getInsertPosition(elementOrPosition?: ElementOrPosition): ModelPosition | null {
		return this._getPosition(elementOrPosition);
	}

	/**
	 * Inserts the element named `name` at the target, when the schema allows it there. Without a name, opens the quick
	 * insert menu for the target (requires the `QuickInsert` plugin).
	 */
	public override execute(elementOrPosition?: ElementOrPosition, name?: string): void {
		if (name === undefined) {
			const plugins = this.editor.plugins;

			if (plugins.has('QuickInsert')) {
				plugins.get('QuickInsert').open(elementOrPosition);
			}

			return;
		}

		const model = this.editor.model;
		const target = this._getPosition(elementOrPosition);

		if (!target || !model.canEditAt(target) || !model.schema.checkChild(target, name)) {
			return;
		}

		model.change(writer => {
			const element = writer.createElement(name);

			writer.insert(element, target);
			this._setSelection(writer, element);
		});
	}

	private _setSelection(writer: ModelWriter, element: ModelElement): void {
		const schema = this.editor.model.schema;

		if (schema.isObject(element)) {
			writer.setSelection(element, 'on');
		} else if (schema.checkChild(element, '$text')) {
			writer.setSelection(element, 0);
		} else if (schema.checkChild(element, 'paragraph')) {
			const paragraph = writer.createElement('paragraph');

			writer.append(paragraph, element);
			writer.setSelection(paragraph, 0);
		} else {
			// Only objects can be selected as a whole. The selection post-fixer moves it to the closest valid place.
			writer.setSelection(element, 'after');
		}
	}
}
