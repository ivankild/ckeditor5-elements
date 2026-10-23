import {
	Plugin,
	WidgetToolbarRepository,
	type ModelDocumentFragment,
	type ModelElement,
	type ToolbarConfigItem
} from 'ckeditor5';
import { ElementOrPositionButtonView, ElementOrPositionCommand, getElementAtSelection } from 'ckeditor5-elements-core';

/**
 * A floating toolbar of the elements that match `element`.
 */
export interface ElementToolbarDefinition {
	/**
	 * The elements the toolbar is for: the name of a model element (e.g. `'note'`), or a function that returns whether it
	 * is for the given element (e.g. `element => element.name.startsWith('heading')`).
	 */
	element: string | ((element: ModelElement) => boolean);

	/**
	 * The toolbar items, as in CKEditor's toolbar config:
	 *
	 * * the name of a command that acts on an element (an `ElementOrPositionCommand`, e.g. `'moveElementUp'`): a button
	 *   that acts on the element of the toolbar,
	 * * the name of another UI component (e.g. `'bold'`), as in the main toolbar,
	 * * `'|'`, a separator.
	 */
	items: ToolbarConfigItem[];

	/**
	 * The accessible name of the toolbar. Defaults to "Element toolbar".
	 */
	ariaLabel?: string;
}

/**
 * Shows floating toolbars for elements, configured by the `elementToolbars` editor config option (see
 * {@link ElementToolbarDefinition}): the toolbar of the closest element at the selection that matches, next to it,
 * while the editor is focused. When toolbars match nested elements, the toolbar of the innermost one shows.
 *
 * The toolbars are CKEditor's widget toolbars (`WidgetToolbarRepository`), as the image and table toolbars: they are
 * placed and hidden by CKEditor, and Alt+F10 focuses them. Unlike widget toolbars, they show for any element, also when
 * the selection is inside it, and their command buttons act on that element: "Move up" in the toolbar of a note moves the
 * note, not the paragraph with the cursor.
 */
export default class ElementToolbar extends Plugin {
	public static get requires(): readonly [typeof WidgetToolbarRepository] {
		return [WidgetToolbarRepository] as const;
	}

	public static get pluginName(): 'ElementToolbar' {
		return 'ElementToolbar' as const;
	}

	/**
	 * Registers the toolbars, after the other plugins registered their commands and components.
	 */
	public afterInit(): void {
		const editor = this.editor;
		const repository = editor.plugins.get(WidgetToolbarRepository);

		(editor.config.get('elementToolbars') ?? []).forEach((definition, index) => {
			const toolbarId = `elementToolbar${String(index)}`;
			const getElement = (): ModelElement | null => this.getElement(definition.element);

			repository.register(toolbarId, {
				ariaLabel: definition.ariaLabel ?? editor.t('Element toolbar'),
				items: definition.items.map(item => this._createItem(item, toolbarId, getElement)),
				getRelatedElement: () => {
					const element = getElement();

					return (element && editor.editing.mapper.toViewElement(element)) ?? null;
				}
			});
		});
	}

	/**
	 * Returns the closest element at the selection that matches: the selected element, or the innermost element with the
	 * selection, or one of their ancestors. Never a root.
	 */
	public getElement(element: ElementToolbarDefinition['element']): ModelElement | null {
		const matches = typeof element === 'string' ? (node: ModelElement) => node.name === element : element;

		for (
			let node: ModelElement | ModelDocumentFragment | null = getElementAtSelection(
				this.editor.model.document.selection
			);
			node?.is('element') && !node.is('rootElement');
			node = node.parent
		) {
			if (matches(node)) {
				return node;
			}
		}

		return null;
	}

	/**
	 * Returns the toolbar item for the config item: for a command that acts on an element, the name of a new component,
	 * a button that acts on the element of the toolbar; otherwise, the config item itself.
	 */
	private _createItem(
		item: ToolbarConfigItem,
		toolbarId: string,
		getElement: () => ModelElement | null
	): ToolbarConfigItem {
		if (typeof item !== 'string') {
			return { ...item, items: item.items.map(child => this._createItem(child, toolbarId, getElement)) };
		}

		const editor = this.editor;
		const command = editor.commands.get(item);
		const name = `${toolbarId}:${item}`;

		if (!(command instanceof ElementOrPositionCommand)) {
			return item;
		}

		if (!editor.ui.componentFactory.has(name)) {
			editor.ui.componentFactory.add(
				name,
				locale => new ElementOrPositionButtonView(locale, command, { target: getElement })
			);
		}

		return name;
	}
}
