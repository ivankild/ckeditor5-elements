import { Command, type Editor, type ModelElement, type ModelPosition } from 'ckeditor5';

/**
 * A model position or a model element a command operates on.
 */
export type PositionOrElement = ModelPosition | ModelElement;

/**
 * The base command for commands that operate on a model position or a model element: clipboard, insert or toggle
 * commands, for example.
 *
 * It has the observable `icon`, `title` and `tooltip` properties, so buttons can reflect it, and helpers that resolve
 * the target. When no target is given, it is taken from the current selection: the selected element if there is one,
 * otherwise the first selection position.
 *
 * It does not define what `execute()` does; subclasses do. Subclasses define when they are enabled (and "on") for a
 * target in {@link _isEnabledFor} (and {@link _isOnFor}), so the state can be computed for any target with
 * {@link getState}, e.g. for a context menu item of an element, without changing the command's own state.
 */
export default class ElementOrPositionCommand extends Command {
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
	 * The tooltip of the command. `true` uses the {@link title}.
	 *
	 * @observable
	 */
	declare public tooltip: string | boolean;

	constructor(editor: Editor) {
		super(editor);

		this.set('icon', undefined);
		this.set('title', '');
		this.set('tooltip', true);

		// The command checks whether its target can be edited itself (see `_isEnabledFor()`), so it is not disabled just
		// because the selection cannot be edited. Otherwise, `executeFor()` would fail for an editable target then.
		this._isEnabledBasedOnSelection = false;
	}

	/**
	 * Sets {@link isEnabled} for the target (by default, the selection). See {@link _isEnabledFor}.
	 */
	public override refresh(positionOrElement?: PositionOrElement): void {
		this.isEnabled = this._isEnabledFor(positionOrElement);
	}

	/**
	 * Returns whether the command would be enabled and "on" for the target, without changing {@link isEnabled}.
	 * Commands that change the data are disabled in read-only mode.
	 */
	public getState(positionOrElement?: PositionOrElement): { isEnabled: boolean; isOn: boolean } {
		const isReadOnly = this.affectsData && this.editor.isReadOnly;

		return {
			isEnabled: !isReadOnly && this._isEnabledFor(positionOrElement),
			isOn: this._isOnFor(positionOrElement)
		};
	}

	/**
	 * Executes the command for the target, even when the command is disabled for the selection (`execute()` checks
	 * {@link isEnabled}, which follows the selection). Does nothing when the command is disabled for the target.
	 *
	 * The target is the first argument of `execute()`; the other arguments are passed after it.
	 */
	public executeFor(positionOrElement: PositionOrElement, ...args: unknown[]): unknown {
		this.refresh(positionOrElement);

		try {
			return this.execute(positionOrElement, ...args);
		} finally {
			this.refresh();
		}
	}

	/**
	 * Whether the command is enabled for the target. By default: when there is a target and it can be edited.
	 */
	protected _isEnabledFor(positionOrElement?: PositionOrElement): boolean {
		const target = this._getPositionOrElement(positionOrElement);

		return !!target && this.editor.model.canEditAt(target);
	}

	/**
	 * Whether the command is "on" for the target. By default: never.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Subclasses use the target.
	protected _isOnFor(positionOrElement?: PositionOrElement): boolean {
		return false;
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
	 * Resolves the target (see {@link _getPositionOrElement}) to a position: an element becomes the position
	 * before it.
	 */
	protected _getPosition(positionOrElement?: PositionOrElement): ModelPosition | null {
		const target = this._getPositionOrElement(positionOrElement);

		if (!target || target.is('position')) {
			return target;
		}

		return target.parent ? this.editor.model.createPositionBefore(target) : null;
	}

	/**
	 * Resolves the target (see {@link _getPositionOrElement}) to an element: a position becomes its parent element.
	 * Never returns a root.
	 */
	protected _getElement(positionOrElement?: PositionOrElement): ModelElement | null {
		const target = this._getPositionOrElement(positionOrElement);
		const element = target?.is('position') ? target.parent : target;

		return element?.is('element') && !element.is('rootElement') ? element : null;
	}
}
