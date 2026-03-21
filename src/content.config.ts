import { defineCollection, z } from "astro:content";
import type { icons as lucideIcons } from "@iconify-json/lucide/icons.json";
import type { icons as simpleIcons } from "@iconify-json/simple-icons/icons.json";
import { file, glob } from "astro/loaders";

const other = defineCollection({
	loader: glob({ base: "src/content/other", pattern: "**/*.{md,mdx}" }),
});

const lucideIconSchema = z.object({
	type: z.literal("lucide"),
	name: z.custom<keyof typeof lucideIcons>(),
});

const simpleIconSchema = z.object({
	type: z.literal("simple-icons"),
	name: z.custom<keyof typeof simpleIcons>(),
});

const quickInfo = defineCollection({
	loader: file("src/content/info.json"),
	schema: z.object({
		id: z.number(),
		icon: z.union([lucideIconSchema, simpleIconSchema]),
		text: z.string(),
	}),
});

const socials = defineCollection({
	loader: file("src/content/socials.json"),
	schema: z.object({
		id: z.number(),
		icon: z.union([lucideIconSchema, simpleIconSchema]),
		text: z.string(),
		link: z.string().url().optional(),
	}),
});

const awards = defineCollection({
	loader: file("src/content/awards.json"),
	schema: z.object({
		id: z.number(),
		title: z.string(),
		meta: z.string().optional(),
		year: z.number().optional(),
	}),
});

const experience = defineCollection({
	loader: file("src/content/experience.json"),
	schema: z.object({
		id: z.number(),
		title: z.string(),
		organization: z.string(),
		period: z.string(),
		description: z.string().optional(),
		outcomes: z.array(z.string()).optional(),
	}),
});

const serviceTeaching = defineCollection({
	loader: file("src/content/service-teaching.json"),
	schema: z.object({
		id: z.number(),
		title: z.string(),
		meta: z.string(),
		kind: z.enum(["service", "teaching", "talk"]),
		notePrefix: z.string().optional(),
		noteLinkLabel: z.string().optional(),
		noteLink: z.string().url().optional(),
		noteSuffix: z.string().optional(),
	}),
});

const publications = defineCollection({
	loader: glob({ base: "src/content/publications", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			venue: z.string(),
			venueShort: z.string().optional(),
			status: z.enum(["conference", "journal", "submitted", "preprint"]).optional(),
			year: z.number(),
			authors: z.string(),
			createdAt: z.coerce.date(),
			selected: z.boolean().optional(),
			homepageCategory: z
				.enum([
					"agent-llm-alignment",
					"recommendation-bidding",
					"reinforcement-learning-bandits",
				])
				.optional(),
			image: image().optional(),
			link: z.string().url().optional(),
		}),
});

const projects = defineCollection({
	loader: glob({ base: "src/content/projects", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			image: image().optional(),
			link: z.string().url().optional(),
			info: z.array(
				z.object({
					text: z.string(),
					icon: z.union([lucideIconSchema, simpleIconSchema]),
					link: z.string().url().optional(),
				}),
			),
		}),
});

export const collections = {
	awards,
	experience,
	serviceTeaching,
	publications,
	projects,
	other,
	quickInfo,
	socials,
};
