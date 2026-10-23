import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const resolvePackage = (name: string): string =>
	fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
	resolve: {
		// Test the sources, not the builds. Exact matches only, so subpath exports still resolve normally.
		alias: [
			{ find: /^ckeditor5-elements-core$/, replacement: resolvePackage('ckeditor5-elements-core') },
			{ find: /^ckeditor5-elements$/, replacement: resolvePackage('ckeditor5-elements') },
			{ find: /^ckeditor5-elements-breadcrumbs$/, replacement: resolvePackage('ckeditor5-elements-breadcrumbs') },
			{ find: /^ckeditor5-elements-clipboard$/, replacement: resolvePackage('ckeditor5-elements-clipboard') },
			{ find: /^ckeditor5-elements-actions$/, replacement: resolvePackage('ckeditor5-elements-actions') },
			{ find: /^ckeditor5-elements-toolbar$/, replacement: resolvePackage('ckeditor5-elements-toolbar') },
			{
				find: /^ckeditor5-elements-context-menu$/,
				replacement: resolvePackage('ckeditor5-elements-context-menu')
			},
			{
				find: /^ckeditor5-elements-quick-insert$/,
				replacement: resolvePackage('ckeditor5-elements-quick-insert')
			}
		]
	},
	test: {
		include: ['packages/*/tests/**/*.test.ts'],
		browser: {
			enabled: true,
			headless: true,
			// CKEditor needs a real DOM, so the tests run in Chrome. Uses the installed Google Chrome;
			// set PLAYWRIGHT_CHANNEL=chromium to use a browser installed with `pnpm exec playwright install`.
			provider: playwright({
				launchOptions: { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' }
			}),
			instances: [{ browser: 'chromium' }]
		},
		coverage: {
			provider: 'v8',
			include: ['packages/*/src/**/*.ts'],
			exclude: ['**/augmentation.ts'],
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: 'coverage',
			thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 }
		}
	}
});
