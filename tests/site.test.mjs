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

async function readRepoBytes(relativePath) {
	try {
		return await readFile(resolve(relativePath));
	} catch {
		return null;
	}
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertCssDeclarations(source, selector, declarations) {
	const rule = source.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`));
	assert.ok(rule, `expected CSS rule for ${selector}`);

	for (const [property, value] of Object.entries(declarations)) {
		assert.match(
			rule[1],
			new RegExp(`(?:^|\\n)\\s*${escapeRegExp(property)}:\\s*${escapeRegExp(value)}\\s*;`),
			`expected ${selector} to declare ${property}: ${value}`,
		);
	}
}

function assertCssDeclarationGroup(source, selectors, declarations) {
	const selectorPattern = selectors.map(escapeRegExp).join("\\s*,\\s*");
	const rule = source.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`));
	assert.ok(rule, `expected CSS rule for ${selectors.join(", ")}`);

	for (const [property, value] of Object.entries(declarations)) {
		assert.match(
			rule[1],
			new RegExp(`(?:^|\\n)\\s*${escapeRegExp(property)}:\\s*${escapeRegExp(value)}\\s*;`),
			`expected ${selectors.join(", ")} to declare ${property}: ${value}`,
		);
	}
}

function extractCssBlock(source, header) {
	const headerIndex = source.indexOf(header);
	assert.notEqual(headerIndex, -1, `expected CSS block for ${header}`);
	const openingBraceIndex = source.indexOf("{", headerIndex + header.length);
	assert.notEqual(openingBraceIndex, -1, `expected ${header} to open a CSS block`);

	let depth = 1;
	for (let index = openingBraceIndex + 1; index < source.length; index += 1) {
		if (source[index] === "{") depth += 1;
		if (source[index] === "}") depth -= 1;
		if (depth === 0) return source.slice(openingBraceIndex + 1, index);
	}

	assert.fail(`expected ${header} to close its CSS block`);
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
	assert.match(html, /class="home-atlas"/);
	assert.match(html, /data-home-atlas/);
	assert.match(html, /data-atlas-hero/);
	assert.match(html, /<h1[^>]*class="atlas-hero-name"[^>]*>\s*Hengquan Guo\s*<\/h1>/);
	assert.match(html, /data-research-atlas/);
	assert.match(html, /aria-label="Research interests"/);
	assert.equal(html.match(/data-research-atlas/g)?.length, 1);
	assert.doesNotMatch(html, /class="research-map"/);
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
	assert.match(html, /2026\.04 - Present/);
	assert.match(
		html,
		/Experience[\s\S]*Analemma[\s\S]*Building the first multi-turn auto-research dataset and developing auto-research workflows across agentic harness design, model training, and research-oriented evaluation\./i,
	);
	assert.doesNotMatch(html, /ideation agent/i);
	assert.match(html, /2025\.06 - 2026\.02/);
	assert.match(
		html,
		/Experience[\s\S]*Research Intern[\s\S]*Reinforcement learning for recommendation and online bidding; produced three research works, with papers accepted at ICLR 2026 and the KDD 2026 ADS Track, and one under submission\./i,
	);
	// Official Tencent wordmark stands in for the leading "Tencent" in the org line.
	assert.match(html, /CDG · Tencent Rhino-Bird Elite Talent Program/);
	assert.match(html, /tencent-wordmark/);
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

test("research atlas data and components expose one shared semantic graph", async () => {
	const atlasData = await readRepo("src/data/research-atlas.ts");
	const atlasComponent = await readRepo("src/components/ResearchAtlas.astro");
	const relayComponent = await readRepo("src/components/ResearchRelay.astro");

	assert.ok(atlasData, "expected research atlas data source");
	assert.ok(atlasComponent, "expected ResearchAtlas component");
	assert.ok(relayComponent, "expected ResearchRelay component");
	assert.match(atlasData, /export const researchAtlas/);
	assert.match(atlasData, /export const homeSections/);
	assert.match(atlasData, /Bandits & Online Learning/);
	assert.match(atlasData, /Safe \/ Constrained Learning/);
	assert.match(atlasData, /Recommendation & Bidding/);
	assert.match(atlasData, /Agentic LLMs/);
	assert.match(atlasComponent, /data-research-atlas/);
	assert.match(atlasComponent, /aria-label=\{researchAtlas\.label\}/);
	assert.match(atlasComponent, /aria-hidden="true"/);
	assert.match(relayComponent, /data-research-relay/);
	assert.match(relayComponent, /data-relay-link/);
	assert.match(relayComponent, /aria-current/);
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
	for (const id of [
		"publications-agent-llm-alignment",
		"publications-recommendation-bidding",
		"publications-reinforcement-learning-bandits",
	]) {
		assert.match(html, new RegExp(`id="${id}"`));
	}
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

test("homepage renders the cobalt atlas hero without legacy visual layers", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");
	const atlasComponent = await readRepo("src/components/ResearchAtlas.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.ok(atlasComponent, "expected Research Atlas source");
	assert.match(html, /class="atlas-hero"/);
	assert.match(html, /class="atlas-hero-portrait"/);
	assert.match(html, /class="atlas-hero-orbit"/);
	assert.match(html, /class="atlas-hero-grid" aria-hidden="true"/);
	assert.match(html, /class="atlas-hero-grid-line/);
	assert.equal(html.match(/<h1(?:\s[^>]*)?>/gi)?.length ?? 0, 1, "expected exactly one h1");
	assert.match(
		html,
		/<p class="atlas-hero-statement">\s*Research as\s*<em>\s*a living atlas\.\s*<\/em>\s*<\/p>/,
	);
	assertCssDeclarations(atlasComponent, ".research-atlas-kicker", {
		opacity: "0.74",
	});

	for (const [label, source] of [
		["built homepage", html],
		["homepage source", indexPage],
	]) {
		const heroOrder = [
			source.indexOf('class="atlas-hero-name"'),
			source.indexOf('class="atlas-hero-statement"'),
			source.indexOf('class="atlas-hero-role"'),
		];
		assert.ok(heroOrder.every((position) => position >= 0), `expected ordered Hero markup in ${label}`);
		assert.deepEqual(
			heroOrder,
			[...heroOrder].sort((left, right) => left - right),
			`expected h1, statement, then role in ${label}`,
		);
	}

	assert.match(indexCss, /--atlas-cobalt:\s*#1735d6/i);
	assert.match(indexCss, /\.atlas-hero\s*{[^}]*background:\s*var\(--atlas-cobalt\)/);
	assert.match(indexCss, /\.atlas-hero-name/);
	assert.match(indexCss, /\.atlas-hero-statement/);
	assert.match(indexCss, /\.atlas-hero-grid/);
	assert.match(indexCss, /\.atlas-hero-name\s*{[^}]*letter-spacing:\s*0/);
	assert.match(indexCss, /\.atlas-hero-statement\s*{[^}]*letter-spacing:\s*0/);

	const atlasHeroCss = indexCss.match(
		/\/\* ---------- Atlas Hero ---------- \*\/([\s\S]*?)\/\* ---------- Sections/,
	);
	assert.ok(atlasHeroCss, "expected a bounded Atlas Hero CSS section");
	assert.doesNotMatch(atlasHeroCss[1], /\b[a-z-]*gradient\s*\(/i);
	assert.doesNotMatch(atlasHeroCss[1], /font-size:\s*[^;]*vw/i);
	const legacyHeroHooks =
		/data-home-motion|data-reveal|data-draw-line|IntersectionObserver|is-active-section/;
	assert.doesNotMatch(html, legacyHeroHooks);
	assert.doesNotMatch([indexPage, indexCss, atlasComponent].join("\n"), legacyHeroHooks);
	assert.doesNotMatch(html, /hero-hairline/);
	assert.doesNotMatch(indexCss, /ghost numerals/i);
	assert.doesNotMatch(indexCss, /\.home > \.hairline::before/);
	assert.doesNotMatch(indexPage, /const researchMap/);
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

test("homepage shell exposes the cobalt dual-surface navigation contract", async (t) => {
	const homeHtml = await readBuilt("index.html");
	const publicationsHtml = await readBuilt("publications/index.html");
	const resetCss = await readRepo("src/styles/reset.css");
	const navbar = await readRepo("src/components/Navbar.astro");
	const layout = await readRepo("src/layouts/Layout.astro");
	const themeToggle = await readRepo("src/components/ThemeToggle.astro");

	assert.ok(homeHtml, "expected built homepage HTML");
	assert.ok(publicationsHtml, "expected built publications HTML");
	assert.ok(resetCss, "expected reset CSS");
	assert.ok(navbar, "expected Navbar source");
	assert.ok(layout, "expected Layout source");
	assert.ok(themeToggle, "expected ThemeToggle source");

	assertCssDeclarations(resetCss, "body.page-home", {
		"--home-cobalt": "#1735d6",
		"--home-cobalt-bright": "#3151ff",
		"--home-signal": "#f5ff65",
		"--home-ink": "#111116",
		"--home-paper": "#f1ece2",
		"--home-text-dark": "#f4f0e8",
		"--home-text-light": "#15151b",
		"--home-surface": "var(--home-ink)",
		"--home-surface-text": "var(--home-text-dark)",
		"--home-surface-muted": "rgba(244, 240, 232, 0.62)",
		"--page-bg": "var(--home-surface)",
		"--text-primary": "var(--home-surface-text)",
		"--text-secondary": "var(--home-surface-muted)",
		"--primary": "var(--home-cobalt-bright)",
		"--primary-rgb": "49, 81, 255",
		background: "var(--home-surface)",
	});
	assertCssDeclarations(resetCss, 'html[data-theme="light"] body.page-home', {
		"--home-surface": "var(--home-paper)",
		"--home-surface-text": "var(--home-text-light)",
		"--home-surface-muted": "rgba(21, 21, 27, 0.62)",
	});

	assert.match(homeHtml, /<html[^>]*data-home-hero="passed"/);
	assert.match(homeHtml, /<nav[^>]*class="[^"]*site-nav-atlas[^"]*"[^>]*data-nav-variant="atlas"/);
	assert.match(homeHtml, /<meta name="theme-color" content="#1735d6"/);
	assert.match(publicationsHtml, /<html[^>]*data-theme="dark"[^>]*>/);
	assert.doesNotMatch(publicationsHtml, /<html[^>]*data-home-hero=/);
	assert.match(publicationsHtml, /<nav[^>]*class="site-nav"[^>]*data-nav-variant="default"/);
	assert.doesNotMatch(publicationsHtml, /class="[^"]*site-nav-atlas/);
	assert.match(publicationsHtml, /<meta name="theme-color" content="#15130f"/);

	assert.match(navbar, /variant\?: "default" \| "atlas"/);
	assert.match(navbar, /data-nav-variant=\{variant\}/);
	assert.match(layout, /data-home-hero=\{layout === "home" \? "passed" : undefined\}/);
	assert.match(layout, /<Navbar variant=\{layout === "home" \? "atlas" : "default"\} \/>/);
	assert.match(layout, /const lightThemeColor = "#f4efe4"/);
	assert.match(layout, /const darkThemeColor = "#15130f"/);
	assert.match(layout, /const initialThemeColor = isHomeLayout \? "#1735d6" : darkThemeColor/);
	assert.match(
		layout,
		/isHomeLayout \? "#1735d6" : theme === "dark" \? darkThemeColor : lightThemeColor/,
	);
	assert.match(themeToggle, /document\.body\.classList\.contains\("page-home"\)/);
	assert.match(
		themeToggle,
		/isAtlasHome \? "#1735d6" : theme === "dark" \? "#15130f" : "#f4efe4"/,
	);

	assertCssDeclarations(navbar, ':global(html[data-home-hero="visible"]) .site-nav-atlas', {
		color: "#ffffff",
		background: "transparent",
		"backdrop-filter": "none",
		"-webkit-backdrop-filter": "none",
	});
	assert.match(
		navbar,
		/:global\(html\[data-home-hero="visible"\]\) \.site-nav-atlas \.site-title,\s*:global\(html\[data-home-hero="visible"\]\) \.site-nav-atlas \.nav-link\s*\{/,
	);
	assertCssDeclarations(
		navbar,
		':global(html[data-home-hero="visible"]) .site-nav-atlas .nav-link',
		{ color: "#ffffff" },
	);
	assertCssDeclarations(navbar, ':global(html[data-home-hero="visible"]) .site-nav-atlas::after', {
		background: "rgba(255, 255, 255, 0.24)",
	});

	const mobileNavbar = extractCssBlock(navbar, "@media screen and (max-width: 640px)");
	await t.test("mobile visible-state dropdown stays on cobalt without blur", () => {
		assertCssDeclarations(
			mobileNavbar,
			':global(html[data-home-hero="visible"]) .site-nav-atlas .nav-links',
			{
				"background-color": "var(--home-cobalt)",
				"backdrop-filter": "none",
				"-webkit-backdrop-filter": "none",
				"border-bottom": "1px solid rgba(255, 255, 255, 0.24)",
			},
		);
		assertCssDeclarations(
			mobileNavbar,
			':global(html[data-home-hero="visible"]) .site-nav-atlas .nav-links li',
			{ "border-top": "1px solid rgba(255, 255, 255, 0.24)" },
		);
		assertCssDeclarations(
			mobileNavbar,
			':global(html[data-home-hero="visible"]) .site-nav-atlas .nav-links li:last-child',
			{ "border-bottom": "1px solid rgba(255, 255, 255, 0.24)" },
		);
	});
	await t.test("mobile visible-state menu control stays white", () => {
		assertCssDeclarations(
			navbar,
			':global(html[data-home-hero="visible"]) .site-nav-atlas .mobile-nav-toggle',
			{
				color: "#ffffff",
				"border-color": "rgba(255, 255, 255, 0.36)",
				"background-color": "rgba(255, 255, 255, 0.08)",
			},
		);
		assertCssDeclarationGroup(
			navbar,
			[
				':global(html[data-home-hero="visible"]) .site-nav-atlas .mobile-nav-toggle:hover',
				':global(html[data-home-hero="visible"]) .site-nav-atlas .mobile-nav-toggle:focus-visible',
			],
			{
				color: "#ffffff",
				"border-color": "rgba(255, 255, 255, 0.56)",
				"background-color": "rgba(255, 255, 255, 0.14)",
			},
		);
	});
	await t.test("visible-state theme control stays white", () => {
		assertCssDeclarations(
			themeToggle,
			':global(html[data-home-hero="visible"]) #theme-toggle',
			{
				color: "#ffffff",
				"border-color": "rgba(255, 255, 255, 0.36)",
				"background-color": "rgba(255, 255, 255, 0.08)",
			},
		);
		assertCssDeclarationGroup(
			themeToggle,
			[
				':global(html[data-home-hero="visible"]) #theme-toggle:hover',
				':global(html[data-home-hero="visible"]) #theme-toggle:focus-visible',
			],
			{
				color: "#ffffff",
				"border-color": "rgba(255, 255, 255, 0.56)",
				"background-color": "rgba(255, 255, 255, 0.14)",
			},
		);
	});

	for (const html of [homeHtml, publicationsHtml]) {
		assert.doesNotMatch(html, /reading-progress|reading-fill/);
	}
	assert.doesNotMatch(navbar, /reading-progress/);
	assert.doesNotMatch(navbar, /@supports\s*\(\s*animation-timeline:\s*scroll\(\)\s*\)/);
	assert.doesNotMatch(navbar, /@keyframes\s+reading-fill/);
});

test("the homepage opts out of the manuscript layer without changing secondary pages", async () => {
	const homeHtml = await readBuilt("index.html");
	const publicationsHtml = await readBuilt("publications/index.html");
	const layout = await readRepo("src/layouts/Layout.astro");
	const layoutGrid = await readRepo("src/components/LayoutGrid.astro");

	assert.ok(homeHtml, "expected built homepage HTML");
	assert.ok(publicationsHtml, "expected built publications HTML");
	assert.ok(layout, "expected Layout source");
	assert.ok(layoutGrid, "expected LayoutGrid source");
	assert.doesNotMatch(homeHtml, /class="manuscript-layer"/);
	assert.match(publicationsHtml, /class="manuscript-layer"/);
	assert.match(homeHtml, /class="main-home"/);
	assert.match(homeHtml, /class="page-home"/);
	assert.match(layout, /ambient\?: "manuscript" \| "none"/);
	assert.match(layoutGrid, /"split" \| "single" \| "home"/);
});

test("social sharing metadata produces valid link previews", async () => {
	const homeHtml = await readBuilt("index.html");
	const publicationsHtml = await readBuilt("publications/index.html");
	const ogImage = await readRepoBytes("public/img/og.png");

	assert.ok(homeHtml, "expected built homepage HTML");
	assert.ok(publicationsHtml, "expected built publications index");
	assert.ok(ogImage, "expected OG card image");

	// Open Graph tags use property= (the spec attribute), never name=.
	assert.doesNotMatch(homeHtml, /<meta name="og:/);
	assert.doesNotMatch(publicationsHtml, /<meta name="og:/);
	assert.match(homeHtml, /<meta property="og:title" content="Hengquan Guo"/);

	// og:image / twitter:image must be absolute URLs for scrapers to resolve them.
	assert.match(
		homeHtml,
		/<meta property="og:image" content="https:\/\/ghqqqq\.github\.io\/img\/og\.png"/,
	);
	assert.match(
		homeHtml,
		/<meta name="twitter:image" content="https:\/\/ghqqqq\.github\.io\/img\/og\.png"/,
	);
	assert.match(homeHtml, /<meta name="twitter:card"/);

	// og:url points at the page being shared, not the site root everywhere.
	assert.match(
		homeHtml,
		/<meta property="og:url" content="https:\/\/ghqqqq\.github\.io\/"/,
	);
	assert.match(
		publicationsHtml,
		/<meta property="og:url" content="https:\/\/ghqqqq\.github\.io\/publications\/"/,
	);

	// The card itself: 1200×630 PNG under 200KB (not the upstream template banner).
	assert.ok(ogImage.length < 200_000, `og.png is ${ogImage.length} bytes, expected < 200000`);
	const pngWidth = ogImage.readUInt32BE(16);
	const pngHeight = ogImage.readUInt32BE(20);
	assert.equal(pngWidth, 1200, "og.png width");
	assert.equal(pngHeight, 630, "og.png height");
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
