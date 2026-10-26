import { Essentials, Paragraph, SourceEditing } from 'ckeditor5';
import {
	ElementBreadcrumbs,
	ElementContextMenu,
	ElementSchema,
	ElementSelectable,
	ElementQuickInsert,
	insertIcon
} from 'ckeditor5-elements';
import gallery from './shared/gallery.json';
import type { Demo } from './shared/demo';

const figure = (caption: string): string =>
	`<div class="figure"><div class="photo"></div><div class="caption">${caption}</div></div>`;

export default {
	config: {
		plugins: [
			Essentials,
			SourceEditing,
			Paragraph,
			ElementSchema,
			// Selects the `empty` and `container` elements of the schema as a whole.
			ElementSelectable,
			// Lists what the schema allows at a position, in the context menu.
			ElementQuickInsert,
			ElementContextMenu,
			// Shows the path to the cursor: what holds what.
			ElementBreadcrumbs
		],
		// `-` starts a new toolbar line; it requires `shouldNotGroupWhenFull`.
		toolbar: { items: ['undo', 'redo', 'sourceEditing', '-', 'breadcrumbs'], shouldNotGroupWhenFull: true },
		elementSchema: gallery,
		// The elements are `div` and `span` in the data, and in the editor.
		elementSchemaConverters: true,
		// Right-click an element: Insert › Insert before / after lists what the schema allows there.
		elementContextMenu: (element, editor) => [
			{
				title: 'Insert',
				icon: insertIcon,
				items: [editor.commands.get('quickInsertBefore'), editor.commands.get('quickInsertAfter')]
			}
		],
		elementQuickInsert: {
			labels: { paragraph: 'Paragraph', gallery: 'Gallery', figure: 'Figure', photo: 'Photo', caption: 'Caption' }
		}
	},
	data:
		'<p>A gallery is a block, so it holds inline figures, several in a line. Each figure is a container: a photo, then ' +
		'a caption. Right-click the caption, then Insert › Insert after.</p>' +
		`<div class="gallery">${figure('Morning')}${figure('Noon')}${figure('Evening')}</div>`
} satisfies Demo;
