export type SurfaceReveal = {
	from: number;
	to: number;
	started: number;
	duration: number;
};

export function beginSurfaceReveal(
	from: number,
	to: number,
	now: number,
): SurfaceReveal {
	return {
		from,
		to,
		started: now,
		duration: 680 * Math.max(0.2, Math.abs(to - from)),
	};
}

export function sampleSurfaceReveal(reveal: SurfaceReveal, now: number) {
	const t = Math.max(0, Math.min(1, (now - reveal.started) / reveal.duration));
	const eased = t * t * (3 - 2 * t);
	return {
		value: reveal.from + (reveal.to - reveal.from) * eased,
		done: t === 1,
	};
}
