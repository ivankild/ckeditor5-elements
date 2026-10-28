import { ViewDataTransfer, plainTextToHtml, type ClipboardInputEventData, type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, isInDocument, isStandalone, type ElementOrPosition } from 'ckeditor5-elements-core';
import { pasteAfterIcon, pasteBeforeIcon, pasteIcon } from './icons.js';

/**
 * Where the pasted content goes, relative to the element:
 *
 * * `'replace'` – replaces the element,
 * * `'before'` – before the element,
 * * `'after'` – after the element.
 */
export type ElementPastePlacement = 'replace' | 'before' | 'after';

/**
 * Pastes the system clipboard content relative to an element.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). Parts of a structure, such as table cells, rows and captions, cannot
 * be replaced, nor have content pasted next to them, so the command is disabled for them.
 *
 * The content is pasted as with Ctrl+V: it goes through the clipboard pipeline (the `clipboardInput` event of the
 * editing view document), so other plugins process it, e.g. paste from Office cleans up content from Word, and image
 * upload uploads the images on the clipboard. The selection is moved to the pasted content.
 *
 * Requires a secure context (HTTPS or `localhost`), as it uses the asynchronous Clipboard API.
 * The browser may ask the user for permission.
 */
export default class ElementPasteCommand extends ElementOrPositionCommand {
	/**
	 * Where the pasted content goes, relative to the element.
	 */
	public readonly placement: ElementPastePlacement;

	constructor(editor: Editor, placement: ElementPastePlacement) {
		super(editor);

		this.placement = placement;
		this.title = {
			replace: editor.t('Paste'),
			before: editor.t('Paste before'),
			after: editor.t('Paste after')
		}[placement];
		this.icon = { replace: pasteIcon, before: pasteBeforeIcon, after: pasteAfterIcon }[placement];
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		const element = this._getElement(elementOrPosition);

		return window.isSecureContext && !!element && isStandalone(this.editor.model.schema, element);
	}

	/**
	 * Pastes the clipboard content relative to the element. Resolves when the content has been pasted; rejects when the
	 * browser does not allow reading the clipboard.
	 */
	public override async execute(elementOrPosition?: ElementOrPosition): Promise<void> {
		// Resolve the element before reading the clipboard, as the selection may change in the meantime.
		const element = this._requireElement(elementOrPosition);

		const dataTransfer = await readClipboard();

		if (!dataTransfer || !isInDocument(element)) {
			return;
		}

		const editing = this.editor.editing;
		const model = this.editor.model;
		const viewElement = editing.mapper.toViewElement(element);

		if (!viewElement) {
			return;
		}

		model.change(writer => {
			const target =
				this.placement === 'before'
					? writer.createRange(writer.createPositionBefore(element))
					: this.placement === 'after'
						? writer.createRange(writer.createPositionAfter(element))
						: writer.createRangeOn(element);

			if (!model.canEditAt(target)) {
				return;
			}

			// The same data as `ClipboardObserver` fires for Ctrl+V. The pipeline pastes at the selection.
			const data: ClipboardInputEventData = {
				dataTransfer,
				content:
					dataTransfer.getData('text/html') || plainTextToHtmlOrEmpty(dataTransfer.getData('text/plain')),
				method: 'paste',
				target: viewElement,
				targetRanges: [editing.mapper.toViewRange(target)]
			};

			writer.setSelection(target);
			editing.view.document.fire('clipboardInput', data);
		});
	}
}

/**
 * Reads the system clipboard into a data transfer: HTML, plain text and images (as files).
 */
async function readClipboard(): Promise<ViewDataTransfer | null> {
	const nativeDataTransfer = new DataTransfer();

	for (const item of await navigator.clipboard.read()) {
		for (const type of item.types) {
			const blob = await item.getType(type);

			if (type === 'text/html' || type === 'text/plain') {
				nativeDataTransfer.setData(type, await blob.text());
			} else if (type.startsWith('image/')) {
				nativeDataTransfer.items.add(new File([blob], `image.${type.slice('image/'.length)}`, { type }));
			}
		}
	}

	return nativeDataTransfer.types.length ? new ViewDataTransfer(nativeDataTransfer, { cacheFiles: true }) : null;
}

function plainTextToHtmlOrEmpty(text: string): string {
	return text ? plainTextToHtml(text) : '';
}
