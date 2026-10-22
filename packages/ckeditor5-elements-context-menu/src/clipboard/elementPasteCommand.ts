import { Command, plainTextToHtml, type Editor, type ModelElement } from 'ckeditor5';
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
 * Pastes the system clipboard content relative to the given element. HTML is preferred over plain text.
 *
 * Requires a secure context (HTTPS or `localhost`), as it uses the asynchronous Clipboard API.
 * The browser may ask the user for permission.
 */
export default class ElementPasteCommand extends Command {
	/**
	 * Where the pasted content goes, relative to the element.
	 */
	public readonly placement: ElementPastePlacement;

	constructor(editor: Editor, placement: ElementPastePlacement) {
		super(editor);

		this.placement = placement;

		// The command acts on a given element, not on the selection.
		this._isEnabledBasedOnSelection = false;
	}

	public override refresh(): void {
		this.isEnabled = window.isSecureContext;
	}

	public override async execute(element: ModelElement): Promise<void> {
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
