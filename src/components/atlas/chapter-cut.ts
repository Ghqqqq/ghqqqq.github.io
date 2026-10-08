const SLANT = 14;
const DURATION = 700;

/** Clip of the outgoing surface; `forward` cuts upward, otherwise downward. */
export function chapterCutFrame(progress: number, forward: boolean) {
	const eased = 1 - (1 - Math.max(0, Math.min(1, progress))) ** 4;
	const span = 100 + SLANT * 2;
	const center = forward ? 100 + SLANT - eased * span : -SLANT + eased * span;
	const left = center + SLANT;
	const right = center - SLANT;
	return {
		left,
		right,
		clipPath: forward
			? `polygon(0 0, 100% 0, 100% ${right}%, 0 ${left}%)`
			: `polygon(0 ${left}%, 100% ${right}%, 100% 100%, 0 100%)`,
	};
}

export function createChapterCut(wrap: HTMLElement) {
	const surface = wrap.querySelector<HTMLElement>(
		"[data-chapter-cut-surface]",
	)!;
	const edge = wrap.querySelector<SVGLineElement>("[data-chapter-cut-edge]")!;
	let frame = 0;
	function render(progress: number, forward: boolean) {
		const { left, right, clipPath } = chapterCutFrame(progress, forward);
		surface.style.clipPath = clipPath;
		edge.setAttribute("y1", String(left));
		edge.setAttribute("y2", String(right));
	}
	function cancel() {
		cancelAnimationFrame(frame);
		frame = 0;
		delete wrap.dataset.active;
	}
	return {
		play(outgoing: string, forward: boolean) {
			cancel();
			surface.style.background = outgoing;
			wrap.dataset.active = "";
			render(0, forward);
			const start = performance.now();
			const step = (now: number) => {
				const progress = (now - start) / DURATION;
				render(progress, forward);
				if (progress < 1) frame = requestAnimationFrame(step);
				else cancel();
			};
			frame = requestAnimationFrame(step);
		},
		cancel,
	};
}
