# ckeditor5-elements-docbook-example

The DocBook example of CKEditor 5 Elements: an editor of a Simplified DocBook article. The data of the editor is the XML
of the article, and its content is the DocBook elements, declared in an element schema. Not published.

**[Try it in the documentation](https://ivankild.github.io/ckeditor5-elements/examples/docbook)**, or run it from the
repository, with the XML below the editor:

```sh
pnpm example:docbook
```

- `schema.json`: the DocBook elements, by their names.
- The data is XML, by `XmlDocument` of [`ckeditor5-elements-xml-example`](../ckeditor5-elements-xml-example), which the
  DITA example uses too.
- `config.ts` and `article.xml`: the editor config, and the article it loads.

## License

MIT
