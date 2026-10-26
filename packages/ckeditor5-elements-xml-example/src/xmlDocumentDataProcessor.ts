import {
	ViewDomConverter,
	type DataProcessor,
	type MatcherPattern,
	type ViewDocument,
	type ViewDocumentFragment,
	type ViewElement,
	type ViewNode
} from 'ckeditor5';

/**
 * The options of {@link XmlDocumentDataProcessor}.
 */
export interface XmlDocumentDataProcessorOptions {
	/**
	 * The name of the root element of the document, e.g. `article` or `topic`: the content of the editor is its content.
	 */
	root: string;

	/**
	 * What comes before the root element: the XML declaration, and the document type, e.g.
	 * `'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE …>\n'`.
	 */
	prolog: string;

	/**
	 * The names of the block-level elements of the data, e.g. `section` and `para`: each one is on a line of its own, and
	 * the whitespace between them is not text.
	 */
	blockElements: readonly string[];

	/**
	 * The names of the elements whose whitespace is kept as it is, e.g. the verbatim blocks of an element schema.
	 */
	preElements?: readonly string[];
}

/**
 * The data processor of an XML document: the editor data is the XML of the document, and the content of the editor is
 * the content of its root element.
 *
 * * {@link toView} parses the XML with the browser's XML parser, so data that is not well-formed is rejected, and takes
 *   the children of the root element. The attributes of the root element are kept, for the data written next, e.g. the
 *   `id` of a topic.
 * * {@link toData} writes the XML from the view, element for element: each element with its name and its attributes,
 *   the block-level elements on lines of their own, indented, and the text escaped. An empty element is written as
 *   `<para/>`. There are no fillers, which HTML needs and XML does not have.
 */
export default class XmlDocumentDataProcessor implements DataProcessor {
	public skipComments = true;

	private readonly _domParser = new DOMParser();
	private readonly _domConverter: ViewDomConverter;
	private readonly _root: string;
	private readonly _prolog: string;
	private readonly _blockElements: ReadonlySet<string>;

	/**
	 * The attributes of the root element of the data loaded last, written in the data again.
	 */
	private _rootAttributes = '';

	constructor(
		viewDocument: ViewDocument,
		{ root, prolog, blockElements, preElements = [] }: XmlDocumentDataProcessorOptions
	) {
		this._domConverter = new ViewDomConverter(viewDocument, { renderingMode: 'data' });

		// The whitespace between block-level elements is the indentation of the XML, not text; in a `pre` element, it is.
		this._domConverter.blockElements.push(...blockElements);
		this._domConverter.preElements.push(...preElements);
		this._root = root;
		this._prolog = prolog;
		this._blockElements = new Set(blockElements);
	}

	/**
	 * Converts the XML of a document to the view: the content of its root element. Throws for data that is not
	 * well-formed XML, or whose root is another element.
	 */
	public toView(data: string): ViewDocumentFragment {
		const fragment = document.createDocumentFragment();

		this._rootAttributes = '';

		if (data.trim()) {
			const xml = this._domParser.parseFromString(data, 'application/xml');
			const error = xml.getElementsByTagName('parsererror').item(0);

			if (error) {
				throw new Error(`The data is not well-formed XML: ${error.textContent.trim()}`);
			}

			const root = xml.documentElement;

			if (root.localName !== this._root) {
				throw new Error(`The data must be a "${this._root}", not a "${root.localName}".`);
			}

			this._rootAttributes = writeAttributes(Array.from(root.attributes, ({ name, value }) => [name, value]));

			for (const child of Array.from(root.childNodes)) {
				fragment.append(document.importNode(child, true));
			}
		}

		return this._domConverter.domToView(fragment, {
			keepOriginalCase: true,
			skipComments: this.skipComments
		}) as ViewDocumentFragment;
	}

	/**
	 * Converts the view to the XML of a document.
	 */
	public toData(viewFragment: ViewDocumentFragment): string {
		const content = Array.from(viewFragment.getChildren())
			.map(node => this._writeLine(node, 1))
			.join('\n');
		const start = `<${this._root}${this._rootAttributes}`;

		return `${this._prolog}${content ? `${start}>\n${content}\n</${this._root}>` : `${start}/>`}\n`;
	}

	public registerRawContentMatcher(pattern: MatcherPattern): void {
		this._domConverter.registerRawContentMatcher(pattern);
	}

	/**
	 * Does nothing: the data has no fillers.
	 */
	public useFillerType(): void {
		// The data is written from the view, which has no fillers.
	}

	/**
	 * Writes a node on a line of its own, indented: a block-level element, with its children on lines of their own when
	 * there are block-level elements among them, or anything else as inline content.
	 */
	private _writeLine(node: ViewNode, depth: number): string {
		const indent = '\t'.repeat(depth);

		if (!this._isBlock(node)) {
			return indent + writeInline(node);
		}

		const children = Array.from(node.getChildren());
		const start = `<${node.name}${writeAttributes(node.getAttributes())}`;

		if (!children.length) {
			return `${indent}${start}/>`;
		}

		if (children.some(child => this._isBlock(child))) {
			const lines = children.map(child => this._writeLine(child, depth + 1)).join('\n');

			return `${indent}${start}>\n${lines}\n${indent}</${node.name}>`;
		}

		return `${indent}${start}>${children.map(writeInline).join('')}</${node.name}>`;
	}

	private _isBlock(node: ViewNode): node is ViewElement {
		return node.is('element') && this._blockElements.has(node.name);
	}
}

/**
 * Writes a node in a line of text: text, escaped, or an element with its content.
 */
function writeInline(node: ViewNode): string {
	if (node.is('$text')) {
		return escape(node.data);
	}

	if (!node.is('element')) {
		return '';
	}

	const children = Array.from(node.getChildren());
	const start = `<${node.name}${writeAttributes(node.getAttributes())}`;

	return children.length ? `${start}>${children.map(writeInline).join('')}</${node.name}>` : `${start}/>`;
}

function writeAttributes(attributes: Iterable<[string, string]>): string {
	return Array.from(attributes)
		.map(([key, value]) => ` ${key}="${escape(value).replaceAll('"', '&quot;')}"`)
		.join('');
}

function escape(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
