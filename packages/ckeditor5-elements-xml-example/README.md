# ckeditor5-elements-xml-example

The XML documents of the examples of CKEditor 5 Elements: the data of an editor as an XML document, whose elements are
the elements of the element schema, by their names. The [DocBook](../ckeditor5-elements-docbook-example) and the
[DITA](../ckeditor5-elements-dita-example) examples use it. Not published.

- `xmlDocumentDataProcessor.ts`: the data processor: the XML of the document to the view, and back, with its root
  element and its prolog.
- `xmlDocument.ts`: the `XmlDocument` plugin: the data processor, and the converters of the data, by the names of the
  elements. It is configured by the `xmlDocument` option: `{ root, prolog, paragraph, className }`.

## License

MIT
