import { ButtonView, type Editor, type ModelElement, type ModelPosition, type View } from 'ckeditor5';
import { SubmenuView } from 'ckeditor5-elements-context-menu';

/**
 * Creates the "Insert" context menu item for the given element, with "Insert before" and "Insert after".
 * They open the quick insert menu for the position before or after the element.
 *
 * Returns no items when the `QuickInsert` plugin is not loaded.
 */
export function createElementInsertItems(element: ModelElement, editor: Editor): View[] {
	if (!editor.plugins.has('QuickInsert')) {
		return [];
	}

	const t = editor.t;
	const model = editor.model;

	return [
		new SubmenuView(editor.locale, t('Insert'), [
			createButton(editor, element, t('Insert before'), model.createPositionBefore(element)),
			createButton(editor, element, t('Insert after'), model.createPositionAfter(element))
		])
	];
}

function createButton(editor: Editor, element: ModelElement, label: string, position: ModelPosition): ButtonView {
	const quickInsert = editor.plugins.get('QuickInsert');
	const button = new ButtonView(editor.locale);

	button.set({
		label,
		withText: true,
		role: 'menuitem',
		isEnabled: editor.model.canEditAt(position) && quickInsert.getItems(position).length > 0
	});

	button.on('execute', () => {
		const viewElement = editor.editing.mapper.toViewElement(element);
		const domElement = viewElement && editor.editing.view.domConverter.mapViewToDom(viewElement);

		quickInsert.open(position, domElement ?? undefined);
	});

	return button;
}
