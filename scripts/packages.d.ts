export const packagesDir: string;
export const packageNames: string[];
export function readPackage(name: string): Record<string, unknown> & {
	name: string;
	version: string;
	private?: boolean;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	files?: string[];
};
export function sourceAliases(): { find: RegExp; replacement: string }[];
