import { Paragraph, Plugin, _setModelData, type ClassicEditor, type ModelElement } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import { findPlugin, getElementsAround, matchesElement } from '../src/matching.js';

describe('matching', () => {
	let editor: ClassicEditor;

	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	beforeEach(async () => {
		editor = await createEditor({ plugins: [Paragraph, Container] });
		_setModelData(editor.model, '<container type="a"><paragraph>f[]oo</paragraph></container>');
	});

	afterEach(async () => {
		await editor.destroy();
	});

	describe('matchesElement()', () => {
		it('matches a name', () => {
			expect(matchesElement('container', child(0))).toBe(true);
			expect(matchesElement('container', child(0, 0))).toBe(false);
		});

		it('matches by a filter function, which gets the element', () => {
			expect(matchesElement(element => element.getAttribute('type') === 'a', child(0))).toBe(true);
			expect(matchesElement(element => element.getAttribute('type') === 'a', child(0, 0))).toBe(false);
		});
	});

	describe('getElementsAround()', () => {
		it('returns the elements of a view element and its ancestors, the innermost first, with their view elements', () => {
			const view = editor.editing.mapper.toViewElement(child(0, 0))!;
			const around = [...getElementsAround(editor.editing.mapper, view)];

			expect(around.map(({ element }) => element)).toEqual([child(0, 0), child(0)]);
			expect(around[0]?.viewElement).toBe(view);
			expect(around[1]?.viewElement).toBe(view.parent);
		});

		it('skips the view elements that are not converted from model elements, and the root', () => {
			const view = editor.editing.mapper.toViewElement(child(0, 0))!;

			editor.editing.view.change(writer => {
				writer.insert(
					writer.createPositionAt(view, 'end'),
					writer.createContainerElement('span', { class: 'plain' })
				);
			});

			const span = [...view.getChildren()].find(node => node.is('element', 'span'))!;
			const elements = [...getElementsAround(editor.editing.mapper, span as never)].map(({ element }) => element);

			expect(elements).toEqual([child(0, 0), child(0)]);
		});
	});

	describe('findPlugin()', () => {
		const hasAdd = (plugin: object): plugin is { add(): void } => 'add' in plugin;

		it('returns a loaded plugin that fits the guard', async () => {
			class Adder extends Plugin {
				public static get pluginName(): 'Adder' {
					return 'Adder' as const;
				}

				public add(): void {
					// Nothing to do: the plugin only has to fit the guard.
				}
			}

			await editor.destroy();
			editor = await createEditor({ plugins: [Paragraph, Adder] });

			expect(findPlugin(editor, 'Adder', hasAdd)).toBe(editor.plugins.get('Adder'));
		});

		it('returns null for a plugin that is not loaded, or does not fit the guard', () => {
			expect(findPlugin(editor, 'Adder', hasAdd)).toBeNull();
			expect(findPlugin(editor, 'Paragraph', hasAdd)).toBeNull();
		});
	});
});
