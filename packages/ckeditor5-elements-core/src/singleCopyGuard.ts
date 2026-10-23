/**
 * Fails when this package is loaded twice, e.g. because two versions of it are installed: `ckeditor5-elements` of one
 * version, and a feature package of another. Two copies would register two different `ElementMenu` plugins (which
 * CKEditor refuses), and the commands of one copy would not be menu items for the other.
 *
 * It is the counterpart of CKEditor's `ckeditor-duplicated-modules` error. Like CKEditor's packages, this package
 * declares no `sideEffects` in its `package.json`, so bundlers keep this module, which exports nothing.
 */
const key = Symbol.for('ckeditor5-elements-core');

if (key in globalThis) {
	throw new Error(
		'ckeditor5-elements-core is loaded twice, so two versions of it are installed. Install only the ckeditor5-elements ' +
			'package, which brings all its packages in the same version. `npm ls ckeditor5-elements-core` shows the copies.'
	);
}

Object.defineProperty(globalThis, key, { value: true });

export {};
