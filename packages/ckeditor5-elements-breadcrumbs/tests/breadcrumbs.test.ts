import {
	Bold,
	Paragraph,
	Plugin,
	_setModelData,
	type ClassicEditor,
	type EditorConfig,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BreadcrumbItemView from '../src/breadcrumbItemView.js';
import Breadcrumbs from '../src/breadcrumbs.js';
import BreadcrumbsView from '../src/breadcrumbsView.js';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('Breadcrumbs', () => {
	let editor: ClassicEditor;
	let plugin: Breadcrumbs;

	const labels = (): string[] => plugin.items.map(item => item.label);

	async function setUp(plugins: EditorConfig['plugins'] = [Paragraph, Bold, Container, Breadcrumbs]): Promise<void> {
		editor = await createEditor({ plugins });
		plugin = editor.plugins.get('Breadcrumbs');
	}

	afterEach(async () => {
		await editor.destroy();
	});

	describe('items', () => {
		beforeEach(async () => {
			await setUp();
		});

		it('has a plugin name', () => {
			expect(Breadcrumbs.pluginName).toBe('Breadcrumbs');
		});

		it('lists the view elements at the selection, outermost first', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			expect(labels()).toEqual(['section.container', 'p']);
			expect(plugin.items[1]?.viewElement.name).toBe('p');
		});

		it('skips attribute elements', () => {
			_setModelData(editor.model, '<paragraph><$text bold="true">fo[]o</$text></paragraph>');

			expect(labels()).toEqual(['p']);
		});

		it('updates when the selection moves', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>'
			);

			editor.model.change(writer => {
				writer.setSelection(editor.model.document.getRoot()!.getChild(1)!, 0);
			});

			expect(labels()).toEqual(['p']);
		});

		it('keeps the same items when nothing changed', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			const items = plugin.items;

			plugin.refresh();

			expect(plugin.items).toBe(items);
		});

		it('replaces the items when an element is replaced by an identical one', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			const items = plugin.items;

			editor.setData('<p>foo</p>');

			expect(plugin.items).not.toBe(items);
			expect(labels()).toEqual(['p']);
		});
	});

	describe('views', () => {
		let view: BreadcrumbsView;

		beforeEach(async () => {
			await setUp();

			view = editor.ui.componentFactory.create('breadcrumbs') as BreadcrumbsView;
			view.render();
			document.body.append(view.element!);
		});

		afterEach(() => {
			view.element?.remove();
			view.destroy();
		});

		it('are created by the `breadcrumbs` component', () => {
			expect(view).toBeInstanceOf(BreadcrumbsView);
			expect(view.element?.tagName).toBe('NAV');
			expect(view.element?.getAttribute('aria-label')).toBe('Element path');
		});

		it('show a button per item and follow the changes', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const buttons = Array.from(view.items);

			expect(buttons.map(button => button.label)).toEqual(['section.container', 'p']);
			expect(buttons[0]).toBeInstanceOf(BreadcrumbItemView);
			expect(buttons[0]?.withText).toBe(true);
			expect(buttons[0]?.element?.classList.contains('ck-elements-breadcrumbs__item')).toBe(true);

			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(Array.from(view.items, button => button.label)).toEqual(['p']);
		});

		it('focus() focuses the innermost item', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			view.focus();

			expect(document.activeElement).toBe(view.items.last?.element);
		});

		it('do nothing when clicked without the context menu plugin', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(() => {
				view.items.first?.element?.click();
			}).not.toThrow();
		});

		it('createView() uses the editor locale by default', () => {
			const another = plugin.createView();

			expect(another.locale).toBe(editor.locale);
			another.destroy();
		});
	});

	describe('with another plugin named ElementContextMenu', () => {
		it('opens it when it has an `open()` method, and ignores it otherwise', async () => {
			const open = vi.fn(() => true);

			class MenuLike extends Plugin {
				public static get pluginName(): 'ElementContextMenu' {
					return 'ElementContextMenu' as const;
				}

				public open = open;
			}

			class NotAMenu extends Plugin {
				public static get pluginName(): 'ElementContextMenu' {
					return 'ElementContextMenu' as const;
				}
			}

			for (const [MenuPlugin, calls] of [
				[MenuLike, 1],
				[NotAMenu, 0]
			] as const) {
				await setUp([Paragraph, Breadcrumbs, MenuPlugin]);
				open.mockClear();
				_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

				const view = plugin.createView();

				view.render();
				view.items.first!.element!.click();

				expect(open).toHaveBeenCalledTimes(calls);

				view.destroy();

				if (MenuPlugin === MenuLike) {
					await editor.destroy();
				}
			}
		});
	});

	describe('with the context menu', () => {
		let view: BreadcrumbsView;
		let contextMenu: ElementContextMenu;

		beforeEach(async () => {
			await setUp([Paragraph, Container, Breadcrumbs, ElementContextMenu]);

			contextMenu = editor.plugins.get('ElementContextMenu');
			view = plugin.createView();
			view.render();
			document.body.append(view.element!);
		});

		afterEach(() => {
			view.element?.remove();
			view.destroy();
		});

		it('opens the menu of the clicked element below its button', () => {
			const openSpy = vi.spyOn(contextMenu, 'open');

			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			button.element!.click();

			const container = editor.model.document.getRoot()!.getChild(0) as ModelElement;

			expect(openSpy).toHaveBeenCalledWith(container, button.element);
			expect(contextMenu.view).not.toBeNull();
		});

		it('does nothing for an item whose element is gone', () => {
			const openSpy = vi.spyOn(contextMenu, 'open');

			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			// Keep the old buttons, as if the view did not update.
			view.stopListening(plugin, 'change:items');
			editor.setData('<p>foo</p>');

			button.element!.click();

			expect(openSpy).not.toHaveBeenCalled();
		});
	});
});
