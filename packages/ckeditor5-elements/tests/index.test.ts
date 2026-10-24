import { Paragraph } from 'ckeditor5';
import * as actions from 'ckeditor5-elements-actions';
import * as attributes from 'ckeditor5-elements-attributes';
import * as core from 'ckeditor5-elements-core';
import * as interaction from 'ckeditor5-elements-interaction';
import * as menu from 'ckeditor5-elements-menu';
import * as schema from 'ckeditor5-elements-schema';
import * as toolbar from 'ckeditor5-elements-toolbar';
import { describe, expect, it } from 'vitest';
import { createEditor } from '../../../testUtils/editor.js';
import * as elements from '../src/index.js';

describe('ckeditor5-elements', () => {
	it('exports everything from its packages', () => {
		const exported: Record<string, unknown> = { ...elements };

		for (const feature of [core, actions, attributes, schema, interaction, toolbar, menu]) {
			for (const [name, value] of Object.entries(feature)) {
				expect([name, exported[name]]).toEqual([name, value]);
			}
		}
	});

	it('exports nothing else', () => {
		const names = [core, actions, attributes, schema, interaction, toolbar, menu].flatMap(feature =>
			Object.keys(feature)
		);

		expect(Object.keys(elements).sort()).toEqual(names.sort());
	});

	it('runs an editor with all the features', async () => {
		const editor = await createEditor({
			plugins: [
				Paragraph,
				elements.ElementContextMenu,
				elements.ElementClipboard,
				elements.ElementActions,
				elements.ElementAttributes,
				elements.ElementSchema,
				elements.ElementSelectable,
				elements.ElementToolbar,
				elements.ElementClickable,
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
