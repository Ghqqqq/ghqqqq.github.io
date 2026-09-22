export const fields = [
	{
		id: "foundations",
		number: "01",
		category: "reinforcement-learning-bandits",
		label: "Reinforcement Learning & Bandits",
		short: "RL & Bandits",
		filterLabel: "RL & Bandits",
		description:
			"Bandits and online learning. Safe and constrained decision-making.",
		x: -6,
		z: 0,
		height: 4.1,
	},
	{
		id: "applications",
		number: "02",
		category: "recommendation-bidding",
		label: "Recommendation & Bidding",
		short: "Recommendation & Bidding",
		filterLabel: "Applications",
		description:
			"Learning from feedback in recommendation and online advertising.",
		x: 0,
		z: -5,
		height: 3.8,
	},
	{
		id: "agents",
		number: "03",
		category: "agent-llm-alignment",
		label: "Agent / LLM Alignment",
		short: "Agents & Alignment",
		filterLabel: "Agents",
		description:
			"Reinforcement learning for agentic LLMs and multimodal large models.",
		x: 6,
		z: 1,
		height: 4.6,
	},
] as const;

export type FieldId = (typeof fields)[number]["id"];
export type SurfaceMode = "relief" | "contours";
export const resolveSurfaceMode = (value: string | null): SurfaceMode =>
	value === "contours" ? "contours" : "relief";
export type Phase = "overview" | "research" | "journey" | "awards" | "service";
export type Paper = {
	id: string;
	title: string;
	description: string;
	authors: string;
	venue: string;
	venueShort?: string;
	year: number;
	link?: string;
	category?: string;
	selected?: boolean;
	lineage?: { sourceId: string; sourceTitle?: string; text: string };
};
export const fieldForPaper = (paper: Paper) =>
	fields.find((field) => field.category === paper.category)?.id;

export const selectedPapersForField = (
	papers: Paper[],
	field: FieldId | null,
) =>
	papers.filter(
		(paper) => paper.selected && (!field || fieldForPaper(paper) === field),
	);

const legacyHashes: Readonly<Record<string, string>> = {
	about: "journey",
	experience: "journey",
	publications: "research",
	"research-interests": "research",
	"publications-agent-llm-alignment": "field-agents",
	"publications-recommendation-bidding": "field-applications",
	"publications-reinforcement-learning-bandits": "field-foundations",
};

export function resolveAtlasHash(fragment: string) {
	let hash = fragment.replace(/^#/, "");
	try {
		hash = decodeURIComponent(hash);
	} catch {}
	return Object.hasOwn(legacyHashes, hash) ? legacyHashes[hash] : hash;
}
