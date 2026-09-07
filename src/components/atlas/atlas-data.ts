export const fields = [
	{
		id: "foundations",
		number: "01",
		category: "reinforcement-learning-bandits",
		label: "Reinforcement Learning & Bandits",
		short: "RL & Bandits",
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
		description:
			"Reinforcement learning for agentic LLMs and multimodal large models.",
		x: 6,
		z: 1,
		height: 4.6,
	},
] as const;

export type FieldId = (typeof fields)[number]["id"];
export type Phase = "overview" | "research" | "journey" | "awards" | "service";
export type Paper = {
	id: string;
	title: string;
	authors: string;
	venue: string;
	venueShort?: string;
	year: number;
	link?: string;
	category?: string;
	selected?: boolean;
	lineage?: { sourceId: string; text: string };
};
export const fieldForPaper = (paper: Paper) =>
	fields.find((field) => field.category === paper.category)?.id;

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
