import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { packageNames, readPackage, sourceAliases } from './scripts/packages.js';

/**
 * The coverage that the tests must reach: in all, and in each published package on its own, so that a package is not
 * covered by the others.
 */
const THRESHOLDS = { statements: 95, branches: 90, functions: 95, lines: 95 };
const packageThresholds = Object.fromEntries(
	packageNames.filter(name => readPackage(name).private !== true).map(name => [`packages/${name}/src/**`, THRESHOLDS])
);

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
			// The typings, and the pages of the examples, which the smoke test and the docs open.
			exclude: ['**/augmentation.ts', 'packages/*-example/src/main.ts'],
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: 'coverage',
			thresholds: { ...THRESHOLDS, ...packageThresholds }
		}
	}
});
