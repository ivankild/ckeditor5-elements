import { Paragraph, Plugin, type DowncastInsertEvent, type Editor, type ModelElement } from 'ckeditor5';
import { ElementSchema, getVerbatimElements, type ElementSchemaElement } from 'ckeditor5-elements';
import XmlDocumentDataProcessor from './xmlDocumentDataProcessor.js';

/**
 * The `xmlDocument` option: the XML document whose content is the content of the editor.
 */
export interface XmlDocumentConfig {
	/**
	 * The name of the root element of the document, e.g. `article` or `topic`.
	 */
	root: string;

	/**
	 * What comes before the root element: the XML declaration and the document type.
	 */
	prolog: string;

	/**
	 * The name of CKEditor's paragraph in the data, e.g. `para` or `p`. The paragraph is the paragraph of the document,
	 * so typing, Enter and an empty editor work as usual.
	 */
	paragraph: string;

	/**
	 * The class of the editable, for the styles of the content, e.g. `docbook`.
	 */
	className?: string;
}

/**
 * Edits an XML document whose elements are the elements of the element schema, by their names: the editor data is the
 * XML of the document (see {@link XmlDocumentDataProcessor}), and the content of the editor is the content of its root
 * element. It is configured by the `xmlDocument` option.
 *
 * * In the data, each element of the schema is the XML element of its name, with its attributes as they are, e.g.
 *   `<xref href="…">`, and CKEditor's paragraph is the paragraph of the document. The editing view is the one of the
 *   converters of the schema, so the browser edits HTML: `div` and `span`, or the `editingTag` of the element.
 * * The verbatim blocks of the schema keep their whitespace in the data.
 * * A soft break (Shift+Enter) of a paragraph is a new line in the data, as XML has no element for it.
 */
export default class XmlDocument extends Plugin {
	public static get pluginName(): 'XmlDocument' {
		return 'XmlDocument' as const;
	}

	public static get requires(): readonly [typeof Paragraph, typeof ElementSchema] {
		return [Paragraph, ElementSchema] as const;
	}

	constructor(editor: Editor) {
		super(editor);

		const { root, prolog, paragraph } = this._getConfig();

		// Before the data is loaded.
		editor.data.processor = new XmlDocumentDataProcessor(editor.data.viewDocument, {
			root,
			prolog,
			blockElements: [
				paragraph,
				...this._getElements()
					.filter(([, element]) => !element.isInline)
					.map(([name]) => name)
			],
			preElements: getVerbatimElements(editor.config.get('elementSchema') ?? {})
		});
	}

	public init(): void {
		const editor = this.editor;
		const { className } = this._getConfig();

		this._convertData();

		if (className) {
			this.listenTo(editor.ui, 'ready', () => {
				const root = editor.editing.view.document.getRoot();

				if (root) {
					editor.editing.view.change(writer => {
						writer.addClass(className, root);
					});
				}
			});
		}
	}

	/**
	 * Declares the converters of the data: each element of the schema as the XML element of its name, over the
	 * converters of the schema, and its attributes with their names.
	 */
	private _convertData(): void {
		const conversion = this.editor.conversion;
		const { paragraph } = this._getConfig();

		conversion
			.for('dataDowncast')
			.elementToElement({ model: 'paragraph', view: paragraph, converterPriority: 'high' });
		conversion.for('upcast').elementToElement({ view: paragraph, model: 'paragraph' });

		for (const [name, { allowAttributes = [] }] of this._getElements()) {
			conversion.for('dataDowncast').elementToElement({ model: name, view: name, converterPriority: 'highest' });
			conversion.for('upcast').elementToElement({ view: name, model: name });

			for (const key of allowAttributes) {
				conversion
					.for('dataDowncast')
					.attributeToAttribute({ model: { name, key }, view: key, converterPriority: 'high' });
				conversion.for('upcast').attributeToAttribute({ view: { name, key }, model: key });
			}
		}

		// A soft break is a new line of the text in the data, as XML has no element for it.
		conversion.for('dataDowncast').add(dispatcher => {
			dispatcher.on<DowncastInsertEvent<ModelElement>>(
				'insert:softBreak',
				(evt, data, { consumable, mapper, writer }) => {
					if (consumable.consume(data.item, 'insert')) {
						writer.insert(mapper.toViewPosition(data.range.start), writer.createText('\n'));
					}
				},
				{ priority: 'high' }
			);
		});
	}

	private _getConfig(): XmlDocumentConfig {
		const config = this.editor.config.get('xmlDocument');

		if (!config) {
			throw new Error('XmlDocument: the xmlDocument option is required: { root, prolog, paragraph }.');
		}

		return config;
	}

	/**
	 * Returns the elements of the element schema, by name.
	 */
	private _getElements(): [name: string, element: ElementSchemaElement][] {
		return Object.entries(this.editor.config.get('elementSchema') ?? {}) as [string, ElementSchemaElement][];
	}
}

declare module 'ckeditor5' {
	interface EditorConfig {
		/**
		 * The XML document whose content is the content of the editor. See {@link XmlDocument}.
		 */
		xmlDocument?: XmlDocumentConfig;
	}
}
