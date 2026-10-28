// Sets the version of all the packages, which have the same one: `pnpm version:set 49.0.1`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageNames, packagesDir } from './packages.js';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
	console.error('Usage: pnpm version:set <version>, e.g. 49.0.1');
	process.exit(1);
}

for (const name of packageNames) {
	const path = join(packagesDir, name, 'package.json');
	const text = readFileSync(path, 'utf8');

	writeFileSync(path, text.replace(/("version": ")[^"]+(")/, `$1${version}$2`));
	console.log(`${name}@${version}`);
}
