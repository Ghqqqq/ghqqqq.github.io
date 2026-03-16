import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import spectre from './package/src';
import { spectreDark } from './src/ec-theme';

// https://astro.build/config
const config = defineConfig({
	site: 'https://example.com',
	output: 'static',
	integrations: [
		expressiveCode({
			themes: [spectreDark],
		}),
		mdx(),
		sitemap(),
		spectre({
			name: 'Hengquan Guo',
			openGraph: {
				home: {
					title: 'Hengquan Guo',
					description: 'Academic homepage for Hengquan Guo.',
				},
				blog: {
					title: 'Publications',
					description: 'Selected publications and research outputs.',
				},
				projects: {
					title: 'Projects',
					description: 'Research and engineering projects in progress.',
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
