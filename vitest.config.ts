import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { sourceAliases } from './scripts/packages.js';

export default defineConfig({
	// Test the sources, not the builds.
	resolve: { alias: sourceAliases() },
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
