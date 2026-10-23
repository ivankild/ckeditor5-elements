import { Dialog, type Editor } from 'ckeditor5';
import { ElementOrPositionCommand, type ElementOrPosition } from 'ckeditor5-elements-core';
import ElementAttributesView from './elementAttributesView.js';
import { attributesIcon } from './icons.js';

/**
 * The longest value shown in full. Longer ones, e.g. the data of an image, are cut.
 */
const MAX_VALUE_LENGTH = 120;

/**
 * Shows the attributes of an element, as key-value pairs, in CKEditor's modal dialog.
 *
 * The element is the given one, the parent of the given position, or the selected element or the parent of the
 * selection (see {@link ElementOrPositionCommand}). It does not change the data, so it works in read-only mode.
 *
 * Strings are shown as they are, other values (numbers, booleans, objects) as JSON. Long values are cut.
 */
export default class ElementAttributesCommand extends ElementOrPositionCommand {
	constructor(editor: Editor) {
		super(editor);

		this.title = editor.t('Show attributes');
		this.icon = attributesIcon;

		// It only reads the element.
		this.affectsData = false;
	}

	/**
	 * Returns the attributes of the element as key-value pairs of text, as the dialog shows them.
	 */
	public getAttributes(elementOrPosition?: ElementOrPosition): [key: string, value: string][] {
		const element = this._getElement(elementOrPosition);

		return element ? Array.from(element.getAttributes(), ([key, value]) => [key, formatValue(value)]) : [];
	}

	/**
	 * Shows the dialog with the attributes of the element, in place of the one that is open.
	 */
	public override execute(elementOrPosition?: ElementOrPosition): void {
		const editor = this.editor;
		const element = this._getElement(elementOrPosition);

		if (!element) {
			return;
		}

		const dialog = editor.plugins.get(Dialog);

		dialog.show({
			id: 'elementAttributes',
			isModal: true,
			title: `<${element.name}>`,
			content: new ElementAttributesView(editor.locale, this.getAttributes(element), editor.t('No attributes')),
			actionButtons: [
				{
					label: editor.t('Close'),
					withText: true,
					onExecute: () => {
						dialog.hide();
					}
				}
			]
		});
	}

	protected override _isEnabledFor(elementOrPosition?: ElementOrPosition): boolean {
		return !!this._getElement(elementOrPosition);
	}
}

function formatValue(value: unknown): string {
	const text = typeof value === 'string' ? value : JSON.stringify(value);

	return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…` : text;
}
