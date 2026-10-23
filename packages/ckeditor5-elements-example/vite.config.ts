import { defineConfig } from 'vite';
import { sourceAliases } from '../../scripts/packages.js';

export default defineConfig({
	// Relative URLs, so the build works from any folder.
	base: './',
	// Use the sources of the packages of the repository, so changes to them show right away.
	resolve: { alias: sourceAliases() },
	build: {
		// CKEditor's styles use CSS nesting, so keep it instead of transforming it for older browsers.
		cssTarget: ['chrome120', 'edge120', 'firefox120', 'safari17'],
		chunkSizeWarningLimit: 3000
	}
});
