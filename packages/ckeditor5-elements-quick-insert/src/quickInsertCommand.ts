import { Command, type ModelElement, type ModelPosition, type ModelWriter } from 'ckeditor5';

/**
 * Inserts an element by its model name, at the given position or at the selection.
 *
 * Only elements that the schema allows at exactly that position are inserted (see {@link #getAllowedElements}):
 * nothing is split to make room, so e.g. a heading cannot be inserted inside a paragraph.
 *
 * After inserting, objects are selected; other elements get the selection inside them, in a new paragraph when they
 * can hold blocks.
 */
export default class QuickInsertCommand extends Command {
	public override refresh(): void {
		const position = this._getPosition();

		this.isEnabled = !!position && this.editor.model.canEditAt(position);
	}

	/**
	 * Returns the names of the model elements allowed at exactly the position (or the selection), in the order they
	 * were registered. Generic items (such as `$text` or `$block`) and the excluded names are skipped.
	 */
	public getAllowedElements(position?: ModelPosition, exclude: readonly string[] = []): string[] {
		const target = this._getPosition(position);

		if (!target) {
			return [];
		}

		const schema = this.editor.model.schema;

		return Object.keys(schema.getDefinitions()).filter(
			name => !name.startsWith('$') && !exclude.includes(name) && schema.checkChild(target, name)
		);
	}

	public override execute(name: string, position?: ModelPosition): void {
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

	private _getPosition(position?: ModelPosition): ModelPosition | null {
		return position ?? this.editor.model.document.selection.getFirstPosition();
	}
}
