import {
	Bold,
	ButtonView,
	Paragraph,
	Plugin,
	_setModelData,
	type ClassicEditor,
	type EditorConfig,
	type ModelElement
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BreadcrumbItemView from '../src/breadcrumbItemView.js';
import BreadcrumbLabelView from '../src/breadcrumbLabelView.js';
import Breadcrumbs from '../src/breadcrumbs.js';
import BreadcrumbsView from '../src/breadcrumbsView.js';
import { ElementClipboard, type ElementCopyCommand } from 'ckeditor5-elements-clipboard';
import { ElementContextMenu } from 'ckeditor5-elements-context-menu';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('Breadcrumbs', () => {
	let editor: ClassicEditor;
	let plugin: Breadcrumbs;

	const labels = (): string[] => plugin.items.map(item => item.label);

	async function setUp(
		plugins: EditorConfig['plugins'] = [Paragraph, Bold, Container, Breadcrumbs],
		config: EditorConfig = {}
	): Promise<void> {
		editor = await createEditor({ plugins, ...config });
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

	describe('views without the menu config', () => {
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

		it('show a label per item, which cannot be clicked, and follow the changes', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const items = Array.from(view.items);

			expect(view.isClickable).toBe(false);
			expect(items.map(item => item.label)).toEqual(['section.container', 'p']);
			expect(items.every(item => item instanceof BreadcrumbLabelView)).toBe(true);
			expect(items[0]?.element?.tagName).toBe('SPAN');
			expect(items[0]?.element?.classList.contains('ck-elements-breadcrumbs__item')).toBe(true);
			expect(view.element?.querySelector('button')).toBeNull();

			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			expect(Array.from(view.items, item => item.label)).toEqual(['p']);
		});

		it('focus() does nothing', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const active = document.activeElement;

			view.focus();

			expect(document.activeElement).toBe(active);
		});

		it('createView() uses the editor locale by default', () => {
			const another = plugin.createView();

			expect(another.locale).toBe(editor.locale);
			another.destroy();
		});

		it('do not load the context menu plugin', () => {
			expect(editor.plugins.has('ElementContextMenu')).toBe(false);
		});
	});

	describe('views with the menu config', () => {
		let view: BreadcrumbsView;
		let contextMenu: ElementContextMenu;
		let copy: ElementCopyCommand;

		beforeEach(async () => {
			await setUp([Paragraph, Container, Breadcrumbs, ElementContextMenu, ElementClipboard], {
				breadcrumbs: { menu: (element, editor) => [editor.commands.get('copyElement')] },
				elementContextMenu: (element, editor) => [editor.commands.get('cutElement')]
			});

			contextMenu = editor.plugins.get('ElementContextMenu');
			copy = editor.commands.get('copyElement')!;
			view = plugin.createView();
			view.render();
			document.body.append(view.element!);
		});

		afterEach(() => {
			view.element?.remove();
			view.destroy();
		});

		it('show a button per item', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const items = Array.from(view.items);

			expect(view.isClickable).toBe(true);
			expect(items.every(item => item instanceof BreadcrumbItemView && item.withText)).toBe(true);
			expect(items.map(item => item.label)).toEqual(['section.container', 'p']);
		});

		it('focus() focuses the innermost item', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			view.focus();

			expect(document.activeElement).toBe(view.items.last?.element);
		});

		it('open the configured menu (not the context menu) of the clicked element below its button', () => {
			const openSpy = vi.spyOn(contextMenu, 'open');

			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			button.element!.click();

			const container = editor.model.document.getRoot()!.getChild(0) as ModelElement;

			expect(openSpy).toHaveBeenCalledWith(container, button.element, expect.any(Function));

			const [item] = Array.from(contextMenu.view!.items);

			expect(item instanceof ButtonView && item.label).toBe(copy.title);
		});

		it('do nothing for an item whose element is gone', () => {
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

	describe('menu plugin lookup', () => {
		const menu = vi.fn(() => []);

		it('labels are shown when the menu is configured but no menu plugin is loaded', async () => {
			await setUp([Paragraph, Breadcrumbs], { breadcrumbs: { menu } });

			expect(plugin.createView().isClickable).toBe(false);
		});

		it('uses any plugin named ElementContextMenu that has `open()`, passing the configured items', async () => {
			const open = vi.fn(() => true);

			class MenuLike extends Plugin {
				public static get pluginName(): 'ElementContextMenu' {
					return 'ElementContextMenu' as const;
				}

				public open = open;
			}

			await setUp([Paragraph, Breadcrumbs, MenuLike], { breadcrumbs: { menu } });
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');

			const view = plugin.createView();

			view.render();
			expect(view.isClickable).toBe(true);

			view.items.first!.element!.click();

			expect(open).toHaveBeenCalledWith(
				editor.model.document.getRoot()!.getChild(0),
				view.items.first!.element,
				menu
			);
			view.destroy();
		});

		it('ignores a plugin named ElementContextMenu without `open()`', async () => {
			class NotAMenu extends Plugin {
				public static get pluginName(): 'ElementContextMenu' {
					return 'ElementContextMenu' as const;
				}
			}

			await setUp([Paragraph, Breadcrumbs, NotAMenu], { breadcrumbs: { menu } });

			expect(plugin.createView().isClickable).toBe(false);
		});
	});
});
