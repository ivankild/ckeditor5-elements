import { type ModelElement, type ModelWriter } from 'ckeditor5';
import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';

/**
 * Inserts an element by its model name, at the given position or at the selection (see
 * {@link ElementOrPositionCommand}). An element as the target means the position before it.
 *
 * Only elements that the schema allows at exactly that position are inserted (see {@link getAllowedElements}):
 * nothing is split to make room, so e.g. a heading cannot be inserted inside a paragraph.
 *
 * After inserting, objects are selected; other elements get the selection inside them, in a new paragraph when they
 * can hold blocks.
 */
export default class QuickInsertCommand extends ElementOrPositionCommand {
	/**
	 * Returns the names of the model elements allowed at exactly the position (or the selection), in the order they
	 * were registered. Generic items (such as `$text` or `$block`) and the excluded names are skipped.
	 */
	public getAllowedElements(position?: PositionOrElement, exclude: readonly string[] = []): string[] {
		const target = this._getPosition(position);

		if (!target) {
			return [];
		}

		const schema = this.editor.model.schema;

		return Object.keys(schema.getDefinitions()).filter(
			name => !name.startsWith('$') && !exclude.includes(name) && schema.checkChild(target, name)
		);
	}

	/**
	 * Inserts the element named `name` at the position (or the selection), when the schema allows it there.
	 */
	public override execute(name: string, position?: PositionOrElement): void {
		const model = this.editor.model;
		const target = this._getPosition(position);

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
