import {
	type Editor,
	type ModelDocumentFragment,
	type ModelElement,
	type ModelNode,
	type ModelWriter
} from 'ckeditor5';
import ElementOrPositionCommand, { type ElementOrPosition } from './elementOrPositionCommand.js';

/**
 * A command that toggles an element.
 *
 * Both {@link refresh} and {@link execute} accept an optional position or element. When it is
 * absent, it is taken from the current selection (see {@link ElementOrPositionCommand}).
 *
 * The command toggles: it unwraps the closest matching element, or wraps the target with a new one.
 * It is enabled only when the toggle is allowed by the schema and the target is editable.
 */
export default class ElementCommand extends ElementOrPositionCommand {
	/**
	 * Whether the command is "on" (e.g. the element is active at the given position).
	 *
	 * @observable
	 */
	declare public isOn: boolean;

	/**
	 * The name of the model element this command matches, wraps with and unwraps.
	 */
	public elementName = 'element';

	/**
	 * The attributes the model element must have to be matched. Also set on newly created elements.
	 */
	public elementAttributes: Record<string, unknown> = {};

	constructor(editor: Editor) {
		super(editor);

		this.set('isOn', false);
	}

	public override refresh(elementOrPosition?: ElementOrPosition): void {
		this.isOn = this._isOnFor(elementOrPosition);
		super.refresh(elementOrPosition);
	}

	/**
	 * Checks whether the given node is an element handled by this command: it is named {@link elementName}
	 * and has all {@link elementAttributes} with the same values.
	 */
	public isElement(node: ModelNode | ModelDocumentFragment): boolean {
		if (!node.is('element', this.elementName)) {
			return false;
		}

		return Object.entries(this.elementAttributes).every(([key, value]) => node.getAttribute(key) === value);
	}

	/**
	 * Unwraps the closest element that satisfies {@link isElement}. If there is none,
	 * wraps the given element (or the position's parent) with a new element.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const model = this.editor.model;
		const target = this._getElementOrPosition(elementOrPosition);

		if (!target || !model.canEditAt(target)) {
			return;
		}

		const element = this._findElement(target);
		const nodeToWrap = this._getNodeToWrap(target);

		model.change(writer => {
			if (element) {
				if (this._canUnwrap(element)) {
					writer.unwrap(element);
				}
			} else if (nodeToWrap && this._canWrap(target)) {
				writer.wrap(writer.createRangeOn(nodeToWrap), this._createElement(writer));
			}
		});
	}

	/**
	 * Creates the element used for wrapping.
	 */
	protected _createElement(writer: ModelWriter): ModelElement {
		return writer.createElement(this.elementName, this.elementAttributes);
	}

	/**
	 * Enabled when the target can be edited and the toggle is allowed by the schema.
	 */
	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const target = this._getElementOrPosition(elementOrPosition);
		const element = target && this._findElement(target);

		return (
			!!target &&
			this.editor.model.canEditAt(target) &&
			(element ? this._canUnwrap(element) : this._canWrap(target))
		);
	}

	/**
	 * "On" when the target is (in) a matching element.
	 */
	protected override _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		const target = this._getElementOrPosition(elementOrPosition);

		return !!target && !!this._findElement(target);
	}

	/**
	 * Returns the element that would be wrapped: the given element, or the position's parent. Never a root.
	 */
	private _getNodeToWrap(elementOrPosition: ElementOrPosition): ModelElement | null {
		const node = elementOrPosition.is('position') ? elementOrPosition.parent : elementOrPosition;

		return node.is('element') && !node.is('rootElement') ? node : null;
	}

	/**
	 * Whether the schema allows the new element in place of the node to wrap, and the node inside the new element.
	 */
	private _canWrap(elementOrPosition: ElementOrPosition): boolean {
		const node = this._getNodeToWrap(elementOrPosition);

		if (!node) {
			return false;
		}

		const model = this.editor.model;
		const ancestors = node.getAncestors().filter(ancestor => ancestor.is('element'));

		return (
			model.schema.checkChild(model.createPositionBefore(node), this.elementName) &&
			model.schema.checkChild([...ancestors, this.elementName], node)
		);
	}

	/**
	 * Whether the schema allows all children of the element in its parent.
	 */
	private _canUnwrap(element: ModelElement): boolean {
		const model = this.editor.model;

		if (!element.parent) {
			return false;
		}

		const position = model.createPositionBefore(element);

		return Array.from(element.getChildren()).every(child => model.schema.checkChild(position, child));
	}

	/**
	 * Returns the closest element that satisfies {@link isElement}: the element itself or its ancestor,
	 * or the position's parent or its ancestor. Root elements are skipped, as they cannot be unwrapped.
	 */
	private _findElement(elementOrPosition: ElementOrPosition): ModelElement | null {
		const ancestors = elementOrPosition.is('position')
			? elementOrPosition.getAncestors()
			: elementOrPosition.getAncestors({ includeSelf: true });

		for (const node of ancestors.reverse()) {
			if (node.is('element') && !node.is('rootElement') && this.isElement(node)) {
				return node;
			}
		}

		return null;
	}
}
