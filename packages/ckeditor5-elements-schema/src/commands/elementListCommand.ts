import { ModelLivePosition, type ModelElement, type ModelRange, type ModelWriter } from 'ckeditor5';
import type { ElementOrPosition } from 'ckeditor5-elements-core';
import { getLists } from '../definition/queries.js';
import ElementContainerCommand from './elementContainerCommand.js';

/**
 * Makes a list of the blocks, as CKEditor's list commands do, for a list of the element schema (a `container` with a
 * `listItem`), e.g. a bulleted list: the selected blocks go in the list, each one in an item.
 *
 * ```ts
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
	 * The lists of the schema, by name, with the names of their items.
	 */
	private readonly _lists: ReadonlyMap<string, string>;

	constructor(...args: ConstructorParameters<typeof ElementContainerCommand>) {
		super(...args);

		this._lists = getLists(this.editor.config.get('elementSchema') ?? {});
		this.itemName = this._lists.get(this.elementName) ?? '';
	}

	/**
	 * Unwraps the list the target is in, or turns it into this one, or wraps the blocks of the target in a new list.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const list = this._findList(elementOrPosition);
		const range = list ? null : this._getWrapRange(elementOrPosition);

		this.editor.model.change(writer => {
			if (list?.name === this.elementName) {
				this._keepSelection(writer, () => {
					for (const item of Array.from(list.getChildren())) {
						if (item.is('element', this.itemName)) {
							writer.unwrap(item);
						}
					}

					writer.unwrap(list);
				});
			} else if (list) {
				writer.rename(list, this.elementName);
			} else if (range) {
				const blocks = Array.from(range.getItems({ shallow: true }));

				this._keepSelection(writer, () => {
					writer.wrap(range, this.elementName);

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
		return this._findList(elementOrPosition)?.name === this.elementName;
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
	 * Changes the blocks of the list, and selects the same content then: wrapping or unwrapping each block moves it,
	 * which the selection does not follow, but its ends do, in the text.
	 */
	private _keepSelection(writer: ModelWriter, change: () => void): void {
		const selection = this.editor.model.document.selection;
		const backward = selection.isBackward;
		const ends = Array.from(selection.getRanges(), range => ({
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
	 * Returns the closest list that the target is in, of this one or of another with the same items.
	 */
	private _findList(elementOrPosition?: ElementOrPosition): ModelElement | null {
		return (
			this._getAncestors(elementOrPosition).find(element => this._lists.get(element.name) === this.itemName) ??
			null
		);
	}
}
