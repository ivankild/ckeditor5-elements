/**
 * Returns ` Did you mean "x"?` for the closest candidate, when it is close enough to be a typo.
 */
export function suggest(name: string, candidates: readonly string[]): string {
	let best: string | undefined;
	let bestDistance = 3;

	for (const candidate of candidates) {
		const distance = editDistance(name.toLowerCase(), candidate.toLowerCase());

		if (distance < bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}

	return best ? ` (did you mean "${best}"?)` : '';
}

function editDistance(a: string, b: string): number {
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

	for (let i = 1; i <= a.length; i++) {
		const current = [i];

		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(
				(previous[j] ?? 0) + 1,
				(current[j - 1] ?? 0) + 1,
				(previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1)
			);
		}

		previous = current;
	}

	return previous[b.length] ?? 0;
}
