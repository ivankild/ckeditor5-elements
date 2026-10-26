import type { Editor, ModelElement, ModelRange } from 'ckeditor5';
import type { ElementOrPosition } from '../elementOrPositionCommand.js';
import ElementContainerCommand from './elementContainerCommand.js';

/**
 * Makes a list of the blocks, as CKEditor's list commands do, for a list of the element of its items, e.g. a bulleted
 * list: the selected blocks go in the list, each one in an item.
 *
 * ```ts
 * const command = new ElementListCommand(editor, 'bullets', 'item', ['numbers']);
 *
 * editor.commands.add('bulletedList', command);
 * editor.execute('bulletedList'); // The blocks of the selection.
 * ```
 *
 * In a list, it unwraps the list and its items, so the blocks are where the list was. In another list with the same
 * items, e.g. a numbered list, it turns that list into its own. It is "on" in a list of its own.
 */
export default class ElementListCommand extends ElementContainerCommand {
	/**
	 * The name of the element of the items of the list.
	 */
	public readonly itemName: string;

	/**
	 * The names of the other lists with the same items, which the command turns into its own.
	 */
	public readonly otherLists: ReadonlySet<string>;

	/**
	 * @param elementName The name of the element of the list.
	 * @param itemName The name of the element of its items.
	 * @param otherLists The names of the other lists with the same items, e.g. a numbered list for a bulleted one.
	 */
	constructor(editor: Editor, elementName: string, itemName: string, otherLists: Iterable<string> = []) {
		super(editor, elementName);

		this.itemName = itemName;
		this.otherLists = new Set(otherLists);
	}

	/**
	 * Unwraps the list the target is in, or turns it into this one, or wraps the blocks of the target in a new list.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const list = this._findList(elementOrPosition);
		const isOn = this._isOnFor(elementOrPosition);
		const range = list ? null : this._getWrapRange(elementOrPosition);

		this.editor.model.change(writer => {
			if (list && isOn) {
				this._keepSelection(writer, () => {
					for (const item of Array.from(list.getChildren())) {
						if (item.is('element', this.itemName)) {
							writer.unwrap(item);
						}
					}

					writer.unwrap(list);
				});
			} else if (list) {
				if (list.name !== this.elementName) {
					writer.rename(list, this.elementName);
				}

				writer.setAttributes(this.elementAttributes, list);
			} else if (range) {
				const blocks = Array.from(range.getItems({ shallow: true }));

				this._keepSelection(writer, () => {
					writer.wrap(range, this._createElement(writer));

					for (const block of blocks) {
						writer.wrap(writer.createRangeOn(block), this.itemName);
					}
				});
			}
		});
	}

	/**
	 * Enabled when the target can be edited, and is in a list with the same items, or its blocks can go in a list.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const target = this._getElementOrPosition(elementOrPosition);

		return (
			!!target &&
			this.editor.model.canEditAt(target) &&
			(!!this._findList(target) || !!this._getWrapRange(elementOrPosition))
		);
	}

	/**
	 * "On" in a list of its own.
	 */
	protected override _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		return this.isElement(this._findList(elementOrPosition));
	}

	/**
	 * Whether the list can be in place of the nodes of a range, and each node in an item.
	 */
	protected override _canWrap(range: ModelRange): boolean {
		const schema = this.editor.model.schema;
		const context = [
			...(range.start.parent as ModelElement)
				.getAncestors({ includeSelf: true })
				.filter(node => node.is('element')),
			this.elementName,
			this.itemName
		];

		return (
			schema.checkChild(range.start, this.elementName) &&
			Array.from(range.getItems({ shallow: true })).every(node =>
				schema.checkChild(context, node.is('$textProxy') ? '$text' : node)
			)
		);
	}

	/**
	 * Returns the closest list that the target is in, of this one or of another with the same items.
	 */
	private _findList(elementOrPosition?: ElementOrPosition): ModelElement | null {
		return (
			this._getAncestors(elementOrPosition).find(
				element => element.name === this.elementName || this.otherLists.has(element.name)
			) ?? null
		);
	}
}
