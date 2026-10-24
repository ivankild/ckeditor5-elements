import {
	ImageBlock,
	ImageInline,
	LinkImage,
	Link,
	Paragraph,
	Plugin,
	_setModelData,
	type ClassicEditor,
	type ModelElement
} from 'ckeditor5';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, createEditor } from '../../../testUtils/editor.js';
import ElementClickable, { type ElementClickableDefinition } from '../src/elementClickable.js';

describe('ElementClickable', () => {
	let editor: ClassicEditor;

	async function setUp(definitions: ElementClickableDefinition[], data?: string): Promise<void> {
		editor = await createEditor({
			plugins: [Paragraph, Container, ImageBlock, ImageInline, Link, LinkImage, ElementClickable],
			elementClickables: definitions
		});

		// A click on a link would navigate the page of the test.
		editor.ui.getEditableElement()!.addEventListener('click', event => {
			event.preventDefault();
		});

		_setModelData(
			editor.model,
			data ?? '<container><paragraph>fo[]o</paragraph></container><paragraph>bar</paragraph>'
		);
	}

	const editable = (): HTMLElement => editor.ui.getEditableElement()!;
	const child = (...path: number[]): ModelElement =>
		path.reduce<ModelElement>(
			(element, index) => element.getChild(index) as ModelElement,
			editor.model.document.getRoot()!
		);

	function fire(type: 'click' | 'dblclick', target: Element): MouseEvent {
		const event = new MouseEvent(type, { bubbles: true, cancelable: true });

		target.dispatchEvent(event);

		return event;
	}

	afterEach(async () => {
		await editor.destroy();
	});

	it('has a plugin name', async () => {
		await setUp([]);

		expect(ElementClickable.pluginName).toBe('ElementClickable');
	});

	describe('matching', () => {
		it('calls the callback with the element, the editor and the DOM event, for an element matched by name', async () => {
			const callback = vi.fn();

			await setUp([{ element: 'container', callback }]);

			const event = fire('click', editable().querySelector('section p')!);

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(child(0), editor, event);
		});

		it('matches with a filter function', async () => {
			const callback = vi.fn();

			await setUp([
				{ element: element => element.name === 'paragraph' && !element.parent?.is('rootElement'), callback }
			]);

			fire('click', editable().querySelector('section p')!);
			expect(callback).toHaveBeenCalledWith(child(0, 0), editor, expect.any(MouseEvent));

			callback.mockClear();
			fire('click', editable().querySelector(':scope > p')!);
			expect(callback).not.toHaveBeenCalled();
		});

		it('matches the closest element: the innermost one that matches', async () => {
			const container = vi.fn();
			const paragraph = vi.fn();

			await setUp([
				{ element: 'container', callback: container },
				{ element: 'paragraph', callback: paragraph }
			]);
			fire('click', editable().querySelector('section p')!);

			expect(paragraph).toHaveBeenCalledTimes(1);
			expect(container).not.toHaveBeenCalled();
		});

		it('matches an ancestor when the clicked element has no definition, e.g. a click on an image inside its widget', async () => {
			const callback = vi.fn();

			await setUp(
				[{ element: 'imageBlock', callback }],
				'<paragraph>a</paragraph><imageBlock src="x.png"></imageBlock>'
			);
			fire('click', editable().querySelector('img')!);

			expect(callback).toHaveBeenCalledWith(child(1), editor, expect.any(MouseEvent));
		});

		it('uses the first definition in the config when two match', async () => {
			const first = vi.fn();
			const second = vi.fn();

			await setUp([
				{ element: 'container', callback: first },
				{ element: element => element.is('element', 'container'), callback: second }
			]);
			fire('click', editable().querySelector('section')!);

			expect(first).toHaveBeenCalledTimes(1);
			expect(second).not.toHaveBeenCalled();
		});

		it('finds elements by their attributes, e.g. linked images', async () => {
			const callback = vi.fn();

			await setUp(
				[{ element: element => element.hasAttribute('linkHref'), callback }],
				'<paragraph>a</paragraph><imageBlock src="x.png" linkHref="https://example.com"></imageBlock><imageBlock src="y.png"></imageBlock>'
			);
			fire('click', editable().querySelectorAll('img')[1]);
			expect(callback).not.toHaveBeenCalled();

			fire('click', editable().querySelectorAll('img')[0]);
			expect(callback).toHaveBeenCalledWith(child(1), editor, expect.any(MouseEvent));
		});

		it('does nothing for clicks outside of the elements with a definition', async () => {
			const callback = vi.fn();

			await setUp([{ element: 'imageBlock', callback }]);
			fire('click', editable().querySelector(':scope > p')!);
			fire('click', editable());

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('events', () => {
		it('click is the default, and a double click does not call it', async () => {
			const callback = vi.fn();

			await setUp([{ element: 'container', callback }]);
			fire('dblclick', editable().querySelector('section p')!);

			expect(callback).not.toHaveBeenCalled();
		});

		it('a definition for dblclick is called on double click only', async () => {
			const callback = vi.fn();

			await setUp([{ element: 'container', event: 'dblclick', callback }]);
			fire('click', editable().querySelector('section p')!);
			expect(callback).not.toHaveBeenCalled();

			fire('dblclick', editable().querySelector('section p')!);
			expect(callback).toHaveBeenCalledWith(child(0), editor, expect.any(MouseEvent));
		});

		it('a click and a double click of different definitions go to their own definitions', async () => {
			const click = vi.fn();
			const dblclick = vi.fn();

			await setUp([
				{ element: 'container', callback: click },
				{ element: 'paragraph', event: 'dblclick', callback: dblclick }
			]);
			fire('dblclick', editable().querySelector('section p')!);

			expect(dblclick).toHaveBeenCalledWith(child(0, 0), editor, expect.any(MouseEvent));
			expect(click).not.toHaveBeenCalled();
		});

		it('are called once per click, even when other plugins use the click observer', async () => {
			const callback = vi.fn();

			await setUp([{ element: 'container', callback }]);
			fire('click', editable().querySelector('section p')!);

			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	it('works in read-only mode', async () => {
		const callback = vi.fn();

		await setUp([{ element: 'container', callback }]);
		editor.enableReadOnlyMode('test');
		fire('click', editable().querySelector('section p')!);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does nothing when the plugin is disabled', async () => {
		const callback = vi.fn();

		await setUp([{ element: 'container', callback }]);
		editor.plugins.get(ElementClickable).isEnabled = false;
		fire('click', editable().querySelector('section p')!);

		expect(callback).not.toHaveBeenCalled();
	});

	it('does nothing without the config option', async () => {
		editor = await createEditor({ plugins: [Paragraph, ElementClickable] });

		expect(() => fire('click', editable())).not.toThrow();
	});

	it('find() returns the element and the definition for a view element', async () => {
		const definition: ElementClickableDefinition = { element: 'container', callback: vi.fn() };

		await setUp([definition]);

		const viewParagraph = editable().querySelector('section p')!;
		const viewElement = editor.editing.view.domConverter.domToView(viewParagraph);

		expect(viewElement?.is('element') && editor.plugins.get(ElementClickable).find(viewElement)).toEqual({
			element: child(0),
			definition
		});
	});

	it('is called before other plugins, even when one that loads earlier stops the click, and does not stop it itself', async () => {
		const callback = vi.fn();
		const other = vi.fn();

		// As CKEditor's link handling: a plugin that loads before this one, and stops the click it handles with a high priority.
		class StopsClicks extends Plugin {
			public init(): void {
				this.listenTo(
					this.editor.editing.view.document,
					'click',
					evt => {
						evt.stop();
					},
					{ priority: 'high' }
				);
			}
		}

		editor = await createEditor({
			plugins: [Paragraph, Container, StopsClicks, ElementClickable],
			elementClickables: [{ element: 'container', callback }]
		});
		_setModelData(editor.model, '<container><paragraph>fo[]o</paragraph></container>');
		editor.editing.view.document.on('click', other, { priority: 'low' });
		fire('click', editable().querySelector('section p')!);

		expect(callback).toHaveBeenCalledTimes(1);
		// The plugin itself did not stop the click, but the other plugin did, as it would without this one.
		expect(other).not.toHaveBeenCalled();
	});
});
