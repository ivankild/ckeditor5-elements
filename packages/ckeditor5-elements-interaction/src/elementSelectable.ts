import {
	MouseObserver,
	Plugin,
	keyCodes,
	isArrowKeyCode,
	isForwardArrowKeyCode,
	type DowncastSelectionEvent,
	type ModelElement,
	type ViewDocumentKeyDownEvent,
	type ViewDocumentMouseDownEvent,
	type ViewDowncastWriter,
	type ViewElement
} from 'ckeditor5';
import { getElementsAround, keyboardPriorities, matchesElement, type ElementMatcher } from 'ckeditor5-elements-core';
import { findLeaveTarget, findSelectableAfterStep, findSelectableAround } from './navigation.js';

/**
 * Matches the elements that can be selected: the name of a model element (e.g. `'callout'`), or a function that returns
 * whether it is for the given element (e.g. `element => element.hasAttribute('card')`).
 */
export type ElementSelectableMatcher = ElementMatcher;

/**
 * The class of the selected element in the editing view.
 */
const SELECTED_CLASS = 'ck-elements-selected';

/**
 * Makes elements selectable as a whole, which is what CKEditor's widgets do, without them: it does not change the view
 * of the element, and does not need the `Widget` plugin. The elements are matched by name or by a filter function, and
 * they are the `elementSelectable` editor config option:
 *
 * ```ts
 * elementSelectable: ['callout', 'divider', element => element.hasAttribute('card')];
 * ```
 *
 * An element is selected (the model selection is *on* it, and the view has a fake selection and the
 * `ck-elements-selected` class):
 *
 * * **By a click** on the element. An element that has content, e.g. a container, is selected by a click on the element
 *   itself, not on its content: a click in its text puts the cursor there, as it does without the plugin. An element
 *   with no content (an object) is selected by a click anywhere in it.
 * * **By the left and right arrow keys**: when the next step of the cursor enters or passes a selectable element (at the
 *   end of a block, or before an inline element), the key selects it instead. With an element selected, the arrow keys
 *   move the cursor to the content after (right, down) or before (left, up) it, or select the next selectable element,
 *   if it is just there.
 * * **By the Esc key**: with the cursor in an element, it selects the closest selectable one around the cursor, unless
 *   something else handles Esc first, e.g. closes a balloon.
 *
 * A selected element is deleted, replaced by typing and copied, as any selected content.
 *
 * Names are made selectable in the model schema (`isSelectable`), so the selection on them is kept: a filter cannot,
 * so the elements it matches must be selectable already (e.g. objects). Features can add elements with
 * {@link ElementSelectable#add}.
 */
export default class ElementSelectable extends Plugin {
	private readonly _matchers: ElementSelectableMatcher[] = [];
	private _selected: ViewElement | null = null;

	public static get pluginName(): 'ElementSelectable' {
		return 'ElementSelectable' as const;
	}

	public init(): void {
		const editor = this.editor;
		const view = editor.editing.view;
		const viewDocument = view.document;

		this._matchers.push(...(editor.config.get('elementSelectable') ?? []));

		// The selection of an element is a fake one, as for widgets: the browser does not draw the selection on its own.
		editor.editing.downcastDispatcher.on<DowncastSelectionEvent>('selection', (evt, data, conversionApi) => {
			const element = data.selection.getSelectedElement();
			const viewElement =
				element && this.isSelectable(element) ? editor.editing.mapper.toViewElement(element) : null;

			if (element && viewElement && conversionApi.consumable.consume(data.selection, 'selection')) {
				conversionApi.writer.setSelection(conversionApi.writer.createRangeOn(viewElement), {
					fake: true,
					label: `<${element.name}>`
				});
			}
		});
		editor.editing.downcastDispatcher.on<DowncastSelectionEvent>(
			'selection',
			(evt, data, conversionApi) => {
				this._mark(conversionApi.writer, viewDocument.selection.getSelectedElement());
			},
			{ priority: 'low' }
		);

		view.addObserver(MouseObserver);
		this.listenTo<ViewDocumentMouseDownEvent>(viewDocument, 'mousedown', (evt, data) => {
			const element = this.isEnabled ? this._findToSelect(data.target) : null;

			if (element) {
				// The browser would put the cursor where the click is, and move the focus.
				data.preventDefault();
				view.focus();
				this._select(element);
			}
		});

		// The arrow keys are handled on `keydown`, before CKEditor's widgets, and not as the `arrowKey` event: that one
		// bubbles from the selection, and CKEditor's widgets (loaded by other features, e.g. the clipboard) handle it for
		// every object, in a context that is reached before this plugin could.
		this.listenTo<ViewDocumentKeyDownEvent>(
			viewDocument,
			'keydown',
			(evt, data) => {
				const isPlain = !data.shiftKey && !data.ctrlKey && !data.altKey && !data.metaKey;

				if (
					this.isEnabled &&
					isPlain &&
					isArrowKeyCode(data.keyCode) &&
					this._handleArrowKey(
						data.keyCode,
						isForwardArrowKeyCode(data.keyCode, editor.locale.contentLanguageDirection)
					)
				) {
					data.preventDefault();
					evt.stop();
				}
			},
			{ priority: keyboardPriorities.selectable }
		);

		// Esc goes after what else uses it, e.g. closing a balloon. Editor keystrokes (`cancel()`)
		// do not stop this event, they prevent the default action of the DOM event: then Esc is handled already.
		this.listenTo<ViewDocumentKeyDownEvent>(
			viewDocument,
			'keydown',
			(evt, data) => {
				const isFree = data.keystroke === keyCodes.esc && !data.domEvent.defaultPrevented;
				const element = this.isEnabled && isFree ? this._findAround() : null;

				if (element) {
					this._select(element);
					data.preventDefault();
					evt.stop();
				}
			},
			{ priority: keyboardPriorities.selectableEsc }
		);
	}

