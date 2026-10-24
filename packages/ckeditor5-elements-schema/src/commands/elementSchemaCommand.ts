import type { Editor, ModelElement, ModelDocumentFragment, ModelItem, ModelPosition, ModelRange } from 'ckeditor5';
import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements-core';

/**
 * The base of the commands of the elements of a schema, one for each kind of element: what they share is the element,
 * the state, and how they find their targets and check the schema.
 *
 * * {@link ElementInlineCommand}: an inline element with text, as bold (an inline `block`);
 * * {@link ElementBlockCommand}: a block, as a heading (a `block`);
 * * {@link ElementContainerCommand}: a container of blocks, as a block quote (a `container`);
 * * {@link ElementInsertCommand}: an element that is inserted, as a horizontal line, an inline image, or a card (an
 *   `empty` element, and an inline `container`).
 *
 * As every {@link ElementOrPositionCommand}, it is for the selection, or for a given position or element, e.g. of a
 * context menu.
 */
export default class ElementSchemaCommand extends ElementOrPositionCommand {
	/**
	 * Whether the target is in the element, or is one, for the commands that toggle it.
	 *
	 * @observable
	 */
	declare public isOn: boolean;

	/**
	 * The name of the model element of the command.
	 */
	public readonly elementName: string;

	constructor(editor: Editor, elementName: string) {
		super(editor);

		this.elementName = elementName;
		this.set('isOn', false);
	}

	public override refresh(elementOrPosition?: ElementOrPosition): void {
		this.isOn = this._isOnFor(elementOrPosition);
		super.refresh(elementOrPosition);
	}

	/**
	 * Whether a node is an element of the command.
	 */
	public isElement(node: ModelItem | ModelDocumentFragment | null): node is ModelElement {
		return !!node?.is('element', this.elementName);
	}

	/**
	 * Returns the closest element of the command that the target is, or is in: by default, the selection. Never a root.
	 */
	protected _findElement(elementOrPosition?: ElementOrPosition): ModelElement | null {
		return this._getAncestors(elementOrPosition).find(element => this.isElement(element)) ?? null;
	}

	/**
	 * Returns the elements the target is, or is in (by default, the selection), the inner first: an element and its
	 * ancestors, or the parent of a position and its ancestors. Not the root.
	 */
	protected _getAncestors(elementOrPosition?: ElementOrPosition): ModelElement[] {
		const target = this._getElementOrPosition(elementOrPosition);
		const element = target && (target.is('position') ? target.parent : target);

		return element?.is('element')
			? element
					.getAncestors({ includeSelf: true, parentFirst: true })
					.filter((node): node is ModelElement => node.is('element') && !node.is('rootElement'))
			: [];
	}

	/**
	 * Returns the ranges of the selected content, when the command is for the selection, and the selection is content,
	 * not a cursor nor an element.
	 */
	protected _getSelectedRanges(elementOrPosition?: ElementOrPosition): ModelRange[] | null {
		const selection = this.editor.model.document.selection;

		return !elementOrPosition && !selection.isCollapsed && !selection.getSelectedElement()
			? Array.from(selection.getRanges())
			: null;
	}

	/**
	 * Returns the blocks of the target, by default of the selection: the selected blocks, or the block-level element the
	 * target is, or is in (e.g. the paragraph with the cursor, a selected horizontal line, or a block quote).
	 */
	protected _getBlocks(elementOrPosition?: ElementOrPosition): ModelElement[] {
		const selection = this.editor.model.document.selection;
		const blocks =
			elementOrPosition || selection.getSelectedElement() ? [] : Array.from(selection.getSelectedBlocks());

		if (blocks.length) {
			return blocks;
		}

		const block = this._getAncestors(elementOrPosition).find(
			element => !this.editor.model.schema.isInline(element)
		);

		return block ? [block] : [];
	}

	/**
	 * Whether an element (by default, the one of the command) can be at a position, and hold the items there: the check
	 * for wrapping them, or for renaming their parent.
	 */
	protected _canHold(position: ModelPosition, items: Iterable<ModelItem>, name = this.elementName): boolean {
		const schema = this.editor.model.schema;

		if (!schema.checkChild(position, name)) {
			return false;
		}

		const parent = position.parent as ModelElement;
		const context = [...parent.getAncestors({ includeSelf: true }).filter(node => node.is('element')), name];

		for (const item of items) {
			if (!schema.checkChild(context, item.is('$textProxy') ? '$text' : item)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Whether the children of an element can be in its place: the check for unwrapping it.
	 */
	protected _canUnwrap(element: ModelElement): boolean {
		const model = this.editor.model;

		if (!element.parent) {
			return false;
		}

		const position = model.createPositionBefore(element);

		return Array.from(element.getChildren()).every(child => model.schema.checkChild(position, child));
	}
}
