import { Paragraph } from 'ckeditor5';
import * as breadcrumbs from 'ckeditor5-elements-breadcrumbs';
import * as clipboard from 'ckeditor5-elements-clipboard';
import * as contextMenu from 'ckeditor5-elements-context-menu';
import * as core from 'ckeditor5-elements-core';
import * as quickInsert from 'ckeditor5-elements-quick-insert';
import { describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import * as elements from '../src/index.js';

describe('ckeditor5-elements', () => {
	it('exports everything from its packages', () => {
		const exported: Record<string, unknown> = { ...elements };

		for (const feature of [core, clipboard, contextMenu, quickInsert, breadcrumbs]) {
			for (const [name, value] of Object.entries(feature)) {
				expect([name, exported[name]]).toEqual([name, value]);
			}
		}
	});

	it('exports nothing else', () => {
		const names = [core, clipboard, contextMenu, quickInsert, breadcrumbs].flatMap(feature => Object.keys(feature));

		expect(Object.keys(elements).sort()).toEqual(names.sort());
	});

	it('runs an editor with all the features', async () => {
		const editor = await createEditor({
			plugins: [
				Paragraph,
				elements.ElementContextMenu,
				elements.ElementClipboard,
				elements.QuickInsert,
				elements.Breadcrumbs
			],
			elementContextMenu: (element, editor) => [editor.commands.get('copyElement')],
			breadcrumbs: { menu: (element, editor) => [editor.commands.get('copyElement')] }
		});

		expect(editor.plugins.get('ElementMenu')).toBeInstanceOf(elements.ElementMenu);
		expect(editor.commands.get('quickInsert')).toBeInstanceOf(elements.QuickInsertCommand);

		await editor.destroy();
	});
});
