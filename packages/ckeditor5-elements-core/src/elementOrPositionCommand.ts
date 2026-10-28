import { Command, ModelElement, ModelPosition, type CommandExecuteEvent, type Editor } from 'ckeditor5';
import { isInDocument } from './utils.js';

/**
 * A model position or a model element a command operates on.
 */
export type ElementOrPosition = ModelPosition | ModelElement;

/**
 * The state of a command for a target: whether it is enabled, and "on".
 */
export interface ElementOrPositionState {
	isEnabled: boolean;
	isOn: boolean;
}

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
 * {@link getState}, e.g. for a context menu item of an element, without changing the command's own state. A command
 * that computes both from the same work, e.g. from the selected blocks, overrides {@link _getStateFor} instead.
 *
 * `execute()` runs only when the command is enabled for its target: for the selection, as for every command, and for
 * the target given to it too, e.g. `editor.execute('deleteElement', element)`; {@link executeFor} does it for a target
 * the command is not enabled for at the selection. So `execute()` does not check it again.
 *
 * A command disabled with `forceDisabled()` is disabled for every target, not only for the selection.
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

	/**
	 * Whether the command is disabled with `forceDisabled()` (and not enabled back with `clearForceDisabled()` for
	 * every id), so it is disabled for every target.
	 *
	 * @observable
	 * @readonly
	 */
	declare public isForceDisabled: boolean;

	/**
	 * Whether the command can be "on" (see {@link _isOnFor}), e.g. because it toggles something. Its buttons then tell
	 * assistive technology whether it is on: toolbar buttons with `aria-pressed`, menu items with `aria-checked`.
	 * Defaults to `false`; the commands of one element that toggle it set it, e.g. `ElementInlineCommand`.
	 */
	public isToggleable = false;

	/**
	 * The ids the command is disabled with by `forceDisabled()`.
	 */
	private readonly _forceDisabledIds = new Set<string>();

	/**
	 * The target that {@link executeFor} has checked already, while it executes the command for it.
	 */
	private _checkedTarget: ElementOrPosition | null = null;

	constructor(editor: Editor) {
		super(editor);

		this.set('icon', undefined);
		this.set('title', '');
		this.set('tooltip', true);
		this.set('isForceDisabled', false);

		// The command checks whether its target can be edited itself (see `_isEnabledFor()`), so it is not disabled just
		// because the selection cannot be edited. Otherwise, `executeFor()` would fail for an editable target then.
		this._isEnabledBasedOnSelection = false;

		// `Command` checks `isEnabled`, which is for the selection. A target given to `execute()` is checked too, after
		// it: e.g. a table cell, for a command that is enabled in the paragraph with the cursor.
		this.on<CommandExecuteEvent>(
			'execute',
			(evt, [target]) => {
				if (isElementOrPosition(target) && target !== this._checkedTarget && !this.getState(target).isEnabled) {
					evt.stop();
				}
			},
			{ priority: 'high' }
		);
	}

	/**
	 * Sets `isEnabled` for the target (by default, the selection). See {@link _getStateFor}.
	 */
	public override refresh(elementOrPosition?: ElementOrPosition): void {
		this.isEnabled = this._getStateFor(elementOrPosition).isEnabled;
	}

	/**
	 * Disables the command for every target until it is enabled back with {@link clearForceDisabled} for every id it
	 * was disabled with. See {@link isForceDisabled}.
	 */
	public override forceDisabled(id: string): void {
		this._forceDisabledIds.add(id);
		this.isForceDisabled = true;
		super.forceDisabled(id);
	}

	/**
	 * Clears the disabling done by {@link forceDisabled} with this id. When no id is left, the command is refreshed, so
	 * `isEnabled` follows the selection again.
	 */
	public override clearForceDisabled(id: string): void {
		this._forceDisabledIds.delete(id);
		this.isForceDisabled = this._forceDisabledIds.size > 0;
		super.clearForceDisabled(id);

		// `Command` enables the command, even when it is disabled for the selection.
		if (!this.isForceDisabled) {
			this.refresh();
		}
	}

	/**
	 * Returns whether the command would be enabled and "on" for the target, without changing `isEnabled`.
	 * Commands that change the data are disabled in read-only mode, and all commands are disabled when
	 * {@link isForceDisabled}.
	 */
	public getState(elementOrPosition?: ElementOrPosition): ElementOrPositionState {
		const isReadOnly = this.affectsData && this.editor.isReadOnly;
		const { isEnabled, isOn } = this._getStateFor(elementOrPosition);

		return { isEnabled: !this.isForceDisabled && !isReadOnly && isEnabled, isOn };
	}

	/**
	 * Executes the command for the target, even when the command is disabled for the selection (`execute()` checks
	 * `isEnabled`, which follows the selection). Does nothing when the command is disabled for the target.
	 *
	 * The target is the first argument of `execute()`; the other arguments are passed after it.
	 */
	public executeFor(elementOrPosition: ElementOrPosition, ...args: unknown[]): unknown {
		if (!this.getState(elementOrPosition).isEnabled) {
			return undefined;
		}

		const isEnabled = this.isEnabled;

		// `execute()` runs only when the command is enabled, for the selection: it is, for the target. The state of the
		// command changes only then, for as long as it executes.
		this.isEnabled = true;
		this._checkedTarget = elementOrPosition;

		try {
			return this.execute(elementOrPosition, ...args);
		} finally {
			this._checkedTarget = null;

			if (!isEnabled) {
				this.refresh();
			}
		}
	}

	/**
	 * Returns whether the command is enabled and "on" for the target, before read-only mode and `forceDisabled()`: the
	 * one source of the state, for {@link refresh} and {@link getState}. By default, from {@link _isEnabledFor} and
	 * {@link _isOnFor}.
	 */
	protected _getStateFor(elementOrPosition?: ElementOrPosition): ElementOrPositionState {
		return { isEnabled: this._isEnabledFor(elementOrPosition), isOn: this._isOnFor(elementOrPosition) };
	}

	/**
	 * Whether the command is enabled for the target. By default: when there is a target and it can be edited.
	 */
	protected _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const target = this._getElementOrPosition(elementOrPosition);

		return !!target && this.editor.model.canEditAt(target);
	}

	/**
	 * Whether the command is "on" for the target. By default: never. Commands that override it should set
	 * {@link isToggleable}.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Subclasses use the target.
	protected _isOnFor(elementOrPosition?: ElementOrPosition): boolean {
		return false;
	}

	/**
	 * Returns the given position or element, or resolves it from the current selection when absent. Returns `null` for
	 * a target that is not in the document (any more), e.g. a removed element, so commands ignore such targets.
	 */
	protected _getElementOrPosition(elementOrPosition?: ElementOrPosition): ElementOrPosition | null {
		const selection = this.editor.model.document.selection;
		const target = elementOrPosition ?? selection.getSelectedElement() ?? selection.getFirstPosition();

		return target && isInDocument(target) ? target : null;
	}

	/**
	 * Resolves the target (see {@link _getElementOrPosition}) to a position: an element becomes the position
	 * before it.
	 */
	protected _getPosition(elementOrPosition?: ElementOrPosition): ModelPosition | null {
		const target = this._getElementOrPosition(elementOrPosition);

		if (!target || target.is('position')) {
			return target;
		}

		return target.parent ? this.editor.model.createPositionBefore(target) : null;
	}

	/**
	 * Returns the element of the target (see {@link _getElement}), in `execute()` of a command that is enabled only for
	 * a target with an element: `execute()` runs only then, so there is one. Throws when there is none.
	 */
	protected _requireElement(elementOrPosition?: ElementOrPosition): ModelElement {
		const element = this._getElement(elementOrPosition);

		if (!element) {
			throw new Error(
				`The "${this.title}" command is executed for a target without an element, as it is disabled.`
			);
		}

		return element;
	}

	/**
	 * Resolves the target (see {@link _getElementOrPosition}) to an element: a position becomes its parent element.
	 * Never returns a root.
	 */
	protected _getElement(elementOrPosition?: ElementOrPosition): ModelElement | null {
		const target = this._getElementOrPosition(elementOrPosition);
		const element = target?.is('position') ? target.parent : target;

		return element?.is('element') && !element.is('rootElement') ? element : null;
	}
}

function isElementOrPosition(value: unknown): value is ElementOrPosition {
	return value instanceof ModelPosition || value instanceof ModelElement;
}
