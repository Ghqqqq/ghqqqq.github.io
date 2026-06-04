import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function readBuilt(relativePath) {
	for (const basePath of [resolve("dist", relativePath), resolve("dist", "client", relativePath)]) {
		try {
			return await readFile(basePath, "utf8");
		} catch {}
	}

	return null;
}

async function readRepo(relativePath) {
	try {
		return await readFile(resolve(relativePath), "utf8");
	} catch {
		return null;
	}
}

test("homepage renders the academic CV structure and omits excluded personal data", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(html, /Hengquan Guo/);
	assert.match(html, /data-theme="dark"/);
	assert.match(html, /id="theme-toggle"/);
	assert.match(html, /ShanghaiTech University/);
	assert.match(
		html,
		/Research interests[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits[\s\S]*Foundations[\s\S]*Bandits(?:\s*&amp;\s*|\s*&\s*)Online Learning[\s\S]*Safe \/ Constrained Learning[\s\S]*Applications[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding[\s\S]*LLM Alignment[\s\S]*Agentic LLMs[\s\S]*Multimodal LLMs/i,
	);
	assert.match(html, /class="research-map"/);
	assert.match(html, /class="research-map-node core"/);
	assert.match(html, /class="research-map-branch"/);
	assert.doesNotMatch(html, /class="research-map-node-index"/);
	assert.match(
		html,
		/class="research-map-node core"[\s\S]*class="research-map-node-label"[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits/,
	);
	assert.match(html, /Reinforcement Learning/);
	assert.match(html, /LLM Alignment/);
	assert.match(html, /Research interests/i);
	assert.match(html, /href="https:\/\/www\.shanghaitech\.edu\.cn\/"/);
	assert.match(html, /href="https:\/\/liuxincell\.github\.io\/"/);
	assert.match(html, /href="https:\/\/junwei-pan\.github\.io\/"/);
	assert.match(
		html,
		/research centers on reinforcement learning and bandits, spanning theoretical foundations and applications\./i,
	);
	assert.match(
		html,
		/In 2025[\s\S]*Tencent Rhino-Bird Elite Talent Program[\s\S]*advised by/i,
	);
	assert.match(
		html,
		/current research interest is in reinforcement learning for agentic LLMs and multimodal large models/i,
	);
	assert.match(html, /class="about-pull-quote"/);
	assert.match(
		html,
		/Learning under constraints, feedback, and changing environments\./,
	);
	assert.match(
		html,
		/About[\s\S]*Experience[\s\S]*Awards[\s\S]*Service(?:\s*&amp;\s*|\s*&\s*)Teaching[\s\S]*Selected Publications/,
	);
	assert.match(html, /guohq \(at\) shanghaitech\.edu\.cn/);
	assert.match(html, /guohq46 \(at\) qq\.com/);
	assert.match(
		html,
		/href="https:\/\/scholar\.google\.com\/citations\?user=8bGinucAAAAJ/,
	);
	assert.match(html, /ICML Silver Reviewer/);
	assert.match(html, /Top 25%/);
	assert.match(html, /National Scholarship for Doctoral Students/);
	assert.match(html, /Tencent Rhino-Bird Elite Talent Program/);
	assert.match(html, /Awards[\s\S]*ICML Silver Reviewer[\s\S]*NeurIPS Top Reviewer/);
	assert.match(html, /RLChina 2022/);
	assert.match(html, /Research Intern/);
	assert.match(html, /2025\.06 - 2026\.02/);
	assert.match(
		html,
		/Experience[\s\S]*Research Intern[\s\S]*Reinforcement learning for recommendation and online bidding; produced three research works, with papers accepted at ICLR 2026 and the KDD 2026 ADS Track, and one under submission\./i,
	);
	assert.match(html, /Tencent CDG · Tencent Rhino-Bird Elite Talent Program/);
	assert.match(html, /Hengquan Guo[\s\S]*ShanghaiTech University[\s\S]*Google Scholar/);
	assert.doesNotMatch(html, /GitHub \(Coming soon\)/);
	assert.doesNotMatch(html, /CV \(Coming soon\)/);
	assert.doesNotMatch(html, /submitted to ICML/i);
	assert.doesNotMatch(html, /<h3[^>]*>\s*Links\s*<\/h3>/);
	assert.doesNotMatch(html, /mailto:/);
	assert.doesNotMatch(html, /tel:/);
	assert.doesNotMatch(html, /PhD Researcher/);
	assert.doesNotMatch(html, /Xiangtan University/);
	assert.doesNotMatch(html, /Latest Posts/);
	assert.doesNotMatch(html, /Work Experience/);
	assert.doesNotMatch(html, /Made in Germany/);
	assert.doesNotMatch(html, /Project Placeholder/);
	assert.doesNotMatch(html, /project-figure-link/);
	assert.doesNotMatch(html, />Projects<\/h2>/);
});

test("publications route and homepage navigation expose full publications", async () => {
	const publicationsHtml = await readBuilt("publications/index.html");
	const publicationsPage = await readRepo("src/pages/publications.astro");
	const homepageHtml = await readBuilt("index.html");
	const projectsHtml = await readBuilt("projects/index.html");
	const blockProjectHtml = await readBuilt("projects/block/index.html");
	const codexOverleafProjectHtml = await readBuilt("projects/codex-overleaf-link/index.html");

	assert.ok(publicationsHtml, "expected built publications index");
	assert.ok(publicationsPage, "expected publications page source");
	assert.match(publicationsHtml, /Full Publications|Publications/);
	assert.match(publicationsHtml, /full-publications-list/);
	assert.match(publicationsHtml, /publication-archive/);
	assert.match(publicationsHtml, /publication-year-group/);
	assert.match(publicationsHtml, /publication-year-label/);
	assert.match(
		publicationsHtml,
		/id="publications-2026"[\s\S]*BLOCK: An Open-Source Bi-Stage MLLM Character-to-Skin Pipeline/,
	);
	assert.match(
		publicationsHtml,
		/id="publications-2025"[\s\S]*Enhancing Safety in Reinforcement Learning with Human Feedback via Rectified Policy Optimization/,
	);
	assert.doesNotMatch(publicationsHtml, /class="publication-cover"/);
	assert.match(
		publicationsHtml,
		/Triple-Optimistic Learning|Online convex optimization with hard constraints/i,
	);
	assert.match(
		publicationsHtml,
		/POBO: Safe and Optimal Resource Management for Cloud Microservices/,
	);
	assert.match(
		publicationsHtml,
		/ACM SIGKDD Conference on Knowledge Discovery and Data Mining \(KDD 2026, Applied Data Science Track\)/,
	);
	assert.match(
		publicationsHtml,
		/SABO: Safe and Aggressive Bayesian Optimization for Automatic Legged Locomotion Controller Tuning/,
	);
	assert.match(publicationsHtml, /Submitted|Preprint|ArXiv|Journal/);
	assert.doesNotMatch(publicationsHtml, /class="publication-lineage"/);
	assert.doesNotMatch(
		publicationsHtml,
		/Hard constraints\s*→\s*rectified policy optimization/,
	);
	assert.match(publicationsPage, /publicationYearGroups/);
	assert.match(publicationsPage, /\.publication-year-label\s*{[^}]*position:\s*sticky/);
	assert.match(
		publicationsPage,
		/\.publication-year-group\s*{[^}]*grid-template-columns:\s*minmax\(4\.75rem,\s*6rem\)\s+minmax\(0,\s*1fr\)/,
	);
	assert.match(publicationsPage, /\.page-lede\s*{[^}]*font-style:\s*normal/);
	assert.match(
		publicationsPage,
		/\.publication-archive\s+:global\(\.publication-teaser\.list\)\s*{[^}]*padding:\s*1\.2rem\s+0/,
	);
	assert.match(
		publicationsPage,
		/\.publication-archive\s+:global\(\.publication-teaser\.list::before\)/,
	);
	assert.match(
		publicationsPage,
		/\.publication-archive\s+:global\(\.publication-teaser\.list:has\(\.publication-main-link:hover\)\)[\s\S]*background-color:\s*transparent/,
	);
	assert.match(
		publicationsPage,
		/\.publication-archive\s+:global\(\.publication-teaser\.list\s+\.publication-copy h3\)\s*{[^}]*font-size:\s*1\.16rem/,
	);
	assert.match(
		publicationsPage,
		/@media screen and \(max-width:\s*640px\)[\s\S]*\.publication-archive\s+:global\(\.publication-teaser\.list\s+\.post-header\)\s*{[^}]*display:\s*grid/,
	);

	assert.ok(homepageHtml, "expected built homepage HTML");
	assert.match(homepageHtml, /href="\/publications"/);
	assert.match(homepageHtml, />\s*Full Publications\s*</);
	assert.ok(projectsHtml, "expected built projects index");
	assert.match(projectsHtml, /BLOCK/);
	assert.match(projectsHtml, /Codex Overleaf Link/);
	assert.doesNotMatch(projectsHtml, /Project Placeholder/);
	assert.ok(blockProjectHtml, "expected built BLOCK project page");
	assert.ok(codexOverleafProjectHtml, "expected built Codex Overleaf Link project page");
	assert.match(
		blockProjectHtml,
		/I[’']m iterating and working on generating Minecraft skins end-to-end\. If you are also interested, feel free to contact me\./,
	);
	assert.match(blockProjectHtml, /Current Results/);
	assert.match(blockProjectHtml, /Example 1/);
	assert.match(blockProjectHtml, /block-hf-ex1-preview/);
	assert.match(blockProjectHtml, /block-hf-ex1-skin/);
	assert.match(
		blockProjectHtml,
		/This is the current effect on a relatively simple character concept\./,
	);
	assert.match(blockProjectHtml, /Example 2/);
	assert.match(blockProjectHtml, /block-hf-ex2-preview/);
	assert.match(blockProjectHtml, /block-hf-ex2-skin/);
	assert.match(
		blockProjectHtml,
		/This is the current effect on a more detailed fantasy-style character with fine-grained clothing and hair cues\./,
	);
	assert.match(blockProjectHtml, /Example 3/);
	assert.match(blockProjectHtml, /block-hf-ex3-preview/);
	assert.match(blockProjectHtml, /block-hf-ex3-skin/);
	assert.match(
		blockProjectHtml,
		/This is the current effect on a harder sports-jersey example where some preview details are still compressed\./,
	);
	assert.doesNotMatch(blockProjectHtml, /Figure 2: Overview of BLOCK/);
	assert.doesNotMatch(blockProjectHtml, /block-example-1|block-example-2|block-example-3/);
	assert.match(
		codexOverleafProjectHtml,
		/Codex Overleaf Link brings Codex directly into the Overleaf editor through a Chrome side panel\./,
	);
	assert.match(
		codexOverleafProjectHtml,
		/It keeps the writing flow inside Overleaf while adding diff review and safe writeback for AI-assisted editing\./,
	);
	assert.match(codexOverleafProjectHtml, /codex-preview/);
	assert.match(codexOverleafProjectHtml, /GitHub/);
	assert.match(codexOverleafProjectHtml, /Release/);
	assert.match(codexOverleafProjectHtml, /npm CLI/);
	assert.doesNotMatch(publicationsHtml, /KDDS 2026 Ads Track/);
	assert.doesNotMatch(publicationsHtml, /Submitted to KDD/);
	assert.doesNotMatch(publicationsHtml, /Submitted KDD paper/);
});

test("homepage groups selected publications by research area with real venue badges", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(
		html,
		/Agent \/ LLM Alignment[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits/,
	);
	assert.match(
		html,
		/Enhancing Safety in Reinforcement Learning with Human Feedback via Rectified Policy Optimization/,
	);
	assert.match(html, /class="publication-lineage"/);
	assert.match(html, /Idea lineage/);
	assert.match(html, /Hard constraints\s*→\s*rectified policy optimization/);
	assert.match(
		html,
		/href="\/publications\/online-convex-optimization-hard-constraints"[\s\S]*Online Convex Optimization with Hard Constraints/,
	);
	assert.match(
		html,
		/Towards Safe and Optimal Online Bidding: A Modular Look-ahead Lyapunov Framework/,
	);
	assert.match(
		html,
		/BLOCK: An Open-Source Bi-Stage MLLM Character-to-Skin Pipeline/,
	);
	assert.match(
		html,
		/Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning/,
	);
	assert.match(
		html,
		/GRB: A Generative Reinforcement Bidding Framework for Multi-Channel Online Advertising/,
	);
	assert.match(html, /Hengquan Guo\*/);
	assert.match(html, /equal contribution/);
	assert.match(
		html,
		/Triple-Optimistic Learning for Stochastic Contextual Bandits with General Constraints/,
	);
	assert.match(
		html,
		/Agent \/ LLM Alignment[\s\S]*publication-teaser list[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding[\s\S]*publication-teaser list[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits[\s\S]*publication-teaser list/,
	);
	assert.match(
		html,
		/class="publication-group-index"[\s\S]*01[\s\S]*class="publication-group-rule"[\s\S]*class="publication-group-name"[\s\S]*Agent \/ LLM Alignment/,
	);
	assert.match(
		html,
		/class="publication-group-index"[\s\S]*02[\s\S]*class="publication-group-rule"[\s\S]*class="publication-group-name"[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding/,
	);
	assert.doesNotMatch(html, /publication-teaser compact/);
	assert.doesNotMatch(html, /publication-cover/);
});

test("homepage shell exposes the refreshed avatar and theme toggle", async () => {
	const html = await readBuilt("index.html");
	const snakeGame = await readRepo("src/components/SnakeGame.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(snakeGame, "expected snake game source");
	assert.match(html, /profile-bird-original/);
	assert.match(html, /theme-toggle/);
	assert.match(html, /theme-toggle-glyph/);
	assert.match(html, /href="\/favicon-bird\.png"/);
	assert.match(html, /rel="shortcut icon"/);
	assert.match(html, /award-list/);
	assert.match(html, /award-title/);
	assert.match(html, /service-list/);
	assert.match(html, /service-heading/);
	assert.match(html, /service-kind/);
	assert.match(html, /id="snake-trigger"/);
	assert.match(html, /id="snake-board-wrap"/);
	assert.match(html, /id="snake-board"/);
	assert.match(snakeGame, /const COLS = 36/);
	assert.match(snakeGame, /const ROWS = 8/);
	assert.match(snakeGame, /document\.addEventListener\("keydown"/);
	assert.doesNotMatch(html, /brand-bird-icon|brand-bird-mark/);
	assert.doesNotMatch(html, /award-entry/);
});

test("homepage implements the editorial art and motion proposal hooks", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");
	const resetCss = await readRepo("src/styles/reset.css");
	const globalsCss = await readRepo("src/styles/globals.css");
	const navbar = await readRepo("src/components/Navbar.astro");
	const themeToggle = await readRepo("src/components/ThemeToggle.astro");
	const contentConfig = await readRepo("src/content.config.ts");
	const publicationTeaser = await readRepo("src/components/PublicationTeaser.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.ok(resetCss, "expected reset CSS source");
	assert.ok(navbar, "expected navbar source");
	assert.ok(themeToggle, "expected theme toggle source");
	assert.ok(contentConfig, "expected content config source");
	assert.ok(publicationTeaser, "expected publication teaser source");

	assert.match(html, /data-home-motion/);
	assert.match(html, /data-reveal/);
	assert.match(html, /data-draw-line/);
	assert.match(indexPage, /IntersectionObserver/);
	assert.match(indexPage, /prefers-reduced-motion:\s*reduce/);
	assert.match(indexPage, /is-active-section/);

	// Paper grain lives in globals.css so the texture applies site-wide (not home-only).
	assert.match(globalsCss, /body::before/);
	assert.match(globalsCss, /paper-grain/);
	assert.match(globalsCss, /mix-blend-mode:\s*multiply/);
	assert.match(indexCss, /\.home\[data-motion-ready\]\s+\[data-reveal\]/);
	assert.match(indexCss, /\.hero-avatar\s*{[^}]*border:\s*1px solid/);
	assert.match(indexCss, /\.hero-avatar img\s*{[^}]*grayscale\(0\.08\)/);
	assert.match(indexCss, /\.about-pull-quote/);
	assert.match(indexCss, /\.research-map/);
	assert.match(indexCss, /\.research-map-node\.core\s*{[\s\S]*text-align:\s*center/);
	assert.match(indexCss, /\.research-map-node\.core\s*{[^}]*border-radius:\s*8px/);
	assert.match(indexCss, /\.research-map-branch/);
	assert.match(indexCss, /\.research-map-node\.leaf:hover\s*{[^}]*translateY\(-1px\)/);
	assert.doesNotMatch(indexCss, /\.research-map-node-index/);
	assert.doesNotMatch(indexCss, /\.interest-inline/);
	assert.match(indexCss, /\.section-head::after/);
	assert.match(indexCss, /\.section-head\.is-active-section::after/);
	assert.match(indexCss, /\.section-head\.is-active-section\s+\.section-num/);
	assert.match(indexCss, /\.section-head:hover::after/);
	assert.match(indexCss, /\.section-head:hover\s+\.section-num/);
	// 2.2 — section titles swell their Fraunces SOFT axis on hover/focus.
	assert.match(
		indexCss,
		/\.section-head:hover\s+\.section-title[\s\S]*?"SOFT"\s*100/,
	);
	assert.match(indexCss, /\.award-list\s*{[^}]*display:\s*grid/);
	assert.doesNotMatch(indexCss, /column-count:\s*2/);
	assert.match(indexCss, /\.publication-group-title/);
	assert.match(indexCss, /\.publication-group-index/);
	assert.match(indexCss, /\.publication-group-rule/);
	assert.match(indexCss, /\.publication-group-name/);
	assert.match(indexCss, /\.hero-tagline\s*{[^}]*font-style:\s*italic/);
	assert.match(indexCss, /\.publication-group-name\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(indexCss, /\.research-map-node\.leaf\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(indexCss, /\.entry-title\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(indexCss, /\.award-meta\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(indexCss, /\.service-meta\s*{[^}]*font-style:\s*italic/);
	assert.match(contentConfig, /lineage:\s*z[\s\S]*\.object/);
	assert.match(publicationTeaser, /publication-lineage/);
	assert.doesNotMatch(publicationTeaser, /\.publication-meta\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(publicationTeaser, /\.publication-lineage-text\s*{[^}]*font-style:\s*italic/);
	assert.doesNotMatch(publicationTeaser, /translateX\(2px\)/);
	assert.match(publicationTeaser, /background-color 0\.18s ease/);

	assert.match(navbar, /class="site-nav"/);
	assert.match(navbar, /position:\s*sticky/);
	assert.match(navbar, /backdrop-filter:\s*blur/);
	assert.match(navbar, /\.site-nav::after/);
	assert.match(navbar, /nav a::after/);
	assert.match(navbar, /nav a\.active::after/);
	assert.match(navbar, /--nav-item-index/);
	assert.match(navbar, /transition-delay:\s*calc\(var\(--nav-item-index\)/);

	assert.match(resetCss, /prefers-reduced-motion:\s*reduce/);
	assert.match(resetCss, /transition-duration:\s*0\.01ms\s*!important/);
	assert.match(resetCss, /scroll-behavior:\s*auto\s*!important/);

	assert.match(themeToggle, /theme-toggle-glyph/);
	assert.match(themeToggle, /theme-toggle-rays/);
	assert.match(themeToggle, /theme-toggle-moon-body/);
	assert.match(themeToggle, /\.theme-toggle-label\s*{[^}]*position:\s*absolute/);
	assert.doesNotMatch(themeToggle, /lucide/);
});

test("single-column layout accounts for mobile side margins", async () => {
	const layoutGrid = await readRepo("src/components/LayoutGrid.astro");

	assert.ok(layoutGrid, "expected LayoutGrid source");
	assert.match(layoutGrid, /@media screen and \(max-width:\s*640px\)/);
	assert.match(layoutGrid, /\.layout-single\s*{[\s\S]*width:\s*calc\(100%\s*-\s*2rem\)/);
});

test("public-facing repository text omits template traces and keeps footer attribution", async () => {
	const html = await readBuilt("index.html");
	const readme = await readRepo("README.md");
	const packageReadme = await readRepo("package/README.md");
	const packageJson = await readRepo("package.json");
	const layout = await readRepo("src/layouts/Layout.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(readme, "expected README source");
	assert.ok(packageReadme, "expected package README source");
	assert.ok(packageJson, "expected package.json source");
	assert.ok(layout, "expected layout source");

	for (const source of [readme, packageReadme]) {
		assert.doesNotMatch(source, /Spectre/i);
		assert.doesNotMatch(source, /louisescher/i);
		assert.doesNotMatch(source, /StackBlitz|CodeSandbox/i);
		assert.doesNotMatch(source, /template/i);
	}

	for (const source of [html, layout]) {
		assert.doesNotMatch(source, /spectre/i);
	}
	assert.match(
		html,
		/(?:©|&copy;)\s*2026\s*Hengquan Guo\.[\s\S]*Powered by[\s\S]*Codex[\s\S]*Claude Code/,
	);
	assert.match(layout, /Powered by[\s\S]*Codex[\s\S]*Claude Code/);
	assert.doesNotMatch(packageJson, /"name":\s*"spectre"/i);
});

test("repository is configured for GitHub Pages deployment", async () => {
	const astroConfig = await readRepo("astro.config.ts");
	const deployWorkflow = await readRepo(".github/workflows/deploy.yml");

	assert.ok(astroConfig, "expected astro.config.ts");
	assert.match(astroConfig, /site:\s*['"]https:\/\/ghqqqq\.github\.io['"]/i);
	assert.doesNotMatch(astroConfig, /@astrojs\/node/);
	assert.doesNotMatch(astroConfig, /adapter:\s*node/);

	assert.ok(deployWorkflow, "expected GitHub Pages workflow");
	assert.match(deployWorkflow, /withastro\/action@v5/);
	assert.match(deployWorkflow, /actions\/deploy-pages@v4/);
	assert.match(deployWorkflow, /gh-pages|github-pages/i);
});
