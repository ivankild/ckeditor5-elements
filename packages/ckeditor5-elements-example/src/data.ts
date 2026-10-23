// An image that needs no network.
const imageSource =
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#4f46e5"/>' +
			'<text x="80" y="52" font-size="16" fill="white" text-anchor="middle" font-family="sans-serif">Image</text></svg>'
	);

/**
 * The data of the full example.
 */
export const exampleData =
	'<h2>CKEditor 5 Elements</h2>' +
	'<p>This editor has all the features of <code>ckeditor5-elements</code>. <strong>Right-click</strong> any block, ' +
	'or press <strong>Shift+F10</strong>, to open its menu: toggle a note, insert, duplicate, move, copy, paste or ' +
	'delete it.</p>' +
	'<aside class="note"><p>This is a note. Put the cursor in it: its floating toolbar acts on the whole note. Move ' +
	'it, duplicate it, delete it, or unwrap it with <strong>Note</strong>.</p></aside>' +
	'<aside class="note warning"><p>This is a warning: a note of the <code>warning</code> type. <strong>Warning</strong> ' +
	'in the toolbar or the menu wraps blocks with one. <strong>Note</strong> is on in it too, as for any note.</p></aside>' +
	'<h3>Breadcrumbs</h3>' +
	'<p>The second toolbar line shows the element path at the cursor, made of the elements of the editor data. Click ' +
	'one to open the menu of its element.</p>' +
	'<ul><li>In a list item, the path is <code>ul › li</code>.</li><li>Duplicating a list item gives a new one.</li></ul>' +
	'<h3>Quick insert</h3>' +
	'<p>Press <strong>Alt+Enter</strong> (Option+Enter on macOS) to insert an element at the cursor: in a paragraph, ' +
	'only a line break fits. To insert blocks, use <strong>Insert › Insert after</strong> in the menu of a block.</p>' +
	'<figure class="table"><table><tbody><tr><td>Copy or cut a whole table from its menu,</td>' +
	'<td>or the paragraph in a cell.</td></tr></tbody></table></figure>' +
	'<h3>Clickable elements</h3>' +
	'<p><strong>Click an image</strong>, the medium, or the linked image to see their attributes in a modal. ' +
	'<strong>Double-click a note</strong> for the attributes of the note.</p>' +
	`<figure class="image"><img src="${imageSource}" alt="An example image" width="160" height="90"></figure>` +
	'<figure class="media"><oembed url="https://example.com/video/1"></oembed></figure>' +
	`<p>A linked image: <a href="https://ckeditor.com"><img src="${imageSource}" alt="A linked image" width="48" height="27"></a></p>` +
	'<blockquote><p>The last block cannot move down.</p></blockquote>';
