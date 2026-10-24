import type { ElementSchemaIssue } from './types.js';

/**
 * Thrown when the element schema is not valid. It lists all the problems, and has them in {@link issues}.
 */
export default class ElementSchemaError extends Error {
	/**
	 * The problems of the schema.
	 */
	public readonly issues: readonly ElementSchemaIssue[];

	constructor(issues: readonly ElementSchemaIssue[]) {
		super(
			`The element schema is not valid (${String(issues.length)} ${issues.length === 1 ? 'problem' : 'problems'}):\n` +
				issues.map(({ path, message }) => `- ${path ? `${path}: ` : ''}${message}`).join('\n')
		);

		this.name = 'ElementSchemaError';
		this.issues = issues;
	}
}
