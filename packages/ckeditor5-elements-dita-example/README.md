# ckeditor5-elements-dita-example

The DITA example of CKEditor 5 Elements: an editor of a Lightweight DITA topic. The data of the editor is the XML of the
topic (XDITA), and its content is the DITA elements, declared in an element schema. Not published.

**[Try it in the documentation](https://ivankild.github.io/ckeditor5-elements/examples/dita)**, or run it from the
repository, with the XML below the editor:

```sh
pnpm example:dita
```

- `schema.json`: the DITA elements, by their names: the lists (`listItem`) and `pre` (`verbatim`) work as their keys
  say.
- `config.ts` and `topic.xml`: the editor config, and the topic it loads.
- The data is XML, by `XmlDocument` of [`ckeditor5-elements-xml-example`](../ckeditor5-elements-xml-example), which the
  DocBook example uses too.

## License

MIT
