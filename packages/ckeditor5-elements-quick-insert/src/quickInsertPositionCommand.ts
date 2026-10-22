import { type Editor, type ModelPosition } from 'ckeditor5';
import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';

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
 * Requires the `QuickInsert` plugin, which registers it as `quickInsertBefore` and `quickInsertAfter`.
 */
export default class QuickInsertPositionCommand extends ElementOrPositionCommand {
	/**
	 * Where the quick insert menu inserts, relative to the element.
	 */
	public readonly placement: QuickInsertPlacement;

	constructor(editor: Editor, placement: QuickInsertPlacement) {
		super(editor);

		this.placement = placement;
		this.title = placement === 'before' ? editor.t('Insert before') : editor.t('Insert after');
	}

	/**
	 * Opens the quick insert menu for the position before or after the element, next to the element.
	 */
	public override execute(positionOrElement?: PositionOrElement): void {
		const editor = this.editor;
		const element = this._getElement(positionOrElement);
		const position = this._getInsertPosition(positionOrElement);

		if (!element || !position) {
			return;
		}

		const viewElement = editor.editing.mapper.toViewElement(element);
		const domElement = viewElement && editor.editing.view.domConverter.mapViewToDom(viewElement);

		editor.plugins.get('QuickInsert').open(position, domElement ?? undefined);
	}

	protected override _isEnabledFor(positionOrElement?: PositionOrElement): boolean {
		const position = this._getInsertPosition(positionOrElement);
		const plugins = this.editor.plugins;

		return (
			!!position &&
			this.editor.model.canEditAt(position) &&
			plugins.has('QuickInsert') &&
			plugins.get('QuickInsert').getItems(position).length > 0
		);
	}

	private _getInsertPosition(positionOrElement?: PositionOrElement): ModelPosition | null {
		const element = this._getElement(positionOrElement);
		const model = this.editor.model;

		if (!element) {
			return null;
		}

		return this.placement === 'before' ? model.createPositionBefore(element) : model.createPositionAfter(element);
	}
}
