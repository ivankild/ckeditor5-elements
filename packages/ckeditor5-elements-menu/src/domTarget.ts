import { ModelPosition, type Editor } from 'ckeditor5';
import type { ElementOrPosition } from 'ckeditor5-elements-core';

/**
 * Returns what a menu for the target is shown next to: the DOM element of an element, or the DOM range of a position.
 * Without a target, the ones of the selection: its selected element, or its range. `null` when it is not rendered.
 */
export function getDomTarget(editor: Editor, target?: ElementOrPosition): HTMLElement | Range | null {
	const { mapper, view } = editor.editing;

	if (target instanceof ModelPosition) {
		return view.domConverter.viewRangeToDom(view.createRange(mapper.toViewPosition(target)));
	}

	const element = target ?? editor.model.document.selection.getSelectedElement();

	if (element) {
		const viewElement = mapper.toViewElement(element);
		const domElement = viewElement && view.domConverter.mapViewToDom(viewElement);

		return domElement instanceof HTMLElement ? domElement : null;
	}

	const viewRange = view.document.selection.getFirstRange();

	return viewRange ? view.domConverter.viewRangeToDom(viewRange) : null;
}
