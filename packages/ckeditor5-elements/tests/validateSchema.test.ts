import * as validate from 'ckeditor5-elements-schema/validate';
import { describe, expect, it } from 'vitest';
import * as entry from '../src/validateSchema.js';

describe('ckeditor5-elements/validate-schema', () => {
	it('exports the validation of the schema package, without the plugin', () => {
		expect(Object.keys(entry).sort()).toEqual(Object.keys(validate).sort());
		expect(entry.validateElementSchema).toBe(validate.validateElementSchema);
		expect('ElementSchema' in entry).toBe(false);
	});
});
