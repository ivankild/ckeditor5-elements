import { uid, type Editor } from 'ckeditor5';
import {
	ElementOrPositionCommand,
	isStandalone,
	selectNewElement,
	type ElementOrPosition
} from 'ckeditor5-elements-core';
import { duplicateIcon } from './icons.js';

/**
 * Duplicates an element: inserts the same element, empty, after it, and puts the selection in it: in the copy of an
 * element that holds text, or in a new paragraph in the copy of an element that holds blocks.
 *
 * The copy has the same name and attributes. A list item gets a new list item id, so it is a new list item, not a second
 * block of the same one. Objects, e.g. an image or a table, are copied with their content, as they cannot be empty.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). The command is disabled for parts of a structure, such as table
 * cells.
 */
export default class ElementDuplicateCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = editor.t('Duplicate');
		this.icon = duplicateIcon;
	}

	/**
	 * Inserts the copy of the element after it.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const model = this.editor.model;
		const element = this._requireElement(elementOrPosition);

		model.change(writer => {
			const copy = writer.cloneElement(element, model.schema.isObject(element));

			// CKEditor's lists tell their items apart by `listItemId`: the copy of an item is an item of its own.
			if (copy.hasAttribute('listItemId')) {
				writer.setAttribute('listItemId', uid(), copy);
			}

			writer.insert(copy, writer.createPositionAfter(element));
			selectNewElement(writer, copy);
		});
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const model = this.editor.model;
		const element = this._getElement(elementOrPosition);

		if (!element || !isStandalone(model.schema, element)) {
			return false;
		}

		const position = model.createPositionAfter(element);

		return model.canEditAt(position) && model.schema.checkChild(position, element);
	}
}
