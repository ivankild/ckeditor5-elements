import { plainTextToHtml, type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, type PositionOrElement } from 'ckeditor5-elements-ui';
import { isInDocument } from './utils.js';

/**
 * Where the pasted content goes, relative to the element:
 *
 * * `'replace'` – replaces the element,
 * * `'before'` – before the element,
 * * `'after'` – after the element.
 */
export type ElementPastePlacement = 'replace' | 'before' | 'after';

/**
 * Pastes the system clipboard content relative to an element. HTML is preferred over plain text.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}).
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

		// The command may act on a given element, so it does not depend on whether the selection can be edited.
		this._isEnabledBasedOnSelection = false;
	}

	protected override _isEnabledFor(positionOrElement?: PositionOrElement): boolean {
		return window.isSecureContext && !!this._getElement(positionOrElement);
	}

	/**
	 * Pastes the clipboard content relative to the element. Resolves when the content has been inserted.
	 */
	public override async execute(positionOrElement?: PositionOrElement): Promise<void> {
		// Resolve the element before reading the clipboard, as the selection may change in the meantime.
		const element = this._getElement(positionOrElement);

		if (!element) {
			return;
		}

		const html = await readClipboardHtml();

		if (!html || !isInDocument(element)) {
			return;
		}

		const editor = this.editor;
		const model = editor.model;
		const content = editor.data.parse(html);

		model.change(writer => {
			const target =
				this.placement === 'before'
					? writer.createPositionBefore(element)
					: this.placement === 'after'
						? writer.createPositionAfter(element)
						: writer.createRangeOn(element);

			if (model.canEditAt(target)) {
				model.insertContent(content, target);
			}
		});
	}
}

async function readClipboardHtml(): Promise<string | null> {
	for (const item of await navigator.clipboard.read()) {
		if (item.types.includes('text/html')) {
			return (await item.getType('text/html')).text();
		}

		if (item.types.includes('text/plain')) {
			return plainTextToHtml(await (await item.getType('text/plain')).text());
		}
	}

	return null;
}
