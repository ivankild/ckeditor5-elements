import { type Editor, type ModelPosition } from 'ckeditor5';
import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements-core';
import { getDomTarget } from '../domTarget.js';
import type ElementQuickInsert from './elementQuickInsert.js';
import { insertAfterIcon, insertBeforeIcon } from './icons.js';

/**
 * Where the quick insert menu inserts, relative to the element.
 */
export type QuickInsertPlacement = 'before' | 'after';

/**
 * Opens the quick insert menu for the position before or after an element, next to that element.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). Enabled when something can be inserted at that position.
 *
 * The `ElementQuickInsert` plugin registers it as `quickInsertBefore` and `quickInsertAfter`, for its menu.
 */
export default class QuickInsertPositionCommand extends ElementOrPositionCommand {
	/**
	 * Where the quick insert menu inserts, relative to the element.
	 */
	public readonly placement: QuickInsertPlacement;

	/**
	 * The plugin whose menu the command opens.
	 */
	private readonly _quickInsert: ElementQuickInsert;

	constructor(editor: Editor, placement: QuickInsertPlacement, quickInsert: ElementQuickInsert) {
		super(editor);

		this.placement = placement;
		this._quickInsert = quickInsert;
		this.title = placement === 'before' ? editor.t('Insert before') : editor.t('Insert after');
		this.icon = placement === 'before' ? insertBeforeIcon : insertAfterIcon;
	}

	/**
	 * Opens the quick insert menu for the position before or after the element, next to the element.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const element = this._getElement(elementOrPosition);
		const position = this._getInsertPosition(elementOrPosition);

		if (element && position) {
			this._quickInsert.open(position, getDomTarget(this.editor, element) ?? undefined);
		}
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const position = this._getInsertPosition(elementOrPosition);

		return !!position && this.editor.model.canEditAt(position) && this._quickInsert.hasItems(position);
	}

	private _getInsertPosition(elementOrPosition?: ElementOrPosition): ModelPosition | null {
		const element = this._getElement(elementOrPosition);
		const model = this.editor.model;

		if (!element) {
			return null;
		}

		return this.placement === 'before' ? model.createPositionBefore(element) : model.createPositionAfter(element);
	}
}
