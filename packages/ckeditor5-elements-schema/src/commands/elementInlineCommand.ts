import {
	ModelLivePosition,
	ModelLiveRange,
	type ModelDocumentFragment,
	type ModelElement,
	type ModelNode,
	type ModelRange,
	type ModelWriter
} from 'ckeditor5';
import type { ElementOrPosition } from 'ckeditor5-elements-core';
import ElementSchemaCommand from './elementSchemaCommand.js';

/**
 * Toggles an inline element with text, as CKEditor's `bold` toggles an attribute of text, but with an element, e.g. a
 * `bold` that is an inline `block` of the element schema.
 *
 * ```ts
 * editor.execute('bold'); // The selection.
 * editor.commands.get('bold').executeFor(element); // An element, e.g. of a context menu.
 * ```
 *
 * * On selected text, it wraps the text with the element, in each block, and merges it with the elements next to it.
 *   When all the text is in the element already, it unwraps the elements: the whole ones, not only the selected part.
 * * On the cursor, it inserts an empty element with the cursor in it. In the element, it moves the cursor out of it, at
 *   its start or end, or it unwraps it.
 * * On an element (selected, or given), it unwraps the element it is in, or wraps it.
 *
 * It is "on" ({@link isOn}) when the target is in the element: for selected text, when all of it is.
 */
export default class ElementInlineCommand extends ElementSchemaCommand {
	public override isToggleable = true;

	/**
	 * Puts the target in the element, or out of it: by default, the selection, also selected text.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const ranges = this._getSelectedRanges(elementOrPosition);
		const target = this._getElementOrPosition(elementOrPosition);

		this.editor.model.change(writer => {
			if (ranges) {
				if (this._isOnRanges(ranges)) {
					this._unwrapRanges(writer, ranges);
				} else {
					this._wrapRanges(writer, ranges);
				}
			} else if (target) {
				const element = this._findElement(target);

				if (element) {
					this._leave(writer, element, target);
				} else {
					this._insert(writer, target);
				}
			}
		});
	}

	/**
	 * Enabled when the target can be edited, and is in the element, or the element can be there.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const ranges = this._getSelectedRanges(elementOrPosition);
		const target = this._getElementOrPosition(elementOrPosition);

		if (!target || !super._isEnabledFor(target)) {
			return false;
		}

		if (ranges) {
			return this._isOnRanges(ranges) || this._getWrapRanges(ranges).length > 0;
		}

		if (this._findElement(target)) {
			return true;
		}

		return target.is('position')
			? this.editor.model.schema.checkChild(target, this.elementName)
			: this._canHold(this.editor.model.createPositionBefore(target), [target]);
	}

	/**
	 * "On" when the target is in the element: for selected text, when all of it is.
	 */
	protected override _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		const ranges = this._getSelectedRanges(elementOrPosition);
		const target = this._getElementOrPosition(elementOrPosition);

