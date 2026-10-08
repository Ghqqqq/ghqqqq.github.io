export type TagAnchor = { slot: number; x: number; y: number };
export type FieldTag = {
	slot: number;
	left: number;
	width: number;
	/** Baseline shared by every tag; leaders rise from each summit to it. */
	band: number;
	leader: string;
};

const SLOT_START = 0.47;
const RIGHT_MARGIN = 72;
const SLOT_GAP = 28;
const LEADER_RISE = 62;
const BAND_TOP = 150;

export function layoutFieldTags(
	anchors: TagAnchor[],
	viewportWidth: number,
	slots: number,
): FieldTag[] {
	if (!anchors.length) return [];
	const start = viewportWidth * SLOT_START;
	const slotWidth = (viewportWidth - RIGHT_MARGIN - start) / slots;
	const band = Math.max(
		BAND_TOP,
		Math.min(...anchors.map((anchor) => anchor.y)) - LEADER_RISE,
	);
	return anchors.map(({ slot, x, y }) => {
		const left = start + slot * slotWidth;
		const width = slotWidth - SLOT_GAP;
		const from = Math.min(x, left);
		const to = Math.max(x, left + width);
		return {
			slot,
			left,
			width,
			band,
			leader: `M${x} ${y - 6}V${band}M${from} ${band}H${to}`,
		};
	});
}
