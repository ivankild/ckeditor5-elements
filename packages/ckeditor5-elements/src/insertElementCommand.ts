import { Command } from 'ckeditor5';

/**
 * Inserts an `element` model element at the current selection.
 */
export default class InsertElementCommand extends Command {
	public override refresh(): void {
		const model = this.editor.model;
		const position = model.document.selection.getFirstPosition();

		this.isEnabled = !!position && model.schema.findAllowedParent(position, 'element') !== null;
	}

	public override execute(): void {
		const model = this.editor.model;

		model.change(writer => {
			model.insertObject(writer.createElement('element'), null, null, { setSelection: 'on' });
		});
	}
}
