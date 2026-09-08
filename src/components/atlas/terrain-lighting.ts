// Bake local occlusion and soft sunlight once, using the existing height grid.
export function bakeTerrainLighting(
	heights: Float32Array,
	columns: number,
	rows: number,
	width: number,
	depth: number,
) {
	if (
		columns < 2 ||
		rows < 2 ||
		heights.length !== columns * rows ||
		width <= 0 ||
		depth <= 0
	)
		throw new Error("Invalid terrain grid");
	const result = new Float32Array(heights.length * 2);
	const dx = width / (columns - 1),
		dz = depth / (rows - 1);
	const directions = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
		[Math.SQRT1_2, Math.SQRT1_2],
		[-Math.SQRT1_2, Math.SQRT1_2],
		[Math.SQRT1_2, -Math.SQRT1_2],
		[-Math.SQRT1_2, -Math.SQRT1_2],
	];
	function sample(x: number, z: number) {
		const gx = Math.max(0, Math.min(columns - 1, x / dx));
		const gz = Math.max(0, Math.min(rows - 1, z / dz));
		const ix = Math.min(columns - 2, Math.floor(gx)),
			iz = Math.min(rows - 2, Math.floor(gz));
		const tx = gx - ix,
			tz = gz - iz,
			index = iz * columns + ix;
		const a = heights[index] * (1 - tx) + heights[index + 1] * tx;
		const b =
			heights[index + columns] * (1 - tx) + heights[index + columns + 1] * tx;
		return a * (1 - tz) + b * tz;
	}
	for (let z = 0; z < rows; z++) {
		for (let x = 0; x < columns; x++) {
			const index = z * columns + x,
				h = heights[index],
				px = x * dx,
				pz = z * dz;
			const gx = (sample(px + dx, pz) - sample(px - dx, pz)) / (2 * dx);
			const gz = (sample(px, pz + dz) - sample(px, pz - dz)) / (2 * dz);
			let obstruction = 0;
			for (const [vx, vz] of directions) {
				for (const radius of [0.6, 1.5]) {
					const plane = h + (gx * vx + gz * vz) * radius;
					obstruction += Math.max(
						0,
						(sample(px + vx * radius, pz + vz * radius) - plane - 0.04) /
							radius,
					);
				}
			}
			let sunlight = 1;
			for (const distance of [0.35, 0.75, 1.25, 2, 3.2, 5, 7]) {
				const blocker =
					sample(px - 0.735 * distance, pz + 0.678 * distance) -
					(h + 0.08 + distance * 1.018);
				const shade = Math.max(
					0,
					Math.min(1, blocker / (0.22 + distance * 0.08)),
				);
				sunlight = Math.min(sunlight, 1 - shade * 0.58);
			}
			result[index * 2] = 1 - Math.min(0.38, (obstruction / 16) * 0.62);
			result[index * 2 + 1] = sunlight;
		}
	}
	return result;
}
