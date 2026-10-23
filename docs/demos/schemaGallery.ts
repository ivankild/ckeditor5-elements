import gallery from './shared/gallery.json';
import { schemaDemo } from './shared/schemaDemo';

const figure = (caption: string): string =>
	`<div class="figure"><div class="photo"></div><div class="caption">${caption}</div></div>`;

export default schemaDemo(gallery, {
	labels: { gallery: 'Gallery', figure: 'Figure', photo: 'Photo', caption: 'Caption' },
	data:
		'<p>A gallery is a block, so it holds inline figures, several in a line. Each figure is a container: a photo, then ' +
		'a caption. Right-click the caption, then <b>Insert › Insert after</b>.</p>' +
		`<div class="gallery">${figure('Morning')}${figure('Noon')}${figure('Evening')}</div>`
});
