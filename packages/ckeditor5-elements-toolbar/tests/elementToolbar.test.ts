import {
	Bold,
	ButtonView,
	ContextualBalloon,
	Paragraph,
	ToolbarSeparatorView,
	ToolbarView,
	_getModelData,
	_setModelData,
	type ClassicEditor,
	type EditorConfig,
	type ModelElement
} from 'ckeditor5';
import { ElementActions } from 'ckeditor5-elements-actions';
import { ElementContextMenu } from 'ckeditor5-elements-menu';
import { afterEach, describe, expect, it } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementToolbar from '../src/elementToolbar.js';

describe('ElementToolbar', () => {
	let editor: ClassicEditor;
	let balloon: ContextualBalloon;

	const ACTIONS = ['moveElementUp', 'moveElementDown', '|', 'duplicateElement', 'deleteElement'];

	async function setUp(elementToolbar?: EditorConfig['elementToolbar']): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Bold, Container, ElementActions, ElementToolbar],
			toolbar: ['bold'],
			...(elementToolbar ? { elementToolbar } : {})
		});
		balloon = editor.plugins.get(ContextualBalloon);

		// The toolbars show while the editor is focused.
		editor.editing.view.focus();
	}

	function setData(data: string): void {
		_setModelData(editor.model, data);
		editor.ui.update();
	}

	const toolbar = (): ToolbarView | null => (balloon.visibleView instanceof ToolbarView ? balloon.visibleView : null);
	const items = (): string[] =>
		Array.from(toolbar()?.items ?? [], item =>
			item instanceof ToolbarSeparatorView ? '|' : item instanceof ButtonView ? (item.label ?? '') : '?'
		);
	const button = (label: string): ButtonView =>
		Array.from(toolbar()!.items).find(
			(item): item is ButtonView => item instanceof ButtonView && item.label === label
		)!;
	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	afterEach(async () => {
		await editor.destroy();
	});

	it('shows nothing without the config option', async () => {
		await setUp();
		setData('<container><paragraph>a[]</paragraph></container>');

		expect(ElementToolbar.pluginName).toBe('ElementToolbar');
		expect(balloon.visibleView).toBeNull();
	});

	describe('showing', () => {
		it('shows the toolbar of the element with the selection, matched by name', async () => {
			await setUp([{ element: 'container', items: ACTIONS }]);
			setData('<paragraph>a</paragraph><container><paragraph>b[]</paragraph></container>');

			expect(items()).toEqual(['Move up', 'Move down', '|', 'Duplicate', 'Delete']);
			expect(toolbar()?.ariaLabel).toBe('Element toolbar');
		});

		it('hides the toolbar when the selection leaves the element', async () => {
			await setUp([{ element: 'container', items: ACTIONS }]);
			setData('<paragraph>a</paragraph><container><paragraph>b[]</paragraph></container>');

			editor.model.change(writer => {
				writer.setSelection(child(0), 0);
			});
			editor.ui.update();

			expect(toolbar()).toBeNull();
		});

		it('matches elements with a filter function', async () => {
			await setUp([{ element: element => element.getAttribute('type') === 'warning', items: ACTIONS }]);

			setData('<container type="info"><paragraph>a[]</paragraph></container>');
			expect(toolbar()).toBeNull();

			setData('<container type="warning"><paragraph>a[]</paragraph></container>');
			expect(items()).toHaveLength(5);
		});

		it('shows the toolbar of the innermost element when toolbars match nested elements', async () => {
			await setUp([
				{ element: 'container', items: ['deleteElement'], ariaLabel: 'Container toolbar' },
				{ element: 'paragraph', items: ['duplicateElement'], ariaLabel: 'Paragraph toolbar' }
			]);
			setData('<container><paragraph>a[]</paragraph></container>');

			expect(toolbar()?.ariaLabel).toBe('Paragraph toolbar');
			expect(items()).toEqual(['Duplicate']);
		});

		it('shows UI components as in the main toolbar', async () => {
			await setUp([{ element: 'paragraph', items: ['bold', '|', 'deleteElement'] }]);
			setData('<paragraph>a[]</paragraph>');

			expect(items()).toEqual(['Bold', '|', 'Delete']);
		});

		it('supports groups of items', async () => {
			await setUp([
				{ element: 'paragraph', items: [{ label: 'More', items: ['duplicateElement', 'deleteElement'] }] }
			]);
			setData('<paragraph>a[]</paragraph>');

			expect(Array.from(toolbar()!.items)).toHaveLength(1);
		});
	});

	describe('command buttons', () => {
		it('act on the element of the toolbar, not on the element with the selection', async () => {
			await setUp([{ element: 'container', items: ACTIONS }]);
			setData(
				'<container><paragraph>a[]</paragraph><paragraph>b</paragraph></container><paragraph>c</paragraph>'
			);

			button('Move down').fire('execute');

			expect(_getModelData(editor.model)).toBe(
				'<paragraph>c</paragraph><container><paragraph>a[]</paragraph><paragraph>b</paragraph></container>'
			);
		});

		it('follow the state of the command for the element of the toolbar', async () => {
			await setUp([{ element: 'container', items: ACTIONS }]);
			setData(
				'<container><paragraph>a</paragraph><paragraph>b[]</paragraph></container><paragraph>c</paragraph>'
			);

			// The paragraph with the selection could move up; the container cannot.
			expect(button('Move up').isEnabled).toBe(false);
			expect(button('Move down').isEnabled).toBe(true);

			button('Move down').fire('execute');
			editor.ui.update();

			expect(button('Move up').isEnabled).toBe(true);
			expect(button('Move down').isEnabled).toBe(false);
		});
	});

	describe('getElement()', () => {
		it('returns the closest element at the selection that matches, or null', async () => {
			await setUp();
			setData('<container><container type="inner"><paragraph>a[]</paragraph></container></container>');

			const plugin = editor.plugins.get(ElementToolbar);

			expect(plugin.getElement('container')).toBe(child(0, 0));
			expect(
				plugin.getElement(element => element.is('element', 'container') && !element.hasAttribute('type'))
			).toBe(child(0));
			expect(plugin.getElement('paragraph')).toBe(child(0, 0, 0));
			expect(plugin.getElement('missing')).toBeNull();
		});

		it('returns the selected element', async () => {
			await setUp();
			editor.model.schema.register('box', { inheritAllFrom: '$blockObject' });
			editor.conversion.elementToElement({ model: 'box', view: { name: 'div', classes: 'box' } });
			setData('<paragraph>a</paragraph>[<box></box>]');

			expect(editor.plugins.get(ElementToolbar).getElement('box')).toBe(child(1));
		});
	});

	describe('with the element menus', () => {
		it('a menu covers the toolbar, and the toolbar shows again when the menu closes', async () => {
			editor = await createEditor({
				plugins: [Paragraph, Container, ElementActions, ElementToolbar, ElementContextMenu],
				elementToolbar: [{ element: 'container', items: ['deleteElement'] }]
			});
			balloon = editor.plugins.get(ContextualBalloon);
			editor.editing.view.focus();

			const menu = editor.plugins.get('ElementMenu');
			const openMenu = (): void => {
				menu.open(child(1), new DOMRect(), (element, editor) => [editor.commands.get('duplicateElement')]);
			};

			setData('<container><paragraph>a[]</paragraph></container><paragraph>b</paragraph>');
			openMenu();
			editor.ui.update();
			expect(balloon.visibleView).toBe(menu.view);

			menu.hide();
			editor.ui.update();
			expect(toolbar()).not.toBeNull();
		});

		it('a toolbar that shows while a menu is open does not cover the menu', async () => {
			editor = await createEditor({
				plugins: [Paragraph, Container, ElementActions, ElementToolbar, ElementContextMenu],
				elementToolbar: [{ element: 'container', items: ['deleteElement'] }]
			});
			balloon = editor.plugins.get(ContextualBalloon);
			editor.editing.view.focus();

			const menu = editor.plugins.get('ElementMenu');

			setData('<container><paragraph>a</paragraph></container><paragraph>b[]</paragraph>');
			menu.open(child(1), new DOMRect(), (element, editor) => [editor.commands.get('duplicateElement')]);

			// The selection moves into the container, e.g. by a change of another user.
			editor.model.change(writer => {
				writer.setSelection(child(0, 0), 0);
			});
			editor.ui.update();
			expect(balloon.visibleView).toBe(menu.view);

			menu.hide();
			editor.ui.update();
			expect(toolbar()).not.toBeNull();
		});
	});
});
