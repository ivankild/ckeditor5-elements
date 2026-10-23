import {
	ClickObserver,
	Plugin,
	type Editor,
	type ModelElement,
	type ViewDocumentClickEvent,
	type ViewElement
} from 'ckeditor5';
import DoubleClickObserver, { type ViewDocumentDoubleClickEvent } from './doubleClickObserver.js';

/**
 * The mouse events an element can be made clickable with.
 */
export type ElementClickableEvent = 'click' | 'dblclick';

/**
 * Makes the elements that match `element` react to clicks.
 */
export interface ElementClickableDefinition {
	/**
	 * The elements the definition is for: the name of a model element (e.g. `'imageBlock'`), or a function that returns
	 * whether it is for the given element (e.g. `element => element.hasAttribute('linkHref')`).
	 */
	element: string | ((element: ModelElement) => boolean);

	/**
	 * The mouse event: `'click'` (the default) or `'dblclick'`.
	 */
	event?: ElementClickableEvent;

	/**
	 * Called with the element that was clicked, the editor, and the DOM event.
	 */
	callback: (element: ModelElement, editor: Editor, domEvent: MouseEvent) => void;
}

/**
 * Calls a function when an element is clicked or double-clicked, with the model element. Elements are matched by name or
 * by a filter function, and the definitions are the `elementClickables` editor config option (see
 * {@link ElementClickableDefinition}):
 *
 * ```ts
 * elementClickables: [
 * 	{ element: 'imageBlock', callback: (element, editor) => console.log(element.getAttribute('src')) },
 * 	{ element: element => element.name.startsWith('heading'), event: 'dblclick', callback: edit }
 * ];
 * ```
 *
 * The click is matched against the element that was clicked and its ancestors, the innermost first: the first element
 * that matches a definition for the event calls its callback, and the event goes no further. For two definitions that
 * match the same element, the first one in the config wins.
 *
 * It works in read-only mode too. The click still does what it does in the editor, e.g. selects an image: the plugin
 * only reports it, before the other plugins handle it (some of them stop the event), and does not stop it.
 */
export default class ElementClickable extends Plugin {
	public static get pluginName(): 'ElementClickable' {
		return 'ElementClickable' as const;
	}

	public init(): void {
		const view = this.editor.editing.view;

		view.addObserver(ClickObserver);
		view.addObserver(DoubleClickObserver);

		// With the highest priority, before other plugins: some stop the click, e.g. CKEditor's link handling stops the
		// click on a link, with a high priority. The plugin reports the click and does not stop it.
		this.listenTo<ViewDocumentClickEvent>(
			view.document,
			'click',
			(evt, data) => {
				this._handle('click', data.target, data.domEvent);
			},
			{ priority: 'highest' }
		);
		this.listenTo<ViewDocumentDoubleClickEvent>(
			view.document,
			'dblclick',
			(evt, data) => {
				this._handle('dblclick', data.target, data.domEvent);
			},
			{ priority: 'highest' }
		);
	}

	/**
	 * Returns the definition and the element that a click on the view element is for: the innermost element, among the
	 * view element and its ancestors, that matches a definition for the event. `null` when there is none.
	 */
	public find(
		viewElement: ViewElement,
		event: ElementClickableEvent = 'click'
	): { element: ModelElement; definition: ElementClickableDefinition } | null {
		const mapper = this.editor.editing.mapper;
		const definitions = (this.editor.config.get('elementClickables') ?? []).filter(
			definition => (definition.event ?? 'click') === event
		);

		for (let node: ViewElement | null = viewElement; node; node = node.parent?.is('element') ? node.parent : null) {
			const element = mapper.toModelElement(node);

			if (element && !element.is('rootElement')) {
				const definition = definitions.find(({ element: matcher }) =>
					typeof matcher === 'string' ? element.name === matcher : matcher(element)
				);

				if (definition) {
					return { element, definition };
				}
			}
		}

		return null;
	}

	private _handle(event: ElementClickableEvent, target: ViewElement, domEvent: MouseEvent): void {
		const found = this.isEnabled ? this.find(target, event) : null;

		found?.definition.callback(found.element, this.editor, domEvent);
	}
}
