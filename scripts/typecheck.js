// Type-checks the projects that are not built: the tests of each package, the example, the docs, and the tools. (The
// packages themselves are checked by building them: `tsc --build`.) The projects are checked in parallel.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageNames, packagesDir } from './packages.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const projects = [
	...packageNames.map(name => join(packagesDir, name, 'tests')),
	join(packagesDir, 'ckeditor5-elements-example'),
	join(root, 'docs'),
	root
].filter(dir => existsSync(join(dir, 'tsconfig.json')));

const results = await Promise.all(
	projects.map(
		dir =>
			new Promise(resolve => {
				execFile('pnpm', ['exec', 'tsc', '-p', dir], { cwd: root }, (error, stdout, stderr) => {
					resolve({ dir: relative(root, dir) || '.', failed: !!error, output: stdout + stderr });
				});
			})
	)
);

for (const { dir, failed, output } of results) {
	if (failed) {
		console.error(`\n${dir}\n${output.trim()}`);
	}
}

const failed = results.filter(result => result.failed);

if (failed.length) {
	console.error(`\nType errors in ${failed.length} of ${results.length} projects.`);
	process.exit(1);
}