	public afterInit(): void {
		this._makeSelectable(this._matchers);
	}

	/**
	 * Makes more elements selectable, as the `elementSelectable` option does: a name of a model element, or a filter.
	 * Used by features that add elements, e.g. the element schema.
	 */
	public add(...matchers: ElementSelectableMatcher[]): void {
		this._matchers.push(...matchers);
		this._makeSelectable(matchers);
	}

	/**
	 * Returns whether the element can be selected by this plugin: it matches a name or a filter.
	 */
	public isSelectable(element: ModelElement): boolean {
		return !element.is('rootElement') && this._matchers.some(matcher => matchesElement(matcher, element));
	}

	/**
	 * Selects the element as a whole.
	 */
	private _select(element: ModelElement): void {
		this.editor.model.change(writer => {
			writer.setSelection(element, 'on');
		});
	}

	/**
	 * Makes the model elements named in the matchers selectable in the schema, for the ones that are registered.
	 */
	private _makeSelectable(matchers: readonly ElementSelectableMatcher[]): void {
		const schema = this.editor.model.schema;

		for (const matcher of matchers) {
			if (typeof matcher === 'string' && schema.isRegistered(matcher) && !schema.isSelectable(matcher)) {
				schema.extend(matcher, { isSelectable: true });
			}
		}
	}

	/**
	 * Returns the element a mouse down on the view element selects: the closest selectable element around it (or it), if
	 * the click is on the element itself, or the element has no content.
	 */
	private _findToSelect(target: ViewElement): ModelElement | null {
		for (const { element, viewElement } of getElementsAround(this.editor.editing.mapper, target)) {
			if (this.isSelectable(element) && (viewElement === target || element.isEmpty)) {
				return element;
			}
		}

		return null;
	}

	/**
	 * Handles an arrow key. Returns whether the key moved the selection, and the browser must not.
	 */
	private _handleArrowKey(keyCode: number, isForward: boolean): boolean {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selected = selection.getSelectedElement();
		const isSelectable = (element: ModelElement): boolean => this.isSelectable(element);

		if (selected && this.isSelectable(selected)) {
			const target = findLeaveTarget(model, selected, isForward, isSelectable);

			if (target) {
				model.change(writer => {
					writer.setSelection(target);
				});
			}

			// Also when there is nowhere to go: the browser would move the cursor into the fake selection.
			return true;
		}

		// The up and down keys move in the lines of the text: only the browser knows where.
		const isHorizontal = keyCode === keyCodes.arrowleft || keyCode === keyCodes.arrowright;
		const next =
			isHorizontal && selection.isCollapsed
				? findSelectableAfterStep(model, selection, isForward, isSelectable)
				: null;

		if (next) {
			this._select(next);
		}

		return !!next;
	}

	/**
	 * Returns the closest selectable element around the selection, not the selected one.
	 */
	private _findAround(): ModelElement | null {
		return findSelectableAround(this.editor.model.document.selection, element => this.isSelectable(element));
	}

	/**
	 * Marks the selected view element with the class, and unmarks the one that was selected.
	 */
	private _mark(writer: ViewDowncastWriter, selected: ViewElement | null): void {
		const mapper = this.editor.editing.mapper;
		const element = selected && mapper.toModelElement(selected);
		const marked = element && this.isSelectable(element) ? selected : null;

		if (this._selected && this._selected !== marked) {
			writer.removeClass(SELECTED_CLASS, this._selected);
		}

		if (marked) {
			writer.addClass(SELECTED_CLASS, marked);
		}

		this._selected = marked;
	}
}
