// Fails when a stylesheet of the packages uses a `--ck-*` variable that CKEditor does not define (nor the stylesheet
// itself). Such a `var()` makes the whole declaration invalid, so the style is silently dropped.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(join(process.cwd(), 'packages/ckeditor5-elements-ui/package.json'));
const ckeditorCss = readFileSync(require.resolve('ckeditor5/ckeditor5.css'), 'utf8');
const definedBy = css => new Set([...css.matchAll(/(--ck-[\w-]+)\s*:/g)].map(match => match[1]));
const defined = definedBy(ckeditorCss);

let errors = 0;

for (const pkg of readdirSync('packages')) {
	const themeDir = join('packages', pkg, 'theme');

	if (!existsSync(themeDir)) {
		continue;
	}

	for (const file of readdirSync(themeDir).filter(name => name.endsWith('.css'))) {
		const path = join(themeDir, file);
		const css = readFileSync(path, 'utf8');
		const own = definedBy(css);

		for (const [, name] of css.matchAll(/var\((--ck-[\w-]+)/g)) {
			if (!defined.has(name) && !own.has(name)) {
				console.error(`${path}: ${name} is not defined by CKEditor.`);
				errors++;
			}
		}
	}
}

if (errors) {
	process.exit(1);
}
