import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const resolvePackage = (name: string): string =>
	fileURLToPath(new URL(`../packages/${name}/src/index.ts`, import.meta.url));

// Points the packages' main entries at their sources, so changes show up without building them first.
// Exact matches only, so subpath exports such as `ckeditor5-elements-ui/breadcrumbs.css` still resolve normally.
export default defineConfig({
	resolve: {
		alias: [
			{ find: /^ckeditor5-elements-ui$/, replacement: resolvePackage('ckeditor5-elements-ui') },
			{ find: /^ckeditor5-elements$/, replacement: resolvePackage('ckeditor5-elements') },
			{ find: /^ckeditor5-elements-breadcrumbs$/, replacement: resolvePackage('ckeditor5-elements-breadcrumbs') },
			{ find: /^ckeditor5-elements-clipboard$/, replacement: resolvePackage('ckeditor5-elements-clipboard') },
			{
				find: /^ckeditor5-elements-context-menu$/,
				replacement: resolvePackage('ckeditor5-elements-context-menu')
			},
			{
				find: /^ckeditor5-elements-quick-insert$/,
				replacement: resolvePackage('ckeditor5-elements-quick-insert')
			}
		]
	}
});
