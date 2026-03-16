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
		link: z.string().url(),
	}),
});

const publications = defineCollection({
	loader: glob({ base: "src/content/publications", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			venue: z.string(),
			year: z.number(),
			authors: z.string(),
			createdAt: z.coerce.date(),
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
	publications,
	projects,
	other,
	quickInfo,
	socials,
};
