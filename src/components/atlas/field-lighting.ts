type Region = { id: string; x: number; z: number };

/** A smooth partition of the existing peaks, baked once rather than per pixel. */
export function terrainFieldWeights(
	x: number,
	z: number,
	regions: readonly Region[],
) {
	const distances = regions.map(
		(region) => ((x - region.x) / 3.3) ** 2 + ((z - region.z) / 3.9) ** 2,
	);
	const nearest = Math.min(...distances);
	const weights = distances.map((distance) =>
		Math.exp(-2.4 * (distance - nearest)),
	);
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	return weights.map((weight) => weight / total);
}

export function fieldQuietWeights(
	regions: readonly Pick<Region, "id">[],
	active: string | null,
	retained: readonly string[] = [],
) {
	if (!regions.some((region) => region.id === active))
		return regions.map(() => 0);
	return regions.map((region) =>
		region.id === active || retained.includes(region.id) ? 0 : 1,
	);
}
