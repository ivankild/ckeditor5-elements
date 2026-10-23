import {
	Bold,
	ImageBlock,
	ImageInline,
	Italic,
	Link,
	LinkImage,
	List,
	Locale,
	Paragraph,
	Plugin,
	Table,
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
import { ElementMenu, type ElementMenuView } from 'ckeditor5-elements-core';
import { describeItems } from '../../../testUtils/menu.js';
import { Container, createEditor } from '../../../testUtils/editor.js';

describe('Breadcrumbs', () => {
	let editor: ClassicEditor;
	let plugin: Breadcrumbs;

	const labels = (): string[] => plugin.items.map(item => item.label);
	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	/**
	 * Presses a key in the focused element, as the browser does: the event bubbles, e.g. to the toolbar.
	 */
	function pressKey(key: 'ArrowLeft' | 'ArrowRight'): void {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

		// CKEditor reads the key code.
		Object.defineProperty(event, 'keyCode', { value: key === 'ArrowLeft' ? 37 : 39 });
		document.activeElement!.dispatchEvent(event);
	}

	const focusedText = (): string => document.activeElement?.textContent.trim() ?? '';

	/**
	 * Presses Esc in the open menu.
	 */
	function pressEsc(): void {
		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

		Object.defineProperty(event, 'keyCode', { value: 27 });
		document.activeElement!.dispatchEvent(event);
	}

	/**
	 * Sets the data while converting the data view seems slow (every `performance.now()` call is 20 ms later), so the
	 * next conversion waits.
	 */
	function setDataSlowly(data: string): void {
		let now = 0;
		const spy = vi.spyOn(performance, 'now').mockImplementation(() => (now += 20));

		_setModelData(editor.model, data);
		spy.mockRestore();
	}

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

		it('lists the data view elements at the selection, outermost first', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			expect(labels()).toEqual(['section.container', 'p']);
			expect(plugin.items[1]?.viewElement.name).toBe('p');
			expect(plugin.items.map(item => item.modelElement)).toEqual([child(0), child(0, 0)]);
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

	describe('data view', () => {
		beforeEach(async () => {
			await setUp(
				[Paragraph, Bold, Link, LinkImage, List, Table, ImageBlock, ImageInline, Container, Breadcrumbs],
				{
					placeholder: 'Type here'
				}
			);
		});

		it('has no classes of the editing view, e.g. of a placeholder or a widget', () => {
			_setModelData(editor.model, '<paragraph>[]</paragraph>');
			expect(labels()).toEqual(['p']);

			_setModelData(editor.model, '[<imageBlock src="x.png"></imageBlock>]');
			expect(labels()).toEqual(['figure.image']);
		});

		it('lists list items, without the paragraph of a list item that has only one', () => {
			_setModelData(
				editor.model,
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">fo[]o</paragraph>'
			);
			expect(labels()).toEqual(['ul', 'li']);

			_setModelData(
				editor.model,
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">foo</paragraph>' +
					'<paragraph listIndent="0" listItemId="a" listType="bulleted">b[]ar</paragraph>'
			);
			expect(labels()).toEqual(['ul', 'li', 'p']);

			_setModelData(
				editor.model,
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">foo</paragraph>' +
					'<paragraph listIndent="1" listItemId="b" listType="numbered">b[]ar</paragraph>'
			);
			expect(labels()).toEqual(['ul', 'li', 'ol', 'li']);
		});

		it('lists the structure of a table', () => {
			_setModelData(
				editor.model,
				'<table headingRows="1"><tableRow><tableCell><paragraph>a</paragraph></tableCell></tableRow>' +
					'<tableRow><tableCell><paragraph>b[]</paragraph></tableCell></tableRow></table>'
			);
			expect(labels()).toEqual(['figure.table', 'table', 'tbody', 'tr', 'td']);

			_setModelData(
				editor.model,
				'<table headingRows="1"><tableRow><tableCell><paragraph>a[]</paragraph></tableCell></tableRow></table>'
			);
			expect(labels()).toEqual(['figure.table', 'table', 'thead', 'tr', 'th']);
		});

		it('ends with the selected element', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>foo[<imageInline src="x.png"></imageInline>]</paragraph></container>'
			);
			expect(labels()).toEqual(['section.container', 'p', 'img']);

			_setModelData(
				editor.model,
				'<paragraph><$text linkHref="x">foo</$text>[<imageInline linkHref="x" src="x.png"></imageInline>]</paragraph>'
			);
			expect(labels()).toEqual(['p', 'img']);
		});

		it('gives each item the model element of its view element, the table for the parts of a table, none for list items', () => {
			_setModelData(
				editor.model,
				'<table><tableRow><tableCell><paragraph listIndent="0" listItemId="a" listType="bulleted">a[]</paragraph></tableCell></tableRow></table>'
			);

			expect(labels()).toEqual(['figure.table', 'table', 'tbody', 'tr', 'td', 'ul', 'li']);
			expect(plugin.items.map(item => item.modelElement)).toEqual([
				child(0),
				child(0),
				child(0),
				child(0, 0),
				child(0, 0, 0),
				null,
				null
			]);
		});

		it('is not converted again when typing or moving the selection', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph><paragraph>bar</paragraph>');
			const toView = vi.spyOn(editor.data, 'toView');

			editor.model.change(writer => {
				writer.insertText('x', editor.model.document.selection.getFirstPosition()!);
				writer.setAttribute('bold', true, writer.createRangeIn(child(0)));
			});
			editor.model.change(writer => {
				writer.setSelection(child(1), 0);
			});

			expect(toView).not.toHaveBeenCalled();
			expect(labels()).toEqual(['p']);
		});

		it('is converted again when elements change', () => {
			_setModelData(editor.model, '<paragraph>fo[]o</paragraph>');
			const toView = vi.spyOn(editor.data, 'toView');

			editor.model.change(writer => {
				writer.wrap(writer.createRangeOn(child(0)), 'container');
			});

			expect(toView).toHaveBeenCalledTimes(1);
			expect(labels()).toEqual(['section.container', 'p']);
		});

		it('is converted at most every 250 ms when converting is slow, using the outdated one meanwhile', async () => {
			setDataSlowly('<paragraph>fo[]o</paragraph>');

			const toView = vi.spyOn(editor.data, 'toView');

			editor.model.change(writer => {
				writer.wrap(writer.createRangeOn(child(0)), 'container');
			});
			editor.model.change(writer => {
				writer.insertElement('paragraph', child(0), 'end');
			});

			// The new elements are not mapped yet: the closest mapped ancestor is used.
			expect(toView).not.toHaveBeenCalled();
			expect(labels()).toEqual(['p']);

			await new Promise(resolve => setTimeout(resolve, 300));

			expect(toView).toHaveBeenCalledTimes(1);
			expect(labels()).toEqual(['section.container', 'p']);
		});

		it('refresh() converts right away', () => {
			setDataSlowly('<paragraph>fo[]o</paragraph>');

			editor.model.change(writer => {
				writer.wrap(writer.createRangeOn(child(0)), 'container');
			});
			plugin.refresh();

			expect(labels()).toEqual(['section.container', 'p']);
		});

		it('stops a pending conversion when destroyed', async () => {
			setDataSlowly('<paragraph>fo[]o</paragraph>');

			editor.model.change(writer => {
				writer.wrap(writer.createRangeOn(child(0)), 'container');
			});

			const toView = vi.spyOn(editor.data, 'toView');

			plugin.destroy();
			await new Promise(resolve => setTimeout(resolve, 300));

			expect(toView).not.toHaveBeenCalled();
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

		it('focus() focuses a label, which is not in the Tab order', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			view.focus();
			expect(document.activeElement).toBe(view.items.last?.element);
			expect(view.items.last?.element?.getAttribute('tabindex')).toBe('-1');

			view.focus(1);
			expect(document.activeElement).toBe(view.items.first?.element);
		});

		it('move the focus between the labels with the arrow keys', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			view.focus(1);
			pressKey('ArrowRight');
			expect(focusedText()).toBe('p');

			pressKey('ArrowLeft');
			expect(focusedText()).toBe('section.container');
		});

		it('createView() uses the editor locale by default', () => {
			const another = plugin.createView();

			expect(another.locale).toBe(editor.locale);
			another.destroy();
		});

		it('do not load ElementMenu', () => {
			expect(editor.plugins.has('ElementMenu')).toBe(false);
		});

		it('are an ordered list, with the innermost item marked as the current location', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const list = view.element!.querySelector('ol')!;
			const listItems = Array.from(list.children);

			expect(listItems.map(listItem => listItem.tagName)).toEqual(['LI', 'LI']);
			expect(listItems.map(listItem => listItem.firstElementChild)).toEqual(
				Array.from(view.items, item => item.element)
			);
			expect(Array.from(view.items, item => item.element?.getAttribute('aria-current'))).toEqual([
				null,
				'location'
			]);
		});
	});

	describe('views with the menu config', () => {
		let view: BreadcrumbsView;
		let menu: ElementMenu;
		let copy: ElementCopyCommand;

		beforeEach(async () => {
			await setUp([Paragraph, List, Container, Breadcrumbs, ElementMenu, ElementClipboard], {
				breadcrumbs: { menu: (element, editor) => [editor.commands.get('copyElement')] }
			});

			menu = editor.plugins.get('ElementMenu');
			copy = editor.commands.get('copyElement')!;
			view = plugin.createView();
			view.render();
			document.body.append(view.element!);
		});

		afterEach(() => {
			view.element?.remove();
			view.destroy();
		});

		it('show a button per item, in a list, with the innermost one marked as the current location', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const items = Array.from(view.items);

			expect(view.isClickable).toBe(true);
			expect(items.every(item => item instanceof BreadcrumbItemView && item.withText)).toBe(true);
			expect(items.map(item => item.label)).toEqual(['section.container', 'p']);
			expect(items.map(item => item.element?.parentElement?.tagName)).toEqual(['LI', 'LI']);
			expect(items.map(item => item.element?.getAttribute('aria-current'))).toEqual([null, 'location']);
		});

		it('focus() focuses the innermost item, or the first one when the focus moves forward', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			view.focus();
			expect(document.activeElement).toBe(view.items.last?.element);

			view.focus(-1);
			expect(document.activeElement).toBe(view.items.last?.element);

			view.focus(1);
			expect(document.activeElement).toBe(view.items.first?.element);
		});

		it('show list items as labels, as they have no model element', () => {
			_setModelData(
				editor.model,
				'<container><paragraph listIndent="0" listItemId="a" listType="bulleted">fo[]o</paragraph></container>'
			);

			expect(Array.from(view.items, item => [item.label, item instanceof BreadcrumbItemView])).toEqual([
				['section.container', true],
				['ul', false],
				['li', false]
			]);
		});

		it('tell assistive technology that they open a menu, and whether it is open', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			expect(button.element?.getAttribute('aria-haspopup')).toBe('menu');
			expect(button.element?.getAttribute('aria-expanded')).toBe('false');

			button.element!.click();
			expect(button.element?.getAttribute('aria-expanded')).toBe('true');

			menu.hide();
			expect(button.element?.getAttribute('aria-expanded')).toBe('false');
		});

		it('get the focus back when the menu is closed with Esc', () => {
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			button.element!.click();
			expect(document.activeElement).not.toBe(button.element);

			pressEsc();
			expect(document.activeElement).toBe(button.element);
		});

		it('focus the editor when the menu is closed with Esc after the breadcrumbs were replaced', () => {
			_setModelData(
				editor.model,
				'<container><paragraph>fo[]o</paragraph><paragraph>bar</paragraph></container>'
			);
			const focusSpy = vi.spyOn(editor.editing.view, 'focus');
			const button = view.items.first!;

			button.element!.click();

			// The selection moves to the other paragraph, so the breadcrumbs are replaced; the menu stays open.
			editor.model.change(writer => {
				writer.setSelection(child(0, 1), 0);
			});
			expect(button.element?.isConnected).toBe(false);

			pressEsc();

			expect(focusSpy).toHaveBeenCalled();
		});

		it('open the configured menu of the clicked element below its button', () => {
			const openSpy = vi.spyOn(menu, 'open');

			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
			const button = view.items.first!;

			button.element!.click();

			const container = editor.model.document.getRoot()!.getChild(0) as ModelElement;

			expect(openSpy).toHaveBeenCalledWith(container, button.element, expect.any(Function), expect.any(Object));
			expect(typeof openSpy.mock.calls[0]?.[3]?.returnFocusTo?.focus).toBe('function');
			expect(typeof openSpy.mock.calls[0]?.[3]?.onHide).toBe('function');

			expect(describeItems(menu.view as ElementMenuView)).toEqual([copy.title]);
		});

		it('do nothing for an item whose element is gone', () => {
			const openSpy = vi.spyOn(menu, 'open');

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

		it('uses any plugin named ElementMenu that has `open()`, passing the configured items', async () => {
			const open = vi.fn(() => true);

			class MenuLike extends Plugin {
				public static get pluginName(): 'ElementMenu' {
					return 'ElementMenu' as const;
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
				menu,
				expect.any(Object)
			);
			view.destroy();
		});

		it('ignores a plugin named ElementMenu without `open()`', async () => {
			class NotAMenu extends Plugin {
				public static get pluginName(): 'ElementMenu' {
					return 'ElementMenu' as const;
				}
			}

			await setUp([Paragraph, Breadcrumbs, NotAMenu], { breadcrumbs: { menu } });

			expect(plugin.createView().isClickable).toBe(false);
		});
	});

	describe('in a toolbar', () => {
		it('labels: the arrow keys move through them, and on to the next toolbar item', async () => {
			await setUp([Paragraph, Bold, Italic, Container, Breadcrumbs], {
				toolbar: ['bold', 'breadcrumbs', 'italic']
			});
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			editor.ui.view.toolbar.focus();
			const seen = [focusedText()];

			for (let i = 0; i < 4; i++) {
				pressKey('ArrowRight');
				seen.push(focusedText());
			}

			expect(seen).toEqual(['Bold', 'section.container', 'p', 'Italic', 'Bold']);
		});

		it('buttons: the arrow keys move through them, in both directions', async () => {
			await setUp([Paragraph, Bold, Italic, Container, Breadcrumbs, ElementMenu, ElementClipboard], {
				toolbar: ['bold', 'breadcrumbs', 'italic'],
				breadcrumbs: { menu: (element, editor) => [editor.commands.get('copyElement')] }
			});
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			editor.ui.view.toolbar.focus();
			const seen = [focusedText()];

			for (const key of [
				'ArrowRight',
				'ArrowRight',
				'ArrowRight',
				'ArrowLeft',
				'ArrowLeft',
				'ArrowLeft'
			] as const) {
				pressKey(key);
				seen.push(focusedText());
			}

			expect(seen).toEqual(['Bold', 'section.container', 'p', 'Italic', 'p', 'section.container', 'Bold']);
		});
	});

	describe('right-to-left', () => {
		it('swaps the arrow keys', async () => {
			await setUp();
			_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');

			const view = new BreadcrumbsView(new Locale({ uiLanguage: 'ar' }));

			view.render();
			document.body.append(view.element!);
			view.setItems(plugin.items);

			view.focus(1);
			pressKey('ArrowLeft');
			expect(focusedText()).toBe('p');

			pressKey('ArrowRight');
			expect(focusedText()).toBe('section.container');

			view.element!.remove();
			view.destroy();
		});
	});
});
