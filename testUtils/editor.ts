import { ClassicEditor, Plugin, View, type EditorConfig } from 'ckeditor5';

/**
 * Creates a `ClassicEditor` in a new element appended to the body.
 */
export async function createEditor(config: EditorConfig): Promise<ClassicEditor> {
	const element = document.createElement('div');

	document.body.append(element);

	return ClassicEditor.create({ attachTo: element, licenseKey: 'GPL', ...config });
}

/**
 * Registers a `container` model element that can hold blocks, converted to `<section class="container">`,
 * with an optional `type` attribute converted to `data-type`. Also registers `containerItem`, allowed only
 * inside a container.
 */
export class Container extends Plugin {
	public static get pluginName(): 'Container' {
		return 'Container' as const;
	}

	public init(): void {
		const schema = this.editor.model.schema;
		const conversion = this.editor.conversion;

		schema.register('container', { allowWhere: '$block', allowContentOf: '$root', allowAttributes: ['type'] });
		schema.register('containerItem', { allowIn: 'container', allowContentOf: '$block' });

		conversion.elementToElement({ model: 'container', view: { name: 'section', classes: 'container' } });
		conversion.elementToElement({ model: 'containerItem', view: { name: 'div', classes: 'container-item' } });
		conversion.attributeToAttribute({ model: { name: 'container', key: 'type' }, view: 'data-type' });
	}
}

/**
 * Creates a simple view that cannot be focused, e.g. a menu separator.
 */
export function createPlainView(): View {
	const view = new View();

	view.setTemplate({ tag: 'div', attributes: { class: 'plain' } });

	return view;
}
