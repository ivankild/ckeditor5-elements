// The packages of the repository, found in `packages/`: the one place that knows them, for the tools that need the list
// (Vite aliases for the tests, the docs and the example; the checks; the version script).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The absolute path of the `packages` folder.
 */
export const packagesDir = fileURLToPath(new URL('../packages/', import.meta.url));

/**
 * The names of the packages. A package is in the folder with its name.
 */
export const packageNames = readdirSync(packagesDir)
	.filter(name => existsSync(join(packagesDir, name, 'package.json')))
	.sort();

/**
 * Reads the `package.json` of the package.
 */
export function readPackage(name) {
	return JSON.parse(readFileSync(join(packagesDir, name, 'package.json'), 'utf8'));
}

/**
 * Returns the Vite aliases that make the packages resolve to their sources, so changes show without building them.
 * Exact matches only, so subpaths such as `<package>/index.css` still resolve normally.
 */
export function sourceAliases() {
	return packageNames
		.filter(name => existsSync(join(packagesDir, name, 'src/index.ts')))
		.map(name => ({ find: new RegExp(`^${name}$`), replacement: join(packagesDir, name, 'src/index.ts') }));
}
