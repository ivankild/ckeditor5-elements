import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';

/**
 * Inserts an `element` model element and selects it.
 *
 * Without a target, the element replaces the selected content. With a position, it is inserted there; with an element,
 * before that element.
 */
export default class InsertElementCommand extends ElementOrPositionCommand {
	protected override _isEnabledFor(positionOrElement?: PositionOrElement): boolean {
		const model = this.editor.model;
		const position = this._getPosition(positionOrElement);

		return !!position && model.canEditAt(position) && model.schema.findAllowedParent(position, 'element') !== null;
	}

	/**
	 * Inserts an `element` model element at the target (or in place of the selected content) and selects it.
	 */
	public override execute(positionOrElement?: PositionOrElement): void {
		const model = this.editor.model;
		const position = positionOrElement ? this._getPosition(positionOrElement) : null;

		if (positionOrElement && (!position || !model.canEditAt(position))) {
			return;
		}

		model.change(writer => {
			model.insertObject(writer.createElement('element'), position, null, { setSelection: 'on' });
		});
	}
}
