import { viewToPlainText, type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';
import { isInDocument } from './utils.js';

/**
 * Copies an element to the system clipboard, as HTML and plain text. With `cut: true`, it also removes the element.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}).
 *
 * Requires a secure context (HTTPS or `localhost`), as it uses the asynchronous Clipboard API.
 */
export default class ElementCopyCommand extends ElementOrPositionCommand {
	/**
	 * Whether the element is removed after copying.
	 */
	public readonly cut: boolean;

	constructor(editor: Editor, { cut = false }: { cut?: boolean } = {}) {
		super(editor);

		this.cut = cut;
		this.title = cut ? editor.t('Cut') : editor.t('Copy');

		// Copying does not change the data, so it stays enabled in read-only mode.
		this.affectsData = cut;

		// The command may act on a given element, so it does not depend on whether the selection can be edited.
		this._isEnabledBasedOnSelection = false;
	}

	protected override _isEnabledFor(positionOrElement?: PositionOrElement): boolean {
		return window.isSecureContext && !!this._getElement(positionOrElement);
	}

	/**
	 * Copies the element (and removes it, with `cut: true`). Resolves when the clipboard has been written.
	 */
	public override async execute(positionOrElement?: PositionOrElement): Promise<void> {
		const editor = this.editor;
		const model = editor.model;
		const element = this._getElement(positionOrElement);

		if (!element || !isInDocument(element)) {
			return;
		}

		const content = model.getSelectedContent(model.createSelection(element, 'on'));
		const viewContent = editor.data.toView(content);
		const html = editor.data.processor.toData(viewContent);
		const text = viewToPlainText(editor.editing.view.domConverter, viewContent);

		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);

		if (this.cut && isInDocument(element) && model.canEditAt(element)) {
			model.change(writer => {
				writer.remove(element);
			});
		}
	}
}
