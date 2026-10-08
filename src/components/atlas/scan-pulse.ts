export type ScanPulse = {
	started: number;
	duration: number;
	radius: number;
	/** Unscanned terrain renders as the contour study until the ring passes. */
	conceals: boolean;
};

export function beginScanPulse(
	now: number,
	options: {
		radius: number;
		duration: number;
		conceals: boolean;
		delay?: number;
	},
): ScanPulse {
	return {
		started: now + (options.delay ?? 0),
		duration: options.duration,
		radius: options.radius,
		conceals: options.conceals,
	};
}

export function sampleScanPulse(pulse: ScanPulse, now: number) {
	const t = Math.max(0, Math.min(1, (now - pulse.started) / pulse.duration));
	return {
		radius: pulse.radius * (1 - (1 - t) ** 3),
		edge: Math.min(1, t * 10) * (1 - t) ** 0.7,
		done: t === 1,
	};
}
