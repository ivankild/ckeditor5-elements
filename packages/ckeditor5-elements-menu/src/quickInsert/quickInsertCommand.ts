import { type Editor, type ModelPosition } from 'ckeditor5';
import { ElementOrPositionCommand, selectNewElement, type ElementOrPosition } from 'ckeditor5-elements-core';
import { insertIcon } from './icons.js';

/**
 * Inserts an element by its model name at a position: what the quick insert menu does, when an element is chosen. The
 * menu itself is opened by the `ElementQuickInsert` plugin, with its `open()`.
 *
 * The target comes first, as in every {@link ElementOrPositionCommand}: a position, an element (meaning the position
 * before it), or none (the selection).
 *
 * ```ts
 * editor.execute('quickInsert', position, 'heading1'); // Inserts a heading at the position.
 * editor.execute('quickInsert', undefined, 'softBreak'); // Inserts a line break at the selection.
 * ```
 *
 * Only elements that the schema allows at exactly that position are inserted (see {@link getAllowedElements}):
 * nothing is split to make room, so e.g. a heading cannot be inserted inside a paragraph.
 *
 * After inserting, objects are selected; other elements get the selection inside them, in a new paragraph when they
 * can hold blocks.
 */
export default class QuickInsertCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = editor.t('Insert element');
		this.icon = insertIcon;
	}

	/**
	 * Returns the names of the model elements allowed at exactly the position (or the selection), in the order they
	 * were registered. Generic items (such as `$text` or `$block`) and the excluded names are skipped.
	 */
	public getAllowedElements(elementOrPosition?: ElementOrPosition, exclude: readonly string[] = []): string[] {
		return Array.from(this._getAllowedElements(elementOrPosition, exclude));
	}

	/**
	 * Whether an element is allowed at exactly the position (or the selection), as {@link getAllowedElements} returns
	 * them: it stops at the first one.
	 */
	public hasAllowedElements(elementOrPosition?: ElementOrPosition, exclude: readonly string[] = []): boolean {
		return !this._getAllowedElements(elementOrPosition, exclude).next().done;
	}

	/**
	 * Returns the position where elements are inserted for the target: the position, the position before the element,
	 * or the selection.
	 */
	public getInsertPosition(elementOrPosition?: ElementOrPosition): ModelPosition | null {
		return this._getPosition(elementOrPosition);
	}

	/**
	 * Inserts the element named `name` at the target, when the schema allows it there.
	 */
	public override execute(elementOrPosition: ElementOrPosition | undefined, name: string): void {
		const model = this.editor.model;
		const target = this._getPosition(elementOrPosition);

		if (!target || !model.canEditAt(target) || !model.schema.checkChild(target, name)) {
			return;
		}

		model.change(writer => {
			const element = writer.createElement(name);

			writer.insert(element, target);
			selectNewElement(writer, element);
		});
	}

	/**
	 * Yields the names of the elements allowed at exactly the position (or the selection), one by one.
	 */
	private *_getAllowedElements(
		elementOrPosition: ElementOrPosition | undefined,
		exclude: readonly string[]
	): Generator<string> {
		const target = this._getPosition(elementOrPosition);

		if (!target) {
			return;
		}

		const schema = this.editor.model.schema;
		const excluded = new Set(exclude);

		for (const name of Object.keys(schema.getDefinitions())) {
			if (!name.startsWith('$') && !excluded.has(name) && schema.checkChild(target, name)) {
				yield name;
			}
		}
	}
}
