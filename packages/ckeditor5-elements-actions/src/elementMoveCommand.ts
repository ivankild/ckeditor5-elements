import { type Editor, type ModelElement } from 'ckeditor5';
import { ElementOrPositionCommand, isStandalone, type ElementOrPosition } from 'ckeditor5-elements-core';
import { moveDownIcon, moveUpIcon } from './icons.js';

/**
 * Where the element moves.
 */
export type ElementMoveDirection = 'up' | 'down';

/**
 * Moves an element up or down: swaps it with the element before or after it, in the same parent. The selection stays
 * in the element.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). The command is disabled when there is no element before it (up) or
 * after it (down), e.g. for the first element of a note, and for parts of a structure, such as table cells.
 */
export default class ElementMoveCommand extends ElementOrPositionCommand {
	/**
	 * Where the element moves.
	 */
	public readonly direction: ElementMoveDirection;

	constructor(editor: Editor, direction: ElementMoveDirection) {
		super(editor);

		this.direction = direction;
		this.title = direction === 'up' ? editor.t('Move up') : editor.t('Move down');
		this.icon = direction === 'up' ? moveUpIcon : moveDownIcon;
	}

	/**
	 * Moves the element up or down.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const element = this._getElement(elementOrPosition);
		const sibling = element && this._getSibling(element);

		if (!element || !sibling || !this._canMove(element, sibling)) {
			return;
		}

		this.editor.model.change(writer => {
			// Either way, the selection stays in the element: it moves with the element, or the sibling moves past it.
			if (this.direction === 'up') {
				writer.move(writer.createRangeOn(element), writer.createPositionBefore(sibling));
			} else {
				writer.move(writer.createRangeOn(sibling), writer.createPositionBefore(element));
			}
		});
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const element = this._getElement(elementOrPosition);
		const sibling = element && this._getSibling(element);

		return !!element && !!sibling && this._canMove(element, sibling);
	}

	/**
	 * Returns the element the element swaps with: the one before it (up) or after it (down), if it is an element.
	 */
	private _getSibling(element: ModelElement): ModelElement | null {
		const sibling = this.direction === 'up' ? element.previousSibling : element.nextSibling;

		return sibling?.is('element') ? sibling : null;
	}

	private _canMove(element: ModelElement, sibling: ModelElement): boolean {
		const model = this.editor.model;

		return isStandalone(model.schema, element) && model.canEditAt(element) && model.canEditAt(sibling);
	}
}
