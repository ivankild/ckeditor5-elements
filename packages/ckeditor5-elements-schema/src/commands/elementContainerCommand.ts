import type { ModelElement, ModelRange } from 'ckeditor5';
import type { ElementOrPosition } from 'ckeditor5-elements-core';
import ElementSchemaCommand from './elementSchemaCommand.js';

/**
 * Wraps blocks with the element, as CKEditor's block quote command does, e.g. a `callout` that is a `container` of the
 * element schema: the selected blocks, or the block-level element of the target, go in a new element.
 *
 * ```ts
 * editor.execute('callout'); // The blocks of the selection.
 * editor.commands.get('callout').executeFor(paragraph);
 * ```
 *
 * In the element, it unwraps it: the whole element, not only the selected blocks.
 *
 * It is "on" when the target is in the element.
 */
export default class ElementContainerCommand extends ElementSchemaCommand {
	public override isToggleable = true;

	/**
	 * Unwraps the element the target is in, or wraps the blocks of the target with a new one.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const element = this._findElement(elementOrPosition);
		const range = element ? null : this._getWrapRange(elementOrPosition);

		this.editor.model.change(writer => {
			if (element) {
				writer.unwrap(element);
			} else if (range) {
				writer.wrap(range, this.elementName);
			}
		});
	}

	/**
	 * Enabled when the target can be edited, and the element it is in can be unwrapped, or its blocks can be wrapped.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const element = this._findElement(elementOrPosition);

		return (
			super._isEnabledFor(elementOrPosition) &&
			(element ? this._canUnwrap(element) : !!this._getWrapRange(elementOrPosition))
		);
	}

	/**
	 * "On" when the target is in the element.
	 */
	protected override _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		return !!this._findElement(elementOrPosition);
	}

	/**
	 * Returns the range to wrap: from the first block of the target to the last, as siblings: the blocks themselves, or
	 * their ancestors in the parent they share. `null` when the schema does not allow the element there.
	 */
	private _getWrapRange(elementOrPosition?: ElementOrPosition): ModelRange | null {
		const model = this.editor.model;
		const blocks = this._getBlocks(elementOrPosition);
		const first = blocks[0] as ModelElement | undefined;
		const last = blocks.at(-1);

		if (!first || !last) {
			return null;
		}

		const parent = first === last ? first.parent : first.getCommonAncestor(last);
		const [start, end] = [first, last].map(block =>
			block.getAncestors({ includeSelf: true }).find((node): node is ModelElement => node.parent === parent)
		);

		if (!start || !end) {
			return null;
		}

		const range = model.createRange(model.createPositionBefore(start), model.createPositionAfter(end));

		return this._canHold(range.start, range.getItems({ shallow: true })) ? range : null;
	}
}
