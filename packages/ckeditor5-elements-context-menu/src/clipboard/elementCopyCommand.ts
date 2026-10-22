import { Command, viewToPlainText, type Editor, type ModelElement } from 'ckeditor5';
import { isInDocument } from './utils.js';

/**
 * Copies the given element to the system clipboard, as HTML and plain text. With `cut: true`, it also removes the element.
 *
 * Requires a secure context (HTTPS or `localhost`), as it uses the asynchronous Clipboard API.
 */
export default class ElementCopyCommand extends Command {
	/**
	 * Whether the element is removed after copying.
	 */
	public readonly cut: boolean;

	constructor(editor: Editor, { cut = false }: { cut?: boolean } = {}) {
		super(editor);

		this.cut = cut;

		// Copying does not change the data, so it stays enabled in read-only mode.
		this.affectsData = cut;

		// The command acts on a given element, not on the selection.
		this._isEnabledBasedOnSelection = false;
	}

	public override refresh(): void {
		this.isEnabled = window.isSecureContext;
	}

	public override async execute(element: ModelElement): Promise<void> {
		const editor = this.editor;
		const model = editor.model;

		if (!isInDocument(element)) {
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