		return ranges ? this._isOnRanges(ranges) : !!target && !!this._findElement(target);
	}

	/**
	 * Whether all the text of the ranges is in the element: there are elements, and nothing to wrap.
	 */
	private _isOnRanges(ranges: ModelRange[]): boolean {
		return this._getElementsIn(ranges).length > 0 && !this._getWrapRanges(ranges).length;
	}

	/**
	 * Returns the elements of the command that a node is, or is in, in its line of text: the node and its ancestors, up to
	 * the first that is not inline, e.g. the paragraph. The inner first.
	 */
	private _getElementsAround(node: ModelElement | ModelDocumentFragment | null): ModelElement[] {
		const schema = this.editor.model.schema;
		const elements: ModelElement[] = [];

		for (let element = node; element?.is('element') && schema.isInline(element); element = element.parent) {
			if (this.isElement(element)) {
				elements.push(element);
			}
		}

		return elements;
	}

	/**
	 * Returns the closest element of the command that the target is, or is in, in its line of text.
	 */
	protected override _findElement(elementOrPosition?: ElementOrPosition): ModelElement | null {
		const target = this._getElementOrPosition(elementOrPosition);

		return target ? (this._getElementsAround(target.is('position') ? target.parent : target)[0] ?? null) : null;
	}

	/**
	 * Returns the elements of the command in ranges, and around their ends.
	 */
	private _getElementsIn(ranges: ModelRange[]): ModelElement[] {
		const elements = new Set<ModelElement>();

		for (const range of ranges) {
			for (const element of [
				...this._getElementsAround(range.start.parent),
				...this._getElementsAround(range.end.parent)
			]) {
				elements.add(element);
			}

			for (const item of range.getItems()) {
				if (this.isElement(item)) {
					elements.add(item);
				}
			}
		}

		return Array.from(elements);
	}

	/**
	 * Returns the ranges to wrap with the element to put the text of ranges in it: in each parent the element is allowed
	 * in, the runs of nodes it can hold, which are not in the element already. The other elements are looked into, e.g.
	 * the paragraphs of a selection across blocks.
	 */
	private _getWrapRanges(ranges: ModelRange[]): ModelRange[] {
		const model = this.editor.model;
		const wrapRanges: ModelRange[] = [];

		const collect = (flatRange: ModelRange): void => {
			const parent = flatRange.start.parent as ModelElement;

			if (this._getElementsAround(parent).length) {
				return;
			}

			let run: ModelRange | null = null;
			const close = (): void => {
				if (run) {
					wrapRanges.push(run);
					run = null;
				}
			};

			for (const item of flatRange.getItems({ shallow: true })) {
				if (this.isElement(item)) {
					close();
				} else if (this._canHold(flatRange.start, [item])) {
					run = model.createRange(
						run?.start ?? model.createPositionBefore(item),
						model.createPositionAfter(item)
					);
				} else {
					close();

					if (item.is('element')) {
						collect(model.createRangeIn(item));
					}
				}
			}

			close();
		};

		for (const range of ranges) {
			range.getMinimalFlatRanges().forEach(collect);
		}

		return wrapRanges;
	}

	/**
	 * Wraps the text of ranges with new elements, merged with the ones next to them, and keeps the selection on the text.
	 */
	private _wrapRanges(writer: ModelWriter, ranges: ModelRange[]): void {
		// The last first: wrapping one does not move the ones before it.
		const wrapRanges = this._getWrapRanges(ranges).reverse();

		this._keepSelection(writer, ranges, () => {
			for (const range of wrapRanges) {
				const element = writer.createElement(this.elementName);

				writer.wrap(range, element);
				this._mergeWithSiblings(writer, element);
			}
		});
	}

	/**
	 * Unwraps the elements in ranges and around their ends, and keeps the selection on the text.
	 */
	private _unwrapRanges(writer: ModelWriter, ranges: ModelRange[]): void {
		const elements = this._getElementsIn(ranges);

		this._keepSelection(writer, ranges, () => {
			for (const element of elements) {
				writer.unwrap(element);
			}
		});
	}

	/**
	 * Changes the content of the selected ranges, and selects the same text then: the ends of the ranges stick to the
	 * text, so they follow it into the elements and out of them.
	 */
	private _keepSelection(writer: ModelWriter, ranges: ModelRange[], change: () => void): void {
		const backward = this.editor.model.document.selection.isBackward;
		const ends = ranges.map(range => ({
			start: ModelLivePosition.fromPosition(range.start, 'toNext'),
			end: ModelLivePosition.fromPosition(range.end, 'toPrevious')
		}));

		change();
		writer.setSelection(
			ends.map(({ start, end }) => writer.createRange(start, end)),
			{ backward }
		);

		for (const { start, end } of ends) {
			start.detach();
			end.detach();
		}
	}

	/**
	 * Merges a new element with the elements of the command next to it that have no attributes, as it has none.
	 */
	private _mergeWithSiblings(writer: ModelWriter, element: ModelElement): void {
		const isPlain = (node: ModelNode | null): boolean =>
			this.isElement(node) && node.getAttributeKeys().next().done === true;

		if (isPlain(element.nextSibling)) {
			writer.merge(writer.createPositionAfter(element));
		}

		if (isPlain(element.previousSibling)) {
			writer.merge(writer.createPositionBefore(element));
		}
	}

	/**
	 * Puts the target out of the element it is in: a cursor at the start or the end of the element goes before or after
	 * it, so that what is typed next is out of it; otherwise the element is unwrapped. A selected element that is
	 * unwrapped leaves its content selected.
	 */
	private _leave(writer: ModelWriter, element: ModelElement, target: ElementOrPosition): void {
		if (target.is('position') && target.parent === element && !element.isEmpty) {
			if (target.isAtEnd || target.isAtStart) {
				writer.setSelection(element, target.isAtEnd ? 'after' : 'before');

				return;
			}
		}

		const isSelected = this.editor.model.document.selection.getSelectedElement() === element;
		const content = ModelLiveRange.fromRange(writer.createRangeIn(element));

		writer.unwrap(element);

		if (isSelected) {
			writer.setSelection(content.toRange());
		}

		content.detach();
	}

	/**
	 * Puts the target in a new element: at a position, an empty element with the cursor in it; an element, e.g. a
	 * selected inline object, is wrapped, and selected.
	 */
	private _insert(writer: ModelWriter, target: ElementOrPosition): void {
		if (target.is('position')) {
			const element = writer.createElement(this.elementName);

			writer.insert(element, target);
			writer.setSelection(element, 0);
		} else {
			writer.wrap(writer.createRangeOn(target), this.elementName);
			writer.setSelection(target, 'on');
		}
	}
}
