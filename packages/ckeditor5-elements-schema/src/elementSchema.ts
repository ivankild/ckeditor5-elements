import { Plugin, type ModelSchema } from 'ckeditor5';
import { findPlugin } from 'ckeditor5-elements-core';
import { compileElementSchema } from './definition/compileElementSchema.js';
import { getModelKind } from './definition/kinds.js';
import { convertElementSchema } from './conversion/convertElementSchema.js';
import ElementSchemaError from './definition/elementSchemaError.js';
import { getInlineTextElements, getLists, getVerbatimElements } from './definition/queries.js';
import type { ElementSchemaDefinition, ElementSchemaKind } from './definition/types.js';
import { parseElementSchema } from './definition/validateElementSchema.js';
import { enableListTyping } from './typing/lists.js';
import { enableTwoStepCaretMovement } from './typing/twoStepCaretMovement.js';
import { enableVerbatimTyping } from './typing/verbatim.js';

/**
 * Declares the elements of the content in the model schema of the editor, from a simple definition, the `elementSchema`
 * editor option: a plain object, e.g. a JSON file. It is the list of the elements the content is made of, formatting
 * included: what each one holds, where it goes, and which attributes it has.
 *
 * ```json
 * {
 *   "note": { "type": "container", "allowAttributes": ["type"] },
 *   "title": { "type": "block", "allowIn": ["note"] },
 *   "badge": { "type": "empty", "isInline": true, "allowAttributes": ["color"] }
 * }
 * ```
 *
 * Every element has one of three types, instead of CKEditor's many `is*` flags and generic items:
 *
 * * `empty`: has no content, like an image. It is an object, selected as a whole. With `isInline`, it is in a line of text.
 * * `block`: can contain text and inline elements, like a paragraph. With `isInline`, it is an inline element with text,
 *   like a bold, a link or a term, with attributes of its own.
 * * `container`: cannot contain text, but blocks, containers and empty elements, like a block quote.
 *
 * `allowAttributes` and `allowChildren` work as in CKEditor's schema. `allowIn` too, but it replaces the default places.
 * See {@link ElementSchemaElement}.
 *
 * Two keys make a kind of their own of a type, with its typing:
 *
 * * `verbatim` makes a block keep its whitespace, e.g. code: Enter inserts a new line in it.
 * * `listItem` makes a container a list of its items, e.g. `"listItem": "listitem"`: it holds only its items, and Enter
 *   in an item makes the next one.
 *
 * At the ends of the inline elements with text, the left and right arrow keys move in two steps, as CKEditor's two-step
 * caret movement does at the ends of a bold: in the element, then in the text.
 *
 * The schema is validated first, and a schema that is contradictory or refers to unknown elements is not accepted: the
 * editor is not created, and the {@link ElementSchemaError} lists all the problems (see {@link validateElementSchema}).
 *
 * The elements are registered after the plugins are initialized (in `afterInit()`), so they can refer to the elements
 * of other plugins, e.g. `paragraph`. Plugins that extend or convert the elements must do it in `afterInit()` too, or
 * later; the converters can be declared at any time.
 *
 * The `empty` and `container` elements can be selected as a whole, by a click on them and by the arrow keys, when
 * the `ElementSelectable` plugin is loaded too: the element schema does not depend on it, and uses it when it is there
 * (with `elementSchemaConverters`, it warns when it is not).
 *
 * The plugin declares the schema only: how the elements look in the editor and in the data is declared with
 * converters, or by the plugin with the `elementSchemaConverters` option: one to one, as `div` and `span` (`true`), or
 * with the names of the elements in the data (`'names'`), e.g. for XML.
 */
export default class ElementSchema extends Plugin {
	public static get pluginName(): 'ElementSchema' {
		return 'ElementSchema' as const;
	}

	/**
	 * The element schema of the editor, once it is validated and registered (in `afterInit()`): the `elementSchema`
	 * option. `null` before, and without the option.
	 */
	public get definition(): ElementSchemaDefinition | null {
		return this._definition;
	}

	private _definition: ElementSchemaDefinition | null = null;

	public afterInit(): void {
		const input = this.editor.config.get('elementSchema');

		if (input === undefined) {
			return;
		}

		const schema = this.editor.model.schema;
		const { definition, issues } = parseElementSchema(input, { external: getExternalKinds(schema) });

		if (!definition) {
			throw new ElementSchemaError(issues);
		}

		const { items, children } = compileElementSchema(definition);

		for (const [name, definition] of items) {
			schema.register(name, definition);
		}

		for (const { parent, child } of children) {
			schema.extend(child, { allowIn: parent });
		}

		this._definition = definition;
		this._makeSelectable(definition);

		const converters = this.editor.config.get('elementSchemaConverters');

		if (converters) {
			convertElementSchema(this.editor, definition, converters);
		}

		this._enableTyping(definition);
	}

	/**
	 * Makes typing work as the kinds of elements need: two-step caret movement at the ends of the inline elements with
	 * text, and Enter for a new line in a verbatim block, and for the next item in a list.
	 */
	private _enableTyping(definition: ElementSchemaDefinition): void {
		const inlineText = new Set(getInlineTextElements(definition));
		const verbatim = new Set(getVerbatimElements(definition));
		const lists = getLists(definition);

		if (inlineText.size) {
			enableTwoStepCaretMovement(this, inlineText);
		}

		if (verbatim.size) {
			enableVerbatimTyping(this, verbatim);
		}

		if (lists.size) {
			enableListTyping(this, lists);
		}
	}

	/**
	 * Makes the `empty` elements and the containers selectable as a whole, by a click on them and by the arrow keys, with
	 * `ElementSelectable`. Not the blocks: a click in a block puts the cursor in its text.
	 */
	private _makeSelectable(definition: ElementSchemaDefinition): void {
		const names = Object.entries(definition)
			.filter(([, element]) => element.type === 'empty' || element.type === 'container')
			.map(([name]) => name);
		const selectable = findPlugin(this.editor, 'ElementSelectable', isSelectablePlugin);

		if (selectable) {
			selectable.add(...names);
		} else if (names.length && this.editor.config.get('elementSchemaConverters')) {
			// The converters make the elements, and nothing selects them: say it, as it is a silent loss. Not CKEditor's
			// `logWarning()`: it links to CKEditor's list of errors, which does not have this one.
			// eslint-disable-next-line no-console -- A warning for the developer, once, when the editor is created.
			console.warn(
				`ElementSchema: load ElementSelectable to select the elements of the schema as a whole: ${names.join(', ')}.`
			);
		}
	}
}

/**
 * The part of the `ElementSelectable` plugin the element schema uses. The schema does not depend on the other features:
 * the plugin is looked up by name and checked against this interface.
 */
interface SelectablePlugin {
	add(...names: string[]): void;
}

function isSelectablePlugin(plugin: object): plugin is SelectablePlugin {
	return 'add' in plugin && typeof plugin.add === 'function';
}

/**
 * Returns the kinds of the elements of other plugins (see {@link getModelKind}). The generic items (`$block`, …) are not
 * elements.
 */
function getExternalKinds(schema: ModelSchema): Record<string, ElementSchemaKind> {
	const kinds: Record<string, ElementSchemaKind> = {};

	for (const name of Object.keys(schema.getDefinitions())) {
		if (!name.startsWith('$')) {
			kinds[name] = getModelKind(schema, name);
		}
	}

	return kinds;
}
