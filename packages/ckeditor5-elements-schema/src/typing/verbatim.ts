import type { ModelDocumentSelection, ModelElement, ModelWriter, Plugin, ViewDocumentEnterEvent } from 'ckeditor5';
import { PARAGRAPH, findBlock, keyboardPriorities } from 'ckeditor5-elements-core';

/**
 * Makes Enter insert a new line in the verbatim blocks, whose whitespace is their content, instead of splitting them;
 * Shift+Enter too. On an empty last line, at the end of the block, Enter leaves it: the empty line is removed, and a
 * paragraph follows the block, as in CKEditor's code blocks. The listeners are the plugin's.
 */
export function enableVerbatimTyping(plugin: Plugin, names: ReadonlySet<string>): void {
	const editor = plugin.editor;
	const model = editor.model;

	plugin.listenTo<ViewDocumentEnterEvent>(
		editor.editing.view.document,
		'enter',
		(evt, data) => {
			const selection = model.document.selection;
			const block = findBlock(model, selection.getFirstPosition());

			if (!block || !names.has(block.name) || !model.canEditAt(selection)) {
				return;
			}

			model.change(writer => {
				if (!data.isSoft && isOnEmptyLastLine(selection, block) && leave(writer, block)) {
					return;
				}

				model.insertContent(writer.createText('\n', selection.getAttributes()), selection);
			});

			data.preventDefault();
			evt.stop();
		},
		{ priority: keyboardPriorities.verbatimEnter }
	);
}

/**
 * Whether the cursor is at the end of the block, on an empty line: after a new line.
 */
function isOnEmptyLastLine(selection: ModelDocumentSelection, block: ModelElement): boolean {
	const position = selection.getFirstPosition();
	const last = block.getChild(block.childCount - 1);

	return (
		selection.isCollapsed &&
		position?.parent === block &&
		position.isAtEnd &&
		!!last?.is('$text') &&
		last.data.endsWith('\n')
	);
}

/**
 * Leaves the block for a paragraph after it, without the empty last line. Returns `false` when a paragraph cannot be
 * after the block.
 */
function leave(writer: ModelWriter, block: ModelElement): boolean {
	const after = writer.createPositionAfter(block);

	if (!writer.model.schema.checkChild(after, PARAGRAPH)) {
		return false;
	}

	const paragraph = writer.createElement(PARAGRAPH);

	writer.remove(
		writer.createRange(writer.createPositionAt(block, block.maxOffset - 1), writer.createPositionAt(block, 'end'))
	);
	writer.insert(paragraph, after);
	writer.setSelection(paragraph, 0);

	return true;
}
