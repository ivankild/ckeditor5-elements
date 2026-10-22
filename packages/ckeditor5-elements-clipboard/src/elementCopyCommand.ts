import { ClipboardPipeline, ViewDataTransfer, type ClipboardOutputTransformationEvent, type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, isInDocument, type ElementOrPosition } from 'ckeditor5-elements-core';
import { copyIcon, cutIcon } from './icons.js';

/**
 * Copies an element to the system clipboard, as HTML and plain text. With `cut: true`, it also removes the element.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}).
 *
 * The content goes through the clipboard pipeline, as with Ctrl+C: other plugins can change it (they listen to the
 * `outputTransformation` event of `ClipboardPipeline`, and to `clipboardOutput` of the editing view document).
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
		this.icon = cut ? cutIcon : copyIcon;

		// Copying does not change the data, so it stays enabled in read-only mode.
		this.affectsData = cut;
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		return window.isSecureContext && !!this._getElement(elementOrPosition);
	}

	/**
	 * Copies the element (and removes it, with `cut: true`). Resolves when the clipboard has been written; rejects when
	 * the browser does not allow it.
	 */
	public override async execute(elementOrPosition?: ElementOrPosition): Promise<void> {
		const editor = this.editor;
		const model = editor.model;
		const element = this._getElement(elementOrPosition);

		if (!element) {
			return;
		}

		const dataTransfer = new ViewDataTransfer(new DataTransfer());

		// Always "copy": the pipeline would remove the content of the document selection when cutting.
		editor.plugins.get(ClipboardPipeline).fire<ClipboardOutputTransformationEvent>('outputTransformation', {
			dataTransfer,
			content: model.getSelectedContent(model.createSelection(element, 'on')),
			method: 'copy'
		});

		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([dataTransfer.getData('text/html')], { type: 'text/html' }),
				'text/plain': new Blob([dataTransfer.getData('text/plain')], { type: 'text/plain' })
			})
		]);

		if (this.cut && isInDocument(element) && model.canEditAt(element)) {
			model.change(writer => {
				writer.remove(element);
			});
		}
	}
}
