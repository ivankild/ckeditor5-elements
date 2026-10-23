import { Bold, Essentials, Paragraph } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	QuickInsert,
	insertIcon,
	type ElementSchemaInput
} from 'ckeditor5-elements';
import type { Demo } from './demo';

/**
 * An editor for an element schema: the schema as it is, with the converters of the plugin, and quick insert in the context
 * menu (Insert › Insert before / after), which lists what the schema allows at a position, and breadcrumbs that show
 * the path to the cursor.
 */
export function schemaDemo(
	schema: ElementSchemaInput,
	{ data, labels, exclude = [] }: { data: string; labels: Record<string, string>; exclude?: string[] }
): Demo {
	return {
		config: {
			plugins: [
				Essentials,
				Paragraph,
				Bold,
				ElementSchema,
				ElementSelectable,
				QuickInsert,
				ElementContextMenu,
				Breadcrumbs
			],
			// `-` starts a new toolbar line; it requires `shouldNotGroupWhenFull`.
			toolbar: { items: ['undo', 'redo', '|', 'bold', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true },
			elementSchema: schema,
			// The elements are `div` and `span` in the data, and in the editor: the schema only.
			elementSchemaConverters: true,
			elementContextMenu: (element, editor) => [
				{
					title: 'Insert',
					icon: insertIcon,
					items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
				}
			],
			quickInsert: { exclude, labels: { paragraph: 'Paragraph', ...labels } }
		},
		data
	};
}
