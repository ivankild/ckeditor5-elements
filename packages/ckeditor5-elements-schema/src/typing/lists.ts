import type { ModelElement, ModelPosition, ModelWriter, Plugin, ViewDocumentEnterEvent } from 'ckeditor5';
import { findBlock } from './findBlock.js';

/**
 * Makes Enter in the item of a list make the next item: the item is split at the cursor, with what follows it in the
 * new item. In the only block of an empty item, Enter leaves the list: the block goes after the list, and the list is
 * split when the item was not the last one. Shift+Enter is left as it is. The listeners are the plugin's.
 *
 * `lists` are the names of the items, by the name of the list.
 */
export function enableListTyping(plugin: Plugin, lists: ReadonlyMap<string, string>): void {
	const editor = plugin.editor;
	const model = editor.model;

	plugin.listenTo<ViewDocumentEnterEvent>(
		editor.editing.view.document,
		'enter',
		(evt, data) => {
			const selection = model.document.selection;
			const block = findBlock(model, selection.getFirstPosition());
			const item = block?.parent;
			const list = item?.parent;

			if (
				data.isSoft ||
				!block ||
				!item?.is('element') ||
				!list?.is('element') ||
				lists.get(list.name) !== item.name ||
				!model.canEditAt(selection)
			) {
				return;
			}

			model.change(writer => {
				model.deleteContent(selection);

				const position = selection.getFirstPosition();

				if (position && !(block.isEmpty && item.childCount === 1 && leave(writer, list, item, block))) {
					splitItem(writer, position, list);
				}
			});

			data.preventDefault();
			evt.stop();
		},
		{ priority: 'high' }
	);
}

/**
 * Splits the item at the position, so that what follows the position is in the next item, with the cursor at its start.
 */
function splitItem(writer: ModelWriter, position: ModelPosition, list: ModelElement): void {
	const { position: between } = writer.split(position, list);
	const next = between.nodeAfter;

	if (next?.is('element')) {
		const block = next.getChild(0);

		writer.setSelection(
			block?.is('element') ? writer.createPositionAt(block, 0) : writer.createPositionAt(next, 0)
		);
	}
}

/**
 * Moves the block of an empty item out of the list, after it, and removes the item. The list is split after the item
 * first, so that the block is where the item was. Returns `false` when the block cannot be after the list.
 */
function leave(writer: ModelWriter, list: ModelElement, item: ModelElement, block: ModelElement): boolean {
	if (!writer.model.schema.checkChild(writer.createPositionAfter(list), block)) {
		return false;
	}

	if (item.nextSibling) {
		writer.split(writer.createPositionAfter(item));
	}

	writer.move(writer.createRangeOn(block), writer.createPositionAfter(list));
	writer.remove(item);

	if (list.isEmpty) {
		writer.remove(list);
	}

	writer.setSelection(block, 0);

	return true;
}
