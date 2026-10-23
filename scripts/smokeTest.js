// Installs the packed packages into a new app, as a user would, and checks that it works: the app type-checks, builds
// with Vite, and runs in Chrome with all the features. This catches what the tests of the sources cannot: a missing
// file in a package, a wrong `exports` map, types that do not compile, two copies of a package.
//
// Set CKEDITOR_VERSION to try another version of `ckeditor5` (default: the one the repository uses).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(join(root, 'package.json'));
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: 'inherit' });

const rootPackage = readJson(join(root, 'package.json'));
const ckeditorVersion = process.env.CKEDITOR_VERSION ?? readJson(require.resolve('ckeditor5/package.json')).version;
const packages = readdirSync(join(root, 'packages'))
	.map(name => ({ name, ...readJson(join(root, 'packages', name, 'package.json')) }))
	.filter(pkg => !pkg.private);

const dir = mkdtempSync(join(tmpdir(), 'ckeditor5-elements-smoke-'));
const tarballs = join(dir, 'tarballs');
const app = join(dir, 'app');

mkdirSync(tarballs);
mkdirSync(join(app, 'src'), { recursive: true });

try {
	console.log(`Packing ${packages.length} packages; ckeditor5@${ckeditorVersion}; in ${dir}`);
	run('pnpm', ['run', 'build'], root);

	for (const pkg of packages) {
		run('pnpm', ['pack', '--pack-destination', tarballs], join(root, 'packages', pkg.name));
	}

	const tarball = pkg => join(tarballs, `${pkg.name}-${pkg.version}.tgz`);
	const umbrella = packages.find(pkg => pkg.name === 'ckeditor5-elements');

	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'smoke-test',
			private: true,
			type: 'module',
			dependencies: { ckeditor5: ckeditorVersion, 'ckeditor5-elements': `file:${tarball(umbrella)}` },
			devDependencies: {
				typescript: rootPackage.devDependencies.typescript,
				vite: rootPackage.devDependencies.vite
			}
		})
	);

	// The umbrella depends on the other packages by version, which are not on npm yet: use the tarballs.
	const overrides = packages
		.filter(pkg => pkg !== umbrella)
		.map(pkg => `    ${pkg.name}: file:${tarball(pkg)}`)
		.join('\n');

	writeFileSync(join(app, 'pnpm-workspace.yaml'), `overrides:\n${overrides}\nallowBuilds:\n    esbuild: false\n`);
	writeFileSync(
		join(app, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				target: 'ES2022',
				module: 'ESNext',
				moduleResolution: 'Bundler',
				lib: ['ES2022', 'DOM', 'DOM.Iterable'],
				strict: true,
				noEmit: true,
				// The types of the packages are checked too.
				skipLibCheck: false,
				types: ['vite/client']
			},
			include: ['src']
		})
	);
	writeFileSync(
		join(app, 'index.html'),
		'<div id="editor"><p>Hello <strong>world</strong>.</p></div><script type="module" src="/src/main.ts"></script>\n'
	);
	writeFileSync(
		join(app, 'src/main.ts'),
		`import { ClassicEditor, Essentials, Paragraph, Bold } from 'ckeditor5';
import {
	Breadcrumbs,
	ElementActions,
	ElementClickable,
	ElementClipboard,
	ElementContextMenu,
	ElementToolbar,
	QuickInsert,
	type ElementMenuConfig
} from 'ckeditor5-elements';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-elements/index.css';

// The config options of the features are typed through the umbrella package.
const menu: ElementMenuConfig = (element, editor) => [
	editor.commands.get('duplicateElement'),
	'|',
	editor.commands.get('copyElement'),
	editor.commands.get('deleteElement')
];

const editor = await ClassicEditor.create({
	attachTo: document.querySelector<HTMLElement>('#editor')!,
	licenseKey: 'GPL',
	plugins: [
		Essentials,
		Paragraph,
		Bold,
		ElementContextMenu,
		ElementClipboard,
		ElementActions,
		ElementToolbar,
		ElementClickable,
		QuickInsert,
		Breadcrumbs
	],
	toolbar: ['bold', '|', 'breadcrumbs'],
	elementContextMenu: menu,
	breadcrumbs: { menu },
	elementToolbars: [{ element: 'paragraph', items: ['moveElementDown', 'deleteElement'] }],
	elementClickables: [{ element: 'paragraph', callback: element => { (window as unknown as { clicked: string }).clicked = element.name; } }],
	quickInsert: { keystroke: 'Alt+Enter' }
});

Object.assign(window, { editor });
`
	);

	run('pnpm', ['install', '--prefer-offline'], app);
	run('pnpm', ['exec', 'tsc', '-p', '.'], app);
	run('pnpm', ['exec', 'vite', 'build'], app);

	// The validation of the schema works in Node.js, without a DOM.
	run(
		'node',
		[
			'--input-type=module',
			'-e',
			`import { validateElementSchema } from 'ckeditor5-elements/validate-schema';
const issues = validateElementSchema({ a: { type: 'blok' } });
if (issues.length !== 1 || issues[0].path !== 'a.type') throw new Error('Unexpected issues: ' + JSON.stringify(issues));`
		],
		app
	);

	await runInBrowser(join(app, 'dist'));
	console.log('The smoke test passed.');
} finally {
	rmSync(dir, { recursive: true, force: true });
}

/**
 * Serves the built app, opens it in Chrome, and checks the features.
 */
async function runInBrowser(distDir) {
	const { chromium } = require('playwright');
	const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
	const server = createServer((request, response) => {
		const path = request.url === '/' ? '/index.html' : (request.url ?? '').split('?')[0];

		try {
			response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
			response.end(readFileSync(join(distDir, path)));
		} catch {
			response.statusCode = 404;
			response.end();
		}
	});

	await new Promise(resolve => server.listen(0, resolve));

	const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' });

	try {
		const page = await browser.newPage();
		const errors = [];

		page.on('pageerror', error => errors.push(error.message));
		await page.goto(`http://localhost:${server.address().port}/`);
		await page.waitForSelector('.ck-editor__editable');

		const plugins = await page.evaluate(() =>
			[
				'ElementContextMenu',
				'ElementClipboard',
				'ElementActions',
				'ElementToolbar',
				'ElementClickable',
				'QuickInsert',
				'Breadcrumbs',
				'ElementMenu'
			].filter(name => !window.editor.plugins.has(name))
		);

		assert(plugins.length === 0, `Missing plugins: ${plugins.join(', ')}`);

		await page.locator('.ck-editor__editable p').click();
		assert(
			(await page.evaluate(() => window.clicked)) === 'paragraph',
			'The click did not reach the clickable element callback.'
		);
		assert((await page.locator('.ck-elements-breadcrumbs__item').count()) > 0, 'No breadcrumbs.');
		await page.waitForSelector(
			'.ck-balloon-panel_visible .ck-toolbar-container, .ck-toolbar-container.ck-balloon-panel_visible'
		);

		await page.locator('.ck-editor__editable p').click({ button: 'right' });
		await page.waitForSelector('.ck-elements-menu');
		assert((await page.locator('.ck-elements-menu .ck-button').count()) >= 3, 'The context menu has no items.');
		assert(
			(await page.locator('.ck-elements-menu').evaluate(menu => getComputedStyle(menu).display)) === 'flex',
			'The menu is not styled: is the stylesheet in the package?'
		);

		assert(errors.length === 0, `Page errors: ${errors.join('; ')}`);
	} finally {
		await browser.close();
		server.close();
	}
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}
