const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·—°.";
const SCRAMBLE_INTERVAL = 45;

/** Characters before `progress` (0–1, across `total`) are settled; spaces never scramble. */
export function scrambleText(
	text: string,
	progress: number,
	offset = 0,
	total = text.length,
	random = Math.random,
) {
	let out = "";
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		out +=
			char === " " || (offset + i) / total < progress
				? char
				: GLYPHS[Math.floor(random() * GLYPHS.length)];
	}
	return out;
}

const settled = new WeakMap<Text, string>();
const running = new WeakMap<Element, number>();

export function decodeText(
	element: Element | null,
	{ duration = 700, delay = 0 }: { duration?: number; delay?: number } = {},
) {
	if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches)
		return;
	const nodes: { node: Text; text: string }[] = [];
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		if (!settled.has(node)) settled.set(node, node.data);
		const text = settled.get(node)!;
		if (text.trim()) nodes.push({ node, text });
	}
	const total = nodes.reduce((sum, item) => sum + item.text.length, 0);
	if (!total) return;
	const token = (running.get(element) ?? 0) + 1;
	running.set(element, token);
	const start = performance.now() + delay;
	let scrambledAt = 0;
	const render = (progress: number) => {
		let offset = 0;
		for (const { node, text } of nodes) {
			node.data = scrambleText(text, progress, offset, total);
			offset += text.length;
		}
	};
	const step = (now: number) => {
		if (running.get(element) !== token) return;
		const progress = (now - start) / duration;
		if (progress >= 1 || document.hidden) {
			for (const { node, text } of nodes) node.data = text;
			return;
		}
		if (now - scrambledAt > SCRAMBLE_INTERVAL) {
			scrambledAt = now;
			render(Math.max(0, progress));
		}
		requestAnimationFrame(step);
	};
	render(0);
	requestAnimationFrame(step);
}
