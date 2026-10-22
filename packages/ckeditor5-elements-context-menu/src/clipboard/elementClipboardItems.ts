import { ButtonView, type Editor, type ModelElement } from 'ckeditor5';

type ElementClipboardCommandName =
	'copyElement' | 'cutElement' | 'pasteElement' | 'pasteElementBefore' | 'pasteElementAfter';

/**
 * Creates context menu buttons for the clipboard actions on the given element:
 * copy, cut, paste, paste before and paste after.
 *
 * Use it as the `elementContextMenu` config option, or combine it with your own views:
 *
 * ```ts
 * elementContextMenu: (element, editor) => [...createElementClipboardItems(element, editor), myView]
 * ```
 */
export function createElementClipboardItems(element: ModelElement, editor: Editor): ButtonView[] {
	const t = editor.t;

	return [
		createButton(editor, element, 'copyElement', t('Copy')),
		createButton(editor, element, 'cutElement', t('Cut')),
		createButton(editor, element, 'pasteElement', t('Paste')),
		createButton(editor, element, 'pasteElementBefore', t('Paste before')),
		createButton(editor, element, 'pasteElementAfter', t('Paste after'))
	].filter(button => button !== null);
}

function createButton(
	editor: Editor,
	element: ModelElement,
	commandName: ElementClipboardCommandName,
	label: string
): ButtonView | null {
	const command = editor.commands.get(commandName);

	if (!command) {
		return null;
	}

	const button = new ButtonView(editor.locale);

	button.set({ label, withText: true, role: 'menuitem' });
	button.bind('isEnabled').to(command, 'isEnabled');

	button.on('execute', () => {
		void editor.execute(commandName, element);
	});

	return button;
}
