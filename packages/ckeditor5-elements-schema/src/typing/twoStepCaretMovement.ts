import {
	isForwardArrowKeyCode,
	keyCodes,
	type Editor,
	type ModelDocumentFragment,
	type ModelNode,
	type ModelPosition,
	type Plugin,
	type ViewDocumentInsertTextEvent,
	type ViewDocumentKeyDownEvent
} from 'ckeditor5';

/**
 * Makes the left and right arrow keys move in two steps at the ends of inline elements, as CKEditor's two-step caret
 * movement does at the ends of a bold: the first step goes into the element (or out of it), where the cursor looks the
 * same, the next one moves in the text. `a[]<b>bc</b>` is `a<b>[]bc</b>`, then `a<b>b[]c</b>`. The browser would move by
 * a character at once, and the positions on both sides of the end of an element would be out of reach.
 *
 * What is typed then goes where the cursor is. The listeners are the plugin's.
 */
export function enableTwoStepCaretMovement(plugin: Plugin, names: ReadonlySet<string>): void {
	const editor = plugin.editor;
	const viewDocument = editor.editing.view.document;
	const isElement = (node: ModelNode | ModelDocumentFragment | null): node is ModelNode =>
		!!node?.is('element') && names.has(node.name);

	// Before the other features: e.g. `ElementSelectable` selects an inline object that the cursor reaches, and it may
	// be just after the end of an element.
	plugin.listenTo<ViewDocumentKeyDownEvent>(
		viewDocument,
		'keydown',
		(evt, data) => {
			const isPlain = !data.shiftKey && !data.ctrlKey && !data.altKey && !data.metaKey;
			const isHorizontal = data.keyCode === keyCodes.arrowleft || data.keyCode === keyCodes.arrowright;
			const isForward = isForwardArrowKeyCode(data.keyCode, editor.locale.contentLanguageDirection);
			const position = isPlain && isHorizontal ? getStep(editor, isForward, isElement) : null;

			if (position) {
				editor.model.change(writer => {
					writer.setSelection(position);
				});
				data.preventDefault();
				evt.stop();
			}
		},
		{ priority: 'highest' }
	);

	// The browser types at a place of its own at an end of an element, e.g. at the end of the text before it, whichever
	// side of the end the cursor is on. When that place differs from the cursor only by ends of elements, the text goes
	// where the cursor is: at the view selection, which is the model one. The browser must not type it at its place, as
	// CKEditor does for a fake selection; a composition is left to the browser.
	plugin.listenTo<ViewDocumentInsertTextEvent>(
		viewDocument,
		'insertText',
		(evt, data) => {
			const target = data.selection?.rangeCount === 1 ? data.selection.getFirstRange() : null;
			const position = target?.isCollapsed ? editor.editing.mapper.toModelPosition(target.start) : null;

			if (position && !data.isComposing && isAtCursor(editor, position, isElement)) {
				data.selection = viewDocument.selection;
				data.preventDefault();
			}
		},
		{ priority: 'high' }
	);
}

/**
 * Returns where the cursor goes with one step in the direction, when it is at an end of an element: into the element
 * next to it, or out of the element it is in. `null` elsewhere, or for a selection that is not collapsed.
 */
function getStep(
	editor: Editor,
	isForward: boolean,
	isElement: (node: ModelNode | ModelDocumentFragment | null) => node is ModelNode
): ModelPosition | null {
	const model = editor.model;
	const selection = model.document.selection;
	const position = selection.getFirstPosition();

	if (!selection.isCollapsed || !position) {
		return null;
	}

	const next = isForward ? position.nodeAfter : position.nodeBefore;

	if (isElement(next)) {
		return model.createPositionAt(next, isForward ? 0 : 'end');
	}

	if ((isForward ? position.isAtEnd : position.isAtStart) && isElement(position.parent)) {
		return isForward ? model.createPositionAfter(position.parent) : model.createPositionBefore(position.parent);
	}

	return null;
}

/**
 * Whether a position differs from the cursor only by ends of elements: `a[]<b>c</b>` and `a<b>[]c</b>` look the same.
 */
function isAtCursor(
	editor: Editor,
	position: ModelPosition,
	isElement: (node: ModelNode | ModelDocumentFragment | null) => boolean
): boolean {
	const model = editor.model;
	const selection = model.document.selection;
	const cursor = selection.getFirstPosition();

	// Where the cursor is exactly, the browser types as usual.
	if (!selection.isCollapsed || !cursor || cursor.isEqual(position)) {
		return false;
	}

	const range = cursor.isBefore(position) ? model.createRange(cursor, position) : model.createRange(position, cursor);

	return Array.from(range.getWalker()).every(({ item }) => item.is('element') && isElement(item));
}
