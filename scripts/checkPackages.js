// Checks that the packages are consistent, so adding or changing one cannot leave a list out of date:
//
// * The umbrella package (`ckeditor5-elements`) brings every other published package: it depends on it, references it
//   in its tsconfig, and re-exports it.
// * The published packages are built by `tsconfig.packages.json`.
// * The features are uncoupled: they depend only on the core.
// * All packages have the same version, and the same peer dependency on `ckeditor5`.
// * The published packages have a license, a readme, and their build in `files`.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageNames, packagesDir, readPackage } from './packages.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const UMBRELLA = 'ckeditor5-elements';
const CORE = 'ckeditor5-elements-core';
const errors = [];
const check = (condition, message) => {
	if (!condition) {
		errors.push(message);
	}
};
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sameSet = (a, b) => a.length === b.length && a.every(item => b.includes(item));
const difference = (a, b) => a.filter(item => !b.includes(item));

const packages = Object.fromEntries(packageNames.map(name => [name, readPackage(name)]));
const published = packageNames.filter(name => !packages[name].private);
const features = published.filter(name => name !== UMBRELLA);

check(published.includes(UMBRELLA), `The umbrella package ${UMBRELLA} is missing or private.`);

// The umbrella brings every feature.
const umbrellaDeps = Object.keys(packages[UMBRELLA]?.dependencies ?? {});

check(
	sameSet(umbrellaDeps, features),
	`${UMBRELLA} must depend on exactly the published features. Missing: ${difference(features, umbrellaDeps).join(', ') || '-'}. Unknown: ${difference(umbrellaDeps, features).join(', ') || '-'}.`
);

for (const name of umbrellaDeps) {
	check(
		packages[UMBRELLA].dependencies[name] === 'workspace:*',
		`${UMBRELLA} must depend on ${name} as "workspace:*".`
	);
}

const umbrellaDir = join(packagesDir, UMBRELLA);
const umbrellaReferences = readJson(join(umbrellaDir, 'tsconfig.json')).references.map(({ path }) =>
	path.replace('../', '')
);

check(
	sameSet(umbrellaReferences, features),
	`The tsconfig of ${UMBRELLA} must reference exactly the published features. Missing: ${difference(features, umbrellaReferences).join(', ') || '-'}. Unknown: ${difference(umbrellaReferences, features).join(', ') || '-'}.`
);

const umbrellaSource = readFileSync(join(umbrellaDir, 'src/index.ts'), 'utf8');

for (const name of features) {
	check(umbrellaSource.includes(`export * from '${name}';`), `${UMBRELLA} must re-export ${name} in src/index.ts.`);
}

// Everything published is built.
const built = readJson(join(root, 'tsconfig.packages.json')).references.map(({ path }) =>
	path.replace('packages/', '')
);

check(
	sameSet(built, published),
	`tsconfig.packages.json must reference exactly the published packages. Missing: ${difference(published, built).join(', ') || '-'}. Unknown: ${difference(built, published).join(', ') || '-'}.`
);

// The features are uncoupled.
for (const name of features) {
	const dependencies = Object.keys(packages[name].dependencies ?? {});

	check(
		difference(dependencies, [CORE]).length === 0,
		`${name} may depend only on ${CORE}, not on ${difference(dependencies, [CORE]).join(', ')}.`
	);
	check(
		name === CORE || dependencies.length === 0 || packages[name].dependencies[CORE] === 'workspace:*',
		`${name} must depend on ${CORE} as "workspace:*".`
	);
}

// The versions and the CKEditor range.
const version = packages[UMBRELLA]?.version;
const peer = packages[UMBRELLA]?.peerDependencies?.ckeditor5;

for (const name of packageNames) {
	check(packages[name].version === version, `${name} is version ${packages[name].version}, not ${version}.`);
}

for (const name of published) {
	check(
		packages[name].peerDependencies?.ckeditor5 === peer,
		`${name} must have the peer dependency ckeditor5@${peer}.`
	);
}

// What is published.
for (const name of published) {
	const dir = join(packagesDir, name);

	check(existsSync(join(dir, 'LICENSE')), `${name} has no LICENSE.`);
	check(existsSync(join(dir, 'README.md')), `${name} has no README.md.`);
	check(packages[name].files?.includes('dist'), `${name} must publish its "dist".`);
}

if (errors.length) {
	console.error(errors.map(error => `- ${error}`).join('\n'));
	process.exit(1);
}
