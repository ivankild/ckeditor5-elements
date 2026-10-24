// Removes the builds of the packages: their `dist` folders and the TypeScript build info. `tsc --build --clean` removes
// only the outputs of the sources that exist, so the outputs of moved or removed sources would stay, and be published.
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { packageNames, packagesDir } from './packages.js';

for (const name of packageNames) {
	rmSync(join(packagesDir, name, 'dist'), { recursive: true, force: true });
	rmSync(join(packagesDir, name, 'tsconfig.tsbuildinfo'), { force: true });
}
