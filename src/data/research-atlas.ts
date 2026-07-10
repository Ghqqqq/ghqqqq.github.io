export type PublicationGroupId =
	| "agent-llm-alignment"
	| "recommendation-bidding"
	| "reinforcement-learning-bandits";

export type ResearchAtlasNode = {
	id: string;
	label: string;
	shortLabel: string;
	href?: `#${string}`;
	publicationGroup?: PublicationGroupId;
};

export type ResearchAtlasGroup = {
	id: "foundations" | "applications";
	label: string;
	nodes: readonly ResearchAtlasNode[];
};

export const researchAtlas = {
	label: "Research interests",
	core: {
		id: "reinforcement-learning-bandits",
		label: "Reinforcement Learning & Bandits",
		shortLabel: "RL & Bandits",
		href: "#publications-reinforcement-learning-bandits",
	},
	groups: [
		{
			id: "foundations",
			label: "Foundations",
			nodes: [
				{
					id: "bandits-online-learning",
					label: "Bandits & Online Learning",
					shortLabel: "Bandits",
					href: "#publications-reinforcement-learning-bandits",
					publicationGroup: "reinforcement-learning-bandits",
				},
				{
					id: "safe-constrained-learning",
					label: "Safe / Constrained Learning",
					shortLabel: "Safety",
					href: "#publications-reinforcement-learning-bandits",
					publicationGroup: "reinforcement-learning-bandits",
				},
			],
		},
		{
			id: "applications",
			label: "Applications",
			nodes: [
				{
					id: "recommendation-bidding",
					label: "Recommendation & Bidding",
					shortLabel: "RecSys & Bidding",
					href: "#publications-recommendation-bidding",
					publicationGroup: "recommendation-bidding",
				},
				{
					id: "llm-alignment",
					label: "LLM Alignment",
					shortLabel: "Alignment",
					href: "#publications-agent-llm-alignment",
					publicationGroup: "agent-llm-alignment",
				},
				{
					id: "agentic-llms",
					label: "Agentic LLMs",
					shortLabel: "Agents",
					href: "#publications-agent-llm-alignment",
					publicationGroup: "agent-llm-alignment",
				},
				{
					id: "multimodal-llms",
					label: "Multimodal LLMs",
					shortLabel: "Multimodal",
					href: "#publications-agent-llm-alignment",
					publicationGroup: "agent-llm-alignment",
				},
			],
		},
	] satisfies readonly ResearchAtlasGroup[],
} as const;

export const homeSections = [
	{ id: "about", number: "01", label: "About", context: "Research core" },
	{
		id: "experience",
		number: "02",
		label: "Experience",
		context: "Field work",
	},
	{ id: "awards", number: "03", label: "Awards", context: "Recognition" },
	{
		id: "service",
		number: "04",
		label: "Service & Teaching",
		context: "Community",
	},
	{
		id: "publications",
		number: "05",
		label: "Selected Publications",
		context: "Research branches",
	},
] as const;

export type HomeSection = (typeof homeSections)[number];
export type HomeSectionId = HomeSection["id"];
