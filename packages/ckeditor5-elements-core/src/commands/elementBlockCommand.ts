import type { ModelElement } from 'ckeditor5';
import type { ElementOrPosition } from '../elementOrPositionCommand.js';
import ElementCommand from './elementCommand.js';

/**
 * Turns blocks into the element, as CKEditor's heading command does, e.g. a `title` that holds text: the selected
 * blocks, or the block of the target, are renamed, and keep their content.
 *
 * ```ts
 * editor.execute('title'); // The blocks of the selection.
 * editor.commands.get('title').executeFor(paragraph);
 * ```
 *
 * When all the blocks are the element already, it turns them back into paragraphs (the {@link defaultElement}). The
 * blocks that cannot be renamed, e.g. where the element is not allowed, are left as they are.
 *
 * It is "on" when all the blocks are the element.
 */
export default class ElementBlockCommand extends ElementCommand {
	public override isToggleable = true;

	/**
	 * The element the blocks are turned back into.
	 */
	public defaultElement = 'paragraph';

	/**
	 * Renames the blocks of the target: to the element, or back to the {@link defaultElement} when they are all the
	 * element.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const name = this._getNewName(elementOrPosition);
		const schema = this.editor.model.schema;

		this.editor.model.change(writer => {
			for (const block of this._getBlocks(elementOrPosition)) {
				if (this._canRename(block, name)) {
					if (block.name !== name) {
						writer.rename(block, name);
					}

					if (name === this.elementName) {
						writer.setAttributes(this.elementAttributes, block);
					}

					schema.removeDisallowedAttributes([block], writer);
				}
			}
		});
	}

	/**
	 * Enabled when the target can be edited, and one of its blocks can be renamed.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const name = this._getNewName(elementOrPosition);

		return (
			super._isEnabledFor(elementOrPosition) &&
			this._getBlocks(elementOrPosition).some(block => this._canRename(block, name))
		);
	}

	/**
	 * "On" when all the blocks of the target are the element.
	 */
	protected override _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		const blocks = this._getBlocks(elementOrPosition);

		return blocks.length > 0 && blocks.every(block => this.isElement(block));
	}

	/**
	 * Returns the name the blocks get: the element, or the {@link defaultElement} when they are the element already.
	 */
	private _getNewName(elementOrPosition?: ElementOrPosition): string {
		return this._isOnFor(elementOrPosition) ? this.defaultElement : this.elementName;
	}

	/**
	 * Whether a block can be renamed: it is not an object, nor the element already, and the schema allows it with its
	 * content.
	 */
	private _canRename(block: ModelElement, name: string): boolean {
		const schema = this.editor.model.schema;

		return (
			(name === this.elementName ? !this.isElement(block) : block.name !== name) &&
			!schema.isObject(block) &&
			schema.isRegistered(name) &&
			this._canHold(this.editor.model.createPositionBefore(block), block.getChildren(), name)
		);
	}
}
