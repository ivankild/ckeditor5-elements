import { Paragraph, Plugin, type DowncastInsertEvent, type ModelElement } from 'ckeditor5';
import { ElementSchema, getVerbatimElements } from 'ckeditor5-elements';
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
 * * The converters of the schema write the elements with their names, and their attributes as they are, e.g.
 *   `<xref href="…">`: the `elementSchemaConverters` option is `'names'`. The editing view stays HTML: `div` and `span`,
 *   or the `editingTag` of the element.
 * * CKEditor's paragraph is the paragraph of the document, e.g. `para`.
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

	public init(): void {
		const editor = this.editor;
		const { paragraph, className } = this._getConfig();

		if (editor.config.get('elementSchemaConverters') !== 'names') {
			throw new Error(
				"XmlDocument: set elementSchemaConverters to 'names', so the data has the names of the elements."
			);
		}

		editor.conversion
			.for('dataDowncast')
			.elementToElement({ model: 'paragraph', view: paragraph, converterPriority: 'high' });
		editor.conversion.for('upcast').elementToElement({ view: paragraph, model: 'paragraph' });
		this._convertSoftBreak();

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
	 * Sets the data processor, once the element schema is registered, and before the data is loaded.
	 */
	public afterInit(): void {
		const editor = this.editor;
		const { root, prolog, paragraph } = this._getConfig();
		const definition = editor.plugins.get(ElementSchema).definition ?? {};

		editor.data.processor = new XmlDocumentDataProcessor(editor.data.viewDocument, {
			root,
			prolog,
			blockElements: [
				paragraph,
				...Object.entries(definition)
					.filter(([, element]) => !element.isInline)
					.map(([name]) => name)
			],
			preElements: getVerbatimElements(definition)
		});
	}

	/**
	 * A soft break is a new line of the text in the data, as XML has no element for it.
	 */
	private _convertSoftBreak(): void {
		this.editor.conversion.for('dataDowncast').add(dispatcher => {
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
}

declare module 'ckeditor5' {
	interface EditorConfig {
		/**
		 * The XML document whose content is the content of the editor. See {@link XmlDocument}.
		 */
		xmlDocument?: XmlDocumentConfig;
	}
}
