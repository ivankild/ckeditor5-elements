import { Essentials, ImageBlock, ImageCaption, Link, LinkImage, Paragraph } from 'ckeditor5';
import { ElementAttributes, ElementClickable, type ElementClickableDefinition } from 'ckeditor5-elements';
import { Note } from 'ckeditor5-elements-example';
import type { Demo } from './shared/demo';

// An image that needs no network.
const image =
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#4f46e5"/></svg>'
	);

// The callback runs the command of `ElementAttributes` for the element that was clicked.
const showAttributes: ElementClickableDefinition['callback'] = (element, editor) => {
	editor.commands.get('showElementAttributes')?.executeFor(element);
};

export default {
	config: {
		plugins: [
			Essentials,
			Paragraph,
			Link,
			ImageBlock,
			ImageCaption,
			LinkImage,
			ElementAttributes,
			Note,
			ElementClickable
		],
		toolbar: ['undo', 'redo', '|', 'link', 'note'],
		elementClickables: [
			// By a filter function: images, and anything with a link (a linked image). Called on click.
			{
				element: element => element.name === 'imageBlock' || element.hasAttribute('linkHref'),
				callback: showAttributes
			},
			// By name, on double click.
			{ element: 'note', event: 'dblclick', callback: showAttributes }
		]
	},
	data:
		'<p><strong>Click an image</strong>: a modal with its attributes. <strong>Double-click the note</strong> for the ' +
		'attributes of the note.</p>' +
		`<figure class="image"><img src="${image}" alt="A plain image"></figure>` +
		`<figure class="image"><a href="https://ckeditor.com"><img src="${image}" alt="A linked image"></a></figure>` +
		'<aside class="note"><p>Double-click this note.</p></aside>'
} satisfies Demo;
