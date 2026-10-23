// Builds the stylesheet of the umbrella package, `ckeditor5-elements/index.css`: the stylesheets of its packages in one
// file (the core first), as `ckeditor5/ckeditor5.css` is for CKEditor.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('../packages/ckeditor5-elements/', import.meta.url));
const require = createRequire(join(packageDir, 'package.json'));
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const names = Object.keys(readJson(join(packageDir, 'package.json')).dependencies).sort((a, b) =>
	a.endsWith('-core') ? -1 : b.endsWith('-core') ? 1 : a.localeCompare(b)
);

const parts = names
	.filter(name => readJson(require.resolve(`${name}/package.json`)).exports?.['./index.css'])
	.map(name => `/* ${name} */\n${readFileSync(require.resolve(`${name}/index.css`), 'utf8').trim()}\n`);

mkdirSync(join(packageDir, 'dist'), { recursive: true });
writeFileSync(join(packageDir, 'dist/index.css'), parts.join('\n'));
