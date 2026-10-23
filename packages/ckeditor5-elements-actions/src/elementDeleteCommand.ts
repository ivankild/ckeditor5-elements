import { type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, isStandalone, type ElementOrPosition } from 'ckeditor5-elements-core';
import { deleteIcon } from './icons.js';

/**
 * Deletes an element. When it was the only element in its parent, e.g. in a note, the parent gets an empty paragraph
 * with the selection, so that it can still be written in.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). The command is disabled for parts of a structure, such as table
 * cells.
 */
export default class ElementDeleteCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = editor.t('Delete');
		this.icon = deleteIcon;
	}

	/**
	 * Deletes the element.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const model = this.editor.model;
		const element = this._getElement(elementOrPosition);

		if (!element || !this._isEnabledFor(element)) {
			return;
		}

		model.change(writer => {
			const parent = element.parent;

			writer.remove(element);

			// The root gets a paragraph from the editor itself.
			if (
				parent?.is('element') &&
				!parent.is('rootElement') &&
				parent.isEmpty &&
				model.schema.checkChild(parent, 'paragraph')
			) {
				const paragraph = writer.createElement('paragraph');

				writer.append(paragraph, parent);
				writer.setSelection(paragraph, 0);
			}
		});
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const model = this.editor.model;
		const element = this._getElement(elementOrPosition);

		return !!element && isStandalone(model.schema, element) && model.canEditAt(element);
	}
}
