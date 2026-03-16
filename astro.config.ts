import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import spectre from './package/src';
import { spectreDark } from './src/ec-theme';

// https://astro.build/config
const config = defineConfig({
	site: 'https://spectre.lou.gg',
	output: 'static',
	integrations: [
		expressiveCode({
			themes: [spectreDark],
		}),
		mdx(),
		sitemap(),
		spectre({
			name: 'Spectre',
			openGraph: {
				home: {
					title: 'Spectre',
					description: 'A minimalistic theme for Astro.',
				},
				blog: {
					title: 'Blog',
					description: 'News and guides for Spectre.',
				},
				projects: {
					title: 'Projects',
				},
			},
			giscus: false,
		}),
	],
	adapter: node({
		mode: 'standalone',
	}),
});

export default config;
