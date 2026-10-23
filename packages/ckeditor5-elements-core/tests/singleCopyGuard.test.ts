import { expect, it } from 'vitest';
import '../src/index.js';

it('fails when the package is loaded twice', async () => {
	// A query makes Vite load the module again, as a second copy of the package would be.
	const secondCopy = '../src/singleCopyGuard.ts?copy=2';

	await expect(import(/* @vite-ignore */ secondCopy)).rejects.toThrow(
		'ckeditor5-elements-core is loaded twice, so two versions of it are installed.'
	);
});
