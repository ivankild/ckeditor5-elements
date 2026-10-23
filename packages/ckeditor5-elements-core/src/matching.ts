import type { Editor, Mapper, ModelElement, ViewElement } from 'ckeditor5';

/**
 * Matches model elements: the name of a model element (e.g. `'imageBlock'`), or a function that returns whether it is for
 * the given element (e.g. `element => element.hasAttribute('linkHref')`).
 */
export type ElementMatcher = string | ((element: ModelElement) => boolean);

/**
 * Returns whether the matcher is for the element.
 */
export function matchesElement(matcher: ElementMatcher, element: ModelElement): boolean {
	return typeof matcher === 'string' ? element.name === matcher : matcher(element);
}

/**
 * Returns the model elements of a view element and its ancestors, the innermost first, with their view elements. The view
 * elements that are not converted from model elements, and roots, are skipped.
 */
export function* getElementsAround(
	mapper: Mapper,
	viewElement: ViewElement
): Generator<{ element: ModelElement; viewElement: ViewElement }> {
	for (let node: ViewElement | null = viewElement; node; node = node.parent?.is('element') ? node.parent : null) {
		const element = mapper.toModelElement(node);

		if (element && !element.is('rootElement')) {
			yield { element, viewElement: node };
		}
	}
}

/**
 * Returns the plugin of the name when it is loaded and fits the guard, `null` otherwise. The features use it to work with
 * another feature without depending on it: they look the plugin up by name, and check it against the interface they use.
 */
export function findPlugin<T extends object>(
	editor: Editor,
	name: string,
	isPlugin: (plugin: object) => plugin is T
): T | null {
	const plugin: unknown = editor.plugins.has(name) ? editor.plugins.get(name) : null;

	return typeof plugin === 'object' && plugin !== null && isPlugin(plugin) ? plugin : null;
}
