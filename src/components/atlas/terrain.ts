import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

type Peak = { x: number; z: number; height: number };
const noise = new ImprovedNoise();

// Fixed noise coordinates keep the landform and its publication paths stable.
export function terrainElevation(x: number, z: number, peaks: readonly Peak[]) {
	const warpX = x + noise.noise(x * 0.19, z * 0.19, 4.7) * 1.15;
	const warpZ = z + noise.noise(x * 0.19, z * 0.19, 11.3) * 1.15;
	let envelope = 0;
	for (const peak of peaks) {
		const dx = (warpX - peak.x) / 3.3;
		const dz = (warpZ - peak.z) / 3.9;
		envelope += peak.height * Math.exp(-(dx * dx + dz * dz) * 0.94);
	}
	let ridges = 0;
	let amplitude = 0.58;
	let frequency = 0.4;
	for (let octave = 0; octave < 4; octave++) {
		const sample = noise.noise(warpX * frequency, warpZ * frequency, 7.2);
		const ridge = 1 - Math.sqrt(sample * sample + 0.008);
		ridges += ridge * ridge * amplitude;
		frequency *= 2.08;
		amplitude *= 0.47;
	}
	const foothills = noise.noise(x * 0.3, z * 0.3, 2.4) * 0.12;
	return (
		envelope * (0.38 + 0.93 * ridges) + foothills * Math.min(1, envelope) - 0.07
	);
}
