const SVG = "http://www.w3.org/2000/svg";

export type Point = { x: number; y: number };
export type Leader = {
	show: (path: string, anchor?: Point) => void;
	hide: () => void;
};

/** Hairline leaders drawn in viewport pixels over the fixed annotation layer. */
export function createLeaderLayer(host: Element) {
	const svg = document.createElementNS(SVG, "svg");
	svg.setAttribute("class", "atlas-leaders");
	svg.setAttribute("aria-hidden", "true");
	host.prepend(svg);
	return {
		leader(
			kind: "field" | "preview" | "link" | "reading",
			ring = true,
		): Leader {
			const path = document.createElementNS(SVG, "path");
			path.setAttribute("class", `atlas-leader atlas-leader-${kind}`);
			path.setAttribute("pathLength", "1");
			svg.append(path);
			const circle = ring ? document.createElementNS(SVG, "circle") : null;
			if (circle) {
				circle.setAttribute(
					"class",
					`atlas-leader-ring${kind === "field" ? "" : " atlas-leader-ring-signal"}`,
				);
				circle.setAttribute("r", "4.5");
				svg.append(circle);
			}
			return {
				show(d, anchor) {
					path.setAttribute("d", d);
					path.toggleAttribute("data-on", true);
					if (circle && anchor) {
						circle.setAttribute("cx", String(anchor.x));
						circle.setAttribute("cy", String(anchor.y));
						circle.toggleAttribute("data-on", true);
					}
				},
				hide() {
					path.toggleAttribute("data-on", false);
					circle?.toggleAttribute("data-on", false);
				},
			};
		},
		dispose() {
			svg.remove();
		},
	};
}
