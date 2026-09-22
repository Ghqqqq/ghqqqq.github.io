type TransitionDirection = "open" | "close";

export function visibleTitle(element: HTMLElement | null): HTMLElement | null {
	if (!element?.isConnected) return null;
	const rect = element.getBoundingClientRect();
	if (rect.width < 1 || rect.height < 1) return null;
	let left = Math.max(0, rect.left),
		right = Math.min(innerWidth, rect.right);
	let top = Math.max(0, rect.top),
		bottom = Math.min(innerHeight, rect.bottom);
	for (
		let node: HTMLElement | null = element;
		node;
		node = node.parentElement
	) {
		const style = getComputedStyle(node);
		if (style.visibility === "hidden" || Number(style.opacity) === 0)
			return null;
		if (node !== element) {
			const bounds = node.getBoundingClientRect();
			if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
				left = Math.max(left, bounds.left);
				right = Math.min(right, bounds.right);
			}
			if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
				top = Math.max(top, bounds.top);
				bottom = Math.min(bottom, bounds.bottom);
			}
		}
	}
	return (Math.max(0, right - left) * Math.max(0, bottom - top)) /
		(rect.width * rect.height) >=
		0.65
		? element
		: null;
}

/** Only the title and paper sheet are captured; the Three.js landscape stays live. */
export function createReaderTransition(
	reader: HTMLDialogElement,
	motionAllowed: () => boolean,
) {
	let active: { key: string; cancel: (commit: boolean) => void } | null = null;

	function cancel(commit = true) {
		active?.cancel(commit);
	}
	function run(
		key: string,
		direction: TransitionDirection,
		source: HTMLElement | null,
		update: () => HTMLElement | null,
	) {
		cancel(false);
		const animate = motionAllowed();
		if (!document.startViewTransition || !animate || document.hidden) {
			if (!animate) reader.dataset.readerShared = "true";
			update();
			return;
		}
		const html = document.documentElement;
		const names = new Map<HTMLElement, string>();
		let sourceVisibility: string | null = null;
		let applied = false,
			cancelled = false;
		const name = (element: HTMLElement | null, value: string) => {
			if (!element) return;
			if (!names.has(element))
				names.set(element, element.style.viewTransitionName);
			element.style.viewTransitionName = value;
		};
		const restoreNames = () => {
			for (const [element, value] of names)
				element.style.viewTransitionName = value;
			names.clear();
		};
		const apply = () => {
			if (applied || cancelled) return;
			applied = true;
			html.dataset.readerTransitionStage = "update";
			restoreNames();
			if (direction === "open" && source) {
				sourceVisibility = source.style.visibility;
				source.style.visibility = "hidden";
			}
			const destination = update();
			name(visibleTitle(destination), "atlas-paper-title");
			name(reader, "atlas-reader-sheet");
			name(
				reader.querySelector<HTMLElement>("[data-reader-paper]:not([hidden])"),
				"atlas-reader-content",
			);
		};
		const clean = () => {
			restoreNames();
			if (source && sourceVisibility !== null) {
				source.style.visibility = sourceVisibility;
				sourceVisibility = null;
			}
			if (active === operation) {
				delete html.dataset.readerTransition;
				delete html.dataset.readerTransitionStage;
				active = null;
			}
		};
		html.dataset.readerTransition = direction;
		html.dataset.readerTransitionStage = "capture";
		if (direction === "open") reader.dataset.readerShared = "true";
		name(visibleTitle(source), "atlas-paper-title");
		name(reader, "atlas-reader-sheet");
		name(
			reader.querySelector<HTMLElement>("[data-reader-paper]:not([hidden])"),
			"atlas-reader-content",
		);
		const transition = document.startViewTransition(apply);
		const operation = {
			key,
			cancel(commit: boolean) {
				if (commit) apply();
				cancelled = true;
				transition.skipTransition();
				clean();
			},
		};
		active = operation;
		void transition.ready.then(
			() => {
				if (active === operation)
					html.dataset.readerTransitionStage = "animating";
			},
			() => {},
		);
		void transition.finished.then(clean, clean);
	}
	return {
		run,
		cancel,
		get key() {
			return active?.key;
		},
	};
}
