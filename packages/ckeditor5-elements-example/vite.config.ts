import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Use the sources of the packages of the repository, so changes to them show right away. Exact matches only, so
// `ckeditor5-elements/index.css` still resolves to the built stylesheet.
const packagesDir = fileURLToPath(new URL('..', import.meta.url));
const packages = readdirSync(packagesDir).filter(
	name => name !== 'ckeditor5-elements-example' && existsSync(`${packagesDir}/${name}/src/index.ts`)
);

export default defineConfig({
	// Relative URLs, so the build works from any folder.
	base: './',
	resolve: {
		alias: packages.map(name => ({
			find: new RegExp(`^${name}$`),
			replacement: `${packagesDir}/${name}/src/index.ts`
		}))
	},
	build: {
		// CKEditor's styles use CSS nesting, so keep it instead of transforming it for older browsers.
		cssTarget: ['chrome120', 'edge120', 'firefox120', 'safari17'],
		chunkSizeWarningLimit: 3000
	}
});
