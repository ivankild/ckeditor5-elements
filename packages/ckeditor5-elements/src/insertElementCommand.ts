import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements-core';

/**
 * Inserts an `element` model element and selects it.
 *
 * Without a target, the element replaces the selected content. With a position, it is inserted there; with an element,
 * before that element.
 */
export default class InsertElementCommand extends ElementOrPositionCommand {
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const model = this.editor.model;
		const position = this._getPosition(elementOrPosition);

		return !!position && model.canEditAt(position) && model.schema.findAllowedParent(position, 'element') !== null;
	}

	/**
	 * Inserts an `element` model element at the target (or in place of the selected content) and selects it.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const model = this.editor.model;
		const position = elementOrPosition ? this._getPosition(elementOrPosition) : null;

		if (elementOrPosition && (!position || !model.canEditAt(position))) {
			return;
		}

		model.change(writer => {
			model.insertObject(writer.createElement('element'), position, null, { setSelection: 'on' });
		});
	}
}
