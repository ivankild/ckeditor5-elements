import {
	Command,
	type Editor,
	type ModelDocumentFragment,
	type ModelElement,
	type ModelNode,
	type ModelPosition,
	type ModelWriter
} from 'ckeditor5';

/**
 * A model position or a model element the command operates on.
 */
export type PositionOrElement = ModelPosition | ModelElement;

/**
 * The base command for elements.
 *
 * Both {@link #refresh} and {@link #execute} accept an optional position or element. When it is
 * absent, it is taken from the current selection: the selected element if there is one,
 * otherwise the first selection position.
 *
 * The command toggles: it unwraps the closest matching element, or wraps the target with a new one.
 * It is enabled only when the toggle is allowed by the schema and the target is editable.
 */
export default class ElementCommand extends Command {
	/**
	 * Whether the command is "on" (e.g. the element is active at the given position).
	 *
	 * @observable
	 */
	declare public isOn: boolean;

	/**
	 * The icon (SVG string) of the command.
	 *
	 * @observable
	 */
	declare public icon: string | undefined;

	/**
	 * The title of the command.
	 *
	 * @observable
	 */
	declare public title: string;

	/**
	 * The tooltip of the command. `true` uses the {@link #title}.
	 *
	 * @observable
	 */
	declare public tooltip: string | boolean;

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
		this.set('icon', undefined);
		this.set('title', '');
		this.set('tooltip', true);
	}

	public override refresh(positionOrElement?: PositionOrElement): void {
		const target = this._getPositionOrElement(positionOrElement);
		const element = target && this._findElement(target);

		this.isOn = !!element;
		this.isEnabled =
			!!target &&
			this.editor.model.canEditAt(target) &&
			(element ? this._canUnwrap(element) : this._canWrap(target));
	}

	/**
	 * Checks whether the given node is an element handled by this command: it is named {@link #elementName}
	 * and has all {@link #elementAttributes} with the same values.
	 */
	public isElement(node: ModelNode | ModelDocumentFragment): boolean {
		if (!node.is('element', this.elementName)) {
			return false;
		}

		return Object.entries(this.elementAttributes).every(([key, value]) => node.getAttribute(key) === value);
	}

	/**
	 * Unwraps the closest element that satisfies {@link #isElement}. If there is none,
	 * wraps the given element (or the position's parent) with a new element.
	 */
	public override execute(positionOrElement?: PositionOrElement): void {
		const model = this.editor.model;
		const target = this._getPositionOrElement(positionOrElement);

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
	 * Returns the given position or element, or resolves it from the current selection when absent.
	 */
	protected _getPositionOrElement(positionOrElement?: PositionOrElement): PositionOrElement | null {
		if (positionOrElement) {
			return positionOrElement;
		}

		const selection = this.editor.model.document.selection;

		return selection.getSelectedElement() ?? selection.getFirstPosition();
	}

	/**
	 * Creates the element used for wrapping.
	 */
	protected _createElement(writer: ModelWriter): ModelElement {
		return writer.createElement(this.elementName, this.elementAttributes);
	}

	/**
	 * Returns the element that would be wrapped: the given element, or the position's parent. Never a root.
	 */
	private _getNodeToWrap(positionOrElement: PositionOrElement): ModelElement | null {
		const node = positionOrElement.is('position') ? positionOrElement.parent : positionOrElement;

		return node.is('element') && !node.is('rootElement') ? node : null;
	}

	/**
	 * Whether the schema allows the new element in place of the node to wrap, and the node inside the new element.
	 */
	private _canWrap(positionOrElement: PositionOrElement): boolean {
		const node = this._getNodeToWrap(positionOrElement);

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
	 * Returns the closest element that satisfies {@link #isElement}: the element itself or its ancestor,
	 * or the position's parent or its ancestor. Root elements are skipped, as they cannot be unwrapped.
	 */
	private _findElement(positionOrElement: PositionOrElement): ModelElement | null {
		const ancestors = positionOrElement.is('position')
			? positionOrElement.getAncestors()
			: positionOrElement.getAncestors({ includeSelf: true });

		for (const node of ancestors.reverse()) {
			if (node.is('element') && !node.is('rootElement') && this.isElement(node)) {
				return node;
			}
		}

		return null;
	}
}
