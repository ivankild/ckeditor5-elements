import type { Model, ModelDocumentSelection, ModelElement, ModelRange, ModelSelection } from 'ckeditor5';

/**
 * Whether an element can be selected as a whole.
 */
export type IsSelectable = (element: ModelElement) => boolean;

/**
 * Returns the selectable element that the cursor reaches with one step in the direction, as the arrow key moves it, or
 * `null`: the next element is not selectable, or the step stays in the text. The step is CKEditor's: a character in the
 * text, and the boundary between blocks, an inline object or an element at the end of a block. The first selectable
 * element the step enters or passes is the one: the outermost, when it enters nested ones.
 */
export function findSelectableAfterStep(
	model: Model,
	selection: ModelSelection | ModelDocumentSelection,
	isForward: boolean,
	isSelectable: IsSelectable
): ModelElement | null {
	const probe = model.createSelection(selection);

	model.modifySelection(probe, { direction: isForward ? 'forward' : 'backward' });

	if (!selection.focus || !probe.focus || probe.isEqual(selection)) {
		return null;
	}

	const range = isForward
		? model.createRange(selection.focus, probe.focus)
		: model.createRange(probe.focus, selection.focus);

	// The elements the step enters or passes: their start tag in the range when going forward, their end tag backward.
	const tokenType = isForward ? 'elementStart' : 'elementEnd';

	for (const { item, type } of range.getWalker({ direction: isForward ? 'forward' : 'backward' })) {
		if (type === tokenType && item.is('element') && isSelectable(item)) {
			return item;
		}
	}

	return null;
}

/**
 * Returns the range the selection goes to from the selected element in the direction: the next selectable element
 * (selected as a whole) when it is just there, otherwise the nearest place of the content, or `null` when there is none.
 */
export function findLeaveTarget(
	model: Model,
	element: ModelElement,
	isForward: boolean,
	isSelectable: IsSelectable
): ModelRange | null {
	const position = model.createPositionAt(element, isForward ? 'after' : 'before');
	const neighbour = isForward ? position.nodeAfter : position.nodeBefore;

	return neighbour?.is('element') && isSelectable(neighbour)
		? model.createRangeOn(neighbour)
		: model.schema.getNearestSelectionRange(position, isForward ? 'forward' : 'backward');
}

/**
 * Returns the closest selectable element around the selection, not the selected one, or `null`.
 */
export function findSelectableAround(
	selection: ModelSelection | ModelDocumentSelection,
	isSelectable: IsSelectable
): ModelElement | null {
	const selected = selection.getSelectedElement();

	for (
		let node = selected ? selected.parent : selection.getFirstPosition()?.parent;
		node?.is('element') && !node.is('rootElement');
		node = node.parent
	) {
		if (isSelectable(node)) {
			return node;
		}
	}

	return null;
}
