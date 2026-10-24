import { Plugin, type ModelElement, type RectSource, type ViewElement } from 'ckeditor5';
import { getElementAtSelection, isInDocument } from 'ckeditor5-elements-core';
import ElementMenu from '../elementMenu.js';
import ContextMenuObserver, { type ViewDocumentContextMenuEvent } from './contextMenuObserver.js';

/**
 * Shows the menu of an element when the user right-clicks it, or opens the context menu with the keyboard (the menu
 * key, or Shift+F10) while the cursor is in it.
 *
 * The items come from the `elementContextMenu` editor config option only (see `ElementMenuConfig`): commands, submenus
 * and `'|'` separators. Without it, or when it returns no items for an
 * element, the native context menu shows. The menu itself is shown by the `ElementMenu` plugin.
 */
export default class ElementContextMenu extends Plugin {
	public static get requires(): readonly [typeof ElementMenu] {
		return [ElementMenu] as const;
	}

	public static get pluginName(): 'ElementContextMenu' {
		return 'ElementContextMenu' as const;
	}

	public init(): void {
		const editor = this.editor;
		const editingView = editor.editing.view;

		editingView.addObserver(ContextMenuObserver);

		this.listenTo<ViewDocumentContextMenuEvent>(editingView.document, 'contextmenu', (evt, data) => {
			const { domEvent } = data;
			const element = this.getModelElement(data.target);

			// A context menu opened with the keyboard (the menu key, or Shift+F10 in some browsers) targets the editable
			// itself, not the element at the cursor. A right-click outside any element keeps the native menu.
			const isOpen = element
				? this.open(element, new DOMRect(domEvent.clientX, domEvent.clientY, 0, 0))
				: domEvent.button !== 2 && this.openAtSelection();

			if (isOpen) {
				data.preventDefault();
			}
		});

		// Not every browser opens the context menu on Shift+F10 (e.g. on macOS), so handle it in all of them.
		editor.keystrokes.set('Shift+F10', (data, cancel) => {
			if (this.openAtSelection()) {
				cancel();
			}
		});

		if (typeof editor.config.get('elementContextMenu') === 'function') {
			editor.accessibility.addKeystrokeInfos({
				keystrokes: [{ label: editor.t('Open the menu of the element at the cursor'), keystroke: 'Shift+F10' }]
			});
		}
	}

	/**
	 * Opens the menu of the element next to the target (e.g. a button, or a `DOMRect` in viewport coordinates), with
	 * the items from the `elementContextMenu` config option.
	 *
	 * Returns `false` when there are no items, so the caller can let the native context menu show instead.
	 */
	public open(element: ModelElement, target: RectSource): boolean {
		const config = this.editor.config.get('elementContextMenu');

		if (typeof config !== 'function') {
			return false;
		}

		return this.editor.plugins
			.get(ElementMenu)
			.open(element, target, config, { label: this.editor.t('Element menu') });
	}

	/**
	 * Opens the menu of the element at the selection (the selected element, or the element with the cursor), next to
	 * the selection.
	 *
	 * Returns `false` when there is no such element or no items.
	 */
	public openAtSelection(): boolean {
		const editing = this.editor.editing;
		const selection = this.editor.model.document.selection;
		const selectedElement = selection.getSelectedElement();
		const element = getElementAtSelection(selection);
		const viewElement = selectedElement && editing.mapper.toViewElement(selectedElement);
		const viewRange = editing.view.document.selection.getFirstRange();
		const target = viewElement
			? editing.view.domConverter.mapViewToDom(viewElement)
			: viewRange && editing.view.domConverter.viewRangeToDom(viewRange);

		if (!element || !isInDocument(element) || !(target instanceof HTMLElement || target instanceof Range)) {
			return false;
		}

		return this.open(element, target);
	}

	/**
	 * Returns the closest model element mapped to the given view element or its ancestors, skipping the root.
	 */
	public getModelElement(viewElement: ViewElement): ModelElement | null {
		const mapper = this.editor.editing.mapper;

		for (let node: ViewElement | null = viewElement; node; node = node.parent?.is('element') ? node.parent : null) {
			const element = mapper.toModelElement(node);

			if (element) {
				return element.is('rootElement') ? null : element;
			}
		}

		return null;
	}
}
