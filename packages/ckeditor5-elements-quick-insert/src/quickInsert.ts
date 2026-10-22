import { Plugin, type Editor, type FilteredViewExecuteEvent, type ModelPosition, type RectSource } from 'ckeditor5';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { createElementInsertItems } from './elementInsertItems.js';
import QuickInsertCommand from './quickInsertCommand.js';
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
}

/**
 * Opens a menu with a search field and the elements allowed at the selection, on Alt+Enter (Option+Enter on macOS).
 * Choosing an element inserts it with the `quickInsert` command.
 *
 * The menu is shown by the `ElementContextMenu` plugin. Its default items get "Insert ›", with "Insert before" and
 * "Insert after" for the element (see {@link createElementInsertItems}).
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

		editor.config.define('quickInsert', { labels: {}, exclude: [] });
	}

	public init(): void {
		const editor = this.editor;

		editor.commands.add('quickInsert', new QuickInsertCommand(editor));
		editor.plugins.get(ElementContextMenu).addItems(createElementInsertItems);

		editor.keystrokes.set('Alt+Enter', (data, cancel) => {
			if (this.open()) {
				cancel();
			}
		});
	}

	/**
	 * Returns the elements that can be inserted at the position (or at the selection), with their labels.
	 */
	public getItems(position?: ModelPosition): QuickInsertItem[] {
		const config = this.editor.config.get('quickInsert');
		const labels = config?.labels ?? {};
		const command = this.editor.commands.get('quickInsert');

		return (command?.getAllowedElements(position, config?.exclude) ?? []).map(name => ({
			name,
			label: labels[name] ?? name
		}));
	}

	/**
	 * Opens the menu for inserting at the position (or at the selection), next to the target (by default,
	 * the selection in the DOM).
	 *
	 * Returns `false` when the command is disabled, the position cannot be edited, or there is no target.
	 */
	public open(position?: ModelPosition, target?: RectSource): boolean {
		const editor = this.editor;
		const editingView = editor.editing.view;
		const viewRange = editingView.document.selection.getFirstRange();
		const menuTarget = target ?? (viewRange && editingView.domConverter.viewRangeToDom(viewRange));

		if (!editor.commands.get('quickInsert')?.isEnabled || (position && !editor.model.canEditAt(position))) {
			return false;
		}

		if (!menuTarget) {
			return false;
		}

		const view = new QuickInsertView(editor.locale, this.getItems(position));

		view.on<FilteredViewExecuteEvent>('execute', (evt, { value }) => {
			// Focus first: focusing reads the DOM selection, which would override the selection set by the command.
			editingView.focus();
			editor.execute('quickInsert', value, position);
		});

		editor.plugins.get(ElementContextMenu).show([view], menuTarget);

		return true;
	}
}
