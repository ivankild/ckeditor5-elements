import { describe, expect, it } from 'vitest';
import * as main from '../src/index.js';
import * as validate from '../src/validate.js';

// The sources of the modules that must work in Node.js, as text: the entry, and all of the definition.
const sources = import.meta.glob<string>(['../src/validate.ts', '../src/definition/*.ts'], {
	query: '?raw',
	import: 'default',
	eager: true
});

describe('the entry without an editor (validate)', () => {
	it('is part of the main entry, which exports all of it', () => {
		for (const [name, value] of Object.entries(validate)) {
			expect([name, (main as Record<string, unknown>)[name]]).toEqual([name, value]);
		}
	});

	it('exports the validation, the compiling, the error and the queries', () => {
		expect(Object.keys(validate).sort()).toEqual([
			'ElementSchemaError',
			'compileElementSchema',
			'getLists',
			'getVerbatimElements',
			'validateElementSchema'
		]);
	});

	it('does not import CKEditor except for types, so it does not need a DOM', () => {
		expect(Object.keys(sources)).toContain('../src/validate.ts');
		expect(Object.keys(sources)).toContain('../src/definition/validateElementSchema.ts');

		for (const [path, source] of Object.entries(sources)) {
			// Imports of values: `import { x } from 'ckeditor5'`, not `import type`.
			expect([path, /^import (?!type\b)[^;]*from 'ckeditor5'/m.test(source)]).toEqual([path, false]);
		}
	});

	it('imports nothing out of the definition, which is all it needs', () => {
		for (const [path, source] of Object.entries(sources)) {
			if (path.startsWith('../src/definition/')) {
				expect([path, source.includes("from '../")]).toEqual([path, false]);
			}
		}
	});
});
