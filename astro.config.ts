import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import spectre from './package/src';
import { spectreDark } from './src/ec-theme';

// https://astro.build/config
const config = defineConfig({
	site: 'https://ghqqqq.github.io',
	output: 'static',
	devToolbar: {
		enabled: false,
	},
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
					title: 'Full Publications',
					description: 'Full publication list and research outputs.',
				},
				projects: {
					title: 'Projects',
					description: 'Research and engineering projects in progress.',
				},
			},
			giscus: false,
		}),
	],
});

export default config;
