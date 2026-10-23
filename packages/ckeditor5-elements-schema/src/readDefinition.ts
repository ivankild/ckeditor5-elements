import type { ElementSchemaKind } from './types.js';
import { suggest } from './suggest.js';

/**
 * Reports a problem of the schema, at the path.
 */
export type Report = (path: string, message: string) => void;

const TYPES = ['empty', 'block', 'container'];
export const ELEMENT_KEYS = ['type', 'isInline', 'allowChildren', 'allowIn', 'allowAttributes', 'editingTag'];

export const ELEMENT_NAME = /^[a-z][A-Za-z0-9]*$/;
export const ATTRIBUTE_NAME = /^[A-Za-z][\w.:-]*$/;
export const TAG_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function readKind(definition: Record<string, unknown>, path: string, report: Report): ElementSchemaKind | null {
	const { type, isInline } = definition;

	if (isInline !== undefined && typeof isInline !== 'boolean') {
		report(`${path}.isInline`, 'must be true or false.');
	}

	if (type === undefined) {
		report(`${path}.type`, 'is required: "empty", "block" or "container".');

		return null;
	}

	if (typeof type !== 'string' || !TYPES.includes(type)) {
		report(
			`${path}.type`,
			`must be "empty", "block" or "container", not ${JSON.stringify(type)}${typeof type === 'string' ? suggest(type, TYPES) : ''}.`
		);

		return null;
	}

	return { type: type as ElementSchemaKind['type'], isInline: isInline === true };
}

/**
 * Reads a list of names, and reports what is not a list of unique, non-empty strings. Returns the list, or
 * `undefined` when it is missing.
 */
export function readNames(
	definition: Record<string, unknown>,
	key: string,
	path: string,
	report: Report
): string[] | undefined {
	const value = definition[key];

	if (value === undefined) {
		return undefined;
	}

	if (!Array.isArray(value)) {
		report(`${path}.${key}`, `must be an array of names, e.g. ["a", "b"].`);

		return undefined;
	}

	const names: string[] = [];

	value.forEach((item: unknown, index) => {
		const itemPath = `${path}.${key}[${String(index)}]`;

		if (typeof item !== 'string' || !item) {
			report(itemPath, 'must be a non-empty string.');
		} else if (names.includes(item)) {
			report(itemPath, `"${item}" is listed twice.`);
		} else {
			names.push(item);
		}
	});

	return names;
}

export function checkKeys(
	object: Record<string, unknown>,
	allowed: readonly string[],
	path: string,
	report: Report
): void {
	for (const key of Object.keys(object)) {
		if (!allowed.includes(key)) {
			report(
				path ? `${path}.${key}` : key,
				`is not a known key${suggest(key, allowed)}. The keys are: ${allowed.map(name => `"${name}"`).join(', ')}.`
			);
		}
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
