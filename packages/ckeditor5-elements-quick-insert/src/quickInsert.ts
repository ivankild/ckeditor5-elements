import { Plugin, type Editor, type FilteredViewExecuteEvent, type ModelElement, type RectSource } from 'ckeditor5';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { type PositionOrElement } from 'ckeditor5-elements-ui';
import QuickInsertCommand from './quickInsertCommand.js';
import QuickInsertPositionCommand from './quickInsertPositionCommand.js';
import { type QuickInsertItem } from './quickInsertListView.js';
import QuickInsertView from './quickInsertView.js';

/**
 * The configuration of the {@link QuickInsert} plugin.
 */
export interface QuickInsertConfig {
	/**
	 * Labels of the elements, by model name. Elements without a label are listed by their model name.
	 */
	labels?: Record<string, string>;

	/**
	 * Model names of the elements that are never listed.
	 */
	exclude?: string[];

	/**
	 * The keystroke that opens the menu at the selection, e.g. `'Ctrl+Space'`. Defaults to `'Alt+Enter'`
	 * (Option+Enter on macOS). `false` registers no keystroke.
	 */
	keystroke?: string | false;
}

/**
 * Opens a menu with a search field and the elements allowed at the selection, on Alt+Enter (Option+Enter on macOS; see
 * {@link QuickInsertConfig.keystroke}). Choosing an element inserts it with the `quickInsert` command.
 *
 * The menu is shown by the `ElementContextMenu` plugin. The `quickInsertBefore` and `quickInsertAfter` commands (see
 * {@link QuickInsertPositionCommand}) open it for the position before or after an element; list them in the
 * `elementContextMenu` config, e.g. as an "Insert" submenu.
 *
 * The menu closes when the document changes while it is open, so it never inserts at an outdated position.
 */
export default class QuickInsert extends Plugin {
	public static get requires(): readonly [typeof ElementContextMenu] {
		return [ElementContextMenu] as const;
	}

	public static get pluginName(): 'QuickInsert' {
		return 'QuickInsert' as const;
	}

	constructor(editor: Editor) {
		super(editor);

		editor.config.define('quickInsert', { labels: {}, exclude: [], keystroke: 'Alt+Enter' });
	}

	public init(): void {
		const editor = this.editor;
		const keystroke = editor.config.get('quickInsert')?.keystroke;

		editor.commands.add('quickInsert', new QuickInsertCommand(editor));
		editor.commands.add('quickInsertBefore', new QuickInsertPositionCommand(editor, 'before'));
		editor.commands.add('quickInsertAfter', new QuickInsertPositionCommand(editor, 'after'));

		if (keystroke) {
			editor.keystrokes.set(keystroke, (data, cancel) => {
				if (this.open()) {
					cancel();
				}
			});
		}
	}

	/**
	 * Returns the elements that can be inserted at the target (a position, the position before an element, or the
	 * selection), with their labels.
	 */
	public getItems(positionOrElement?: PositionOrElement): QuickInsertItem[] {
		const config = this.editor.config.get('quickInsert');
		const labels = config?.labels ?? {};
		const command = this.editor.commands.get('quickInsert');

		return (command?.getAllowedElements(positionOrElement, config?.exclude) ?? []).map(name => ({
			name,
			label: labels[name] ?? name
		}));
	}

	/**
	 * Opens the menu for inserting at the target (a position, the position before an element, or the selection), next
	 * to the given DOM target. By default, the menu is next to the element, or the selection.
	 *
	 * Returns `false` when nothing can be inserted at the target because it cannot be edited, or there is nothing to
	 * show the menu next to.
	 */
	public open(positionOrElement?: PositionOrElement, domTarget?: RectSource): boolean {
		const editor = this.editor;
		const command = editor.commands.get('quickInsert');
		const position = command?.getInsertPosition(positionOrElement);
		const menuTarget = domTarget ?? this._getDomTarget(positionOrElement);

		if (!command || !position || !menuTarget || !command.getState(position).isEnabled) {
			return false;
		}

		const contextMenu = editor.plugins.get(ElementContextMenu);
		const view = new QuickInsertView(editor.locale, this.getItems(position));
		const closeOnChange = (): void => {
			this.stopListening(editor.model.document, 'change:data', closeOnChange);

			if (contextMenu.view?.items.has(view)) {
				contextMenu.hide();
			}
		};

		view.on<FilteredViewExecuteEvent>('execute', (evt, { value }) => {
			this.stopListening(editor.model.document, 'change:data', closeOnChange);

			// Focus first: focusing reads the DOM selection, which would override the selection set by the command.
			editor.editing.view.focus();
			command.executeFor(position, value);
		});

		contextMenu.show([view], menuTarget);

		// The position would be outdated after a change, e.g. by another user.
		this.listenTo(editor.model.document, 'change:data', closeOnChange);

		return true;
	}

	/**
	 * Returns the DOM element of the element, or the DOM range of the selection.
	 */
	private _getDomTarget(positionOrElement?: PositionOrElement): RectSource | null {
		const editing = this.editor.editing;

		if (positionOrElement && !positionOrElement.is('position')) {
			return this._getDomElement(positionOrElement);
		}

		const viewRange = positionOrElement
			? editing.view.createRange(editing.mapper.toViewPosition(positionOrElement))
			: editing.view.document.selection.getFirstRange();

		return viewRange && editing.view.domConverter.viewRangeToDom(viewRange);
	}

	private _getDomElement(element: ModelElement): HTMLElement | null {
		const editing = this.editor.editing;
		const viewElement = editing.mapper.toViewElement(element);
		const domElement = viewElement && editing.view.domConverter.mapViewToDom(viewElement);

		return domElement instanceof HTMLElement ? domElement : null;
	}
}
