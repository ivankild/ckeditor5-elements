import type { ModelDocumentSelection, ModelSelection } from 'ckeditor5';
import type { ElementOrPosition } from '../elementOrPositionCommand.js';
import { selectNewElement } from '../utils.js';
import ElementCommand from './elementCommand.js';

/**
 * Inserts the element, as CKEditor's horizontal line and image commands do: an element that is not typed around text,
 * e.g. an empty one (a `divider`, or an inline `badge`), or an inline one that holds blocks (a `card`).
 *
 * ```ts
 * editor.execute('divider'); // In place of the selection.
 * editor.commands.get('divider').executeFor(element); // After the element.
 * ```
 *
 * For the selection, it replaces the selected content, as typing does; at a position, it is inserted there; for an
 * element, after it. Where the element cannot be, the blocks are split up to where it can, e.g. a block-level one in the
 * middle of a paragraph. Then it is selected, as `selectNewElement()` does: an `empty` element as a whole, and an inline
 * container gets a paragraph, with the cursor in it.
 *
 * It does not toggle: it is never "on".
 */
export default class ElementInsertCommand extends ElementCommand {
	/**
	 * Inserts a new element at the target, and selects it.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const model = this.editor.model;
		const selectable = this._getSelectable(elementOrPosition);

		if (!selectable) {
			return;
		}

		model.change(writer => {
			const element = this._createElement(writer);

			model.insertContent(element, selectable);

			if (element.parent) {
				selectNewElement(writer, element);
			}
		});
	}

	/**
	 * Enabled when the target can be edited, and the element can be there, or in one of its ancestors.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const position = this._getSelectable(elementOrPosition)?.getFirstPosition();

		return (
			!!position &&
			super._isEnabledFor(elementOrPosition) &&
			!!this.editor.model.schema.findAllowedParent(position, this.elementName)
		);
	}

	/**
	 * Returns where the element goes: the selection, or the given position, or the position after the given element.
	 */
	private _getSelectable(elementOrPosition?: ElementOrPosition): ModelSelection | ModelDocumentSelection | null {
		const model = this.editor.model;
		const target = this._getElementOrPosition(elementOrPosition);

		if (!target) {
			return null;
		}

		if (!elementOrPosition) {
			return model.document.selection;
		}

		return model.createSelection(target.is('position') ? target : model.createPositionAfter(target));
	}
}
