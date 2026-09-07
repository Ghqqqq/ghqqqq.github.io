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

test("publications route and homepage navigation expose full publications", async () => {
	const publicationsHtml = await readBuilt("publications/index.html");
	const publicationsPage = await readRepo("src/pages/publications.astro");
	const projectsPage = await readRepo("src/pages/projects.astro");
	const atlasIndexHero = await readRepo("src/components/AtlasIndexHero.astro");
	const atlasIndexCss = await readRepo("src/styles/atlas-index.css");
	const homepageHtml = await readBuilt("index.html");
	const projectsHtml = await readBuilt("projects/index.html");
	const blockProjectHtml = await readBuilt("projects/block/index.html");
	const codexOverleafProjectHtml = await readBuilt("projects/codex-overleaf-link/index.html");

	assert.ok(publicationsHtml, "expected built publications index");
	assert.ok(publicationsPage, "expected publications page source");
	assert.ok(projectsPage, "expected projects page source");
	assert.ok(atlasIndexHero, "expected shared Atlas index hero");
	assert.ok(atlasIndexCss, "expected shared Atlas index stylesheet");
	for (const page of [publicationsPage, projectsPage]) {
		assert.match(page, /import "\.\.\/styles\/atlas-index\.css"/);
		assert.match(page, /import AtlasIndexHero from "\.\.\/components\/AtlasIndexHero\.astro"/);
		assert.match(page, /layout="home"\s+ambient="manuscript"/);
		assert.match(page, /<AtlasIndexHero/);
	}
	assert.match(atlasIndexHero, /class:list=\{\["atlas-index-hero"/);
	assert.match(atlasIndexHero, /data-atlas-index-hero/);
	assert.match(atlasIndexHero, /class="atlas-index-grid" aria-hidden="true"/);
	assert.match(atlasIndexHero, /new IntersectionObserver/);
	assert.match(atlasIndexCss, /\.atlas-index-content\s*{[^}]*--atlas-index-gutter:/);
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
		/\.publication-year-group\s*{[^}]*grid-template-columns:\s*minmax\(5rem,\s*7rem\)\s+minmax\(0,\s*1fr\)/,
	);
	assert.match(publicationsHtml, /class="atlas-index-hero"/);
	assert.match(publicationsHtml, /class="site-nav site-nav-atlas"/);
	assert.match(publicationsHtml, /class="manuscript-layer"/);
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
	assert.match(projectsHtml, /class="atlas-index-hero(?:\s+[^"]*)?"/);
	assert.match(projectsHtml, /class="site-nav site-nav-atlas"/);
	assert.match(projectsHtml, /class="manuscript-layer"/);
	assert.match(projectsHtml, /BLOCK/);
	assert.match(projectsHtml, /Codex Overleaf Link/);
	assert.doesNotMatch(projectsHtml, /Project Placeholder/);
	assert.match(projectsPage, /<AtlasIndexHero[\s\S]*compact/);
	assert.match(projectsHtml, /class="atlas-index-hero atlas-index-hero--compact"/);
	assert.equal(projectsHtml.match(/class="project-index"/g)?.length ?? 0, 2);
	assert.match(projectsPage, /\.projects-list\s*{[^}]*display:\s*flex[^}]*flex-direction:\s*column/);
	assert.match(
		projectsPage,
		/\.project-item\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.6fr\)\s+minmax\(16rem,\s*0\.75fr\)/,
	);
	assert.doesNotMatch(projectsPage, /repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
	assert.match(
		projectsPage,
		/@media screen and \(max-width:\s*760px\)[\s\S]*\.project-item\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
	);
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

test("mobile Navbar progressively enhances while CSP fallback links stay available", async () => {
	const layout = await readRepo("src/layouts/Layout.astro");
	const navbar = await readRepo("src/components/Navbar.astro");

	assert.ok(layout, "expected Layout source");
	assert.ok(navbar, "expected Navbar source");
	const markerIndex = layout.indexOf("data-nav-enhancement");
	const bodyIndex = layout.indexOf("<body");
	assert.notEqual(markerIndex, -1, "expected early navigation enhancement marker");
	assert.ok(markerIndex < bodyIndex, "expected navigation marker before body markup");
	assert.match(
		layout,
		/<script is:inline data-nav-enhancement>[\s\S]*dataset\.navJs\s*=\s*"ready"[\s\S]*<\/script>/,
	);

	const mobileCss = extractCssBlock(navbar, "@media screen and (max-width: 640px)");
	assertCssDeclarations(mobileCss, ':global(html[data-nav-js="ready"]) .site-nav', {
		height: "3.5rem",
		"box-sizing": "border-box",
	});
	assertCssDeclarations(
		mobileCss,
		':global(html[data-nav-js="ready"]) .mobile-nav-toggle',
		{ display: "flex" },
	);
	assertCssDeclarations(mobileCss, ':global(html[data-nav-js="ready"]) .nav-links', {
		position: "absolute",
		opacity: "0",
		visibility: "hidden",
		"pointer-events": "none",
	});
	assertCssDeclarations(
		mobileCss,
		':global(html[data-nav-js="ready"]) .site-nav.active .nav-links',
		{
			opacity: "1",
			visibility: "visible",
			"pointer-events": "auto",
		},
	);
	assertCssDeclarations(mobileCss, ":global(html:not([data-nav-js])) .nav-links", {
		position: "static",
		opacity: "1",
		visibility: "visible",
		"pointer-events": "auto",
	});
	assertCssDeclarations(
		mobileCss,
		":global(html:not([data-nav-js])) .site-nav-atlas",
		{ "margin-bottom": "0" },
	);

	assert.match(navbar, /setAttribute\("aria-hidden", "true"\)/);
	assert.match(navbar, /setAttribute\("inert", ""\)/);
	assert.match(navbar, /removeAttribute\("aria-hidden"\)/);
	assert.match(navbar, /removeAttribute\("inert"\)/);
	assert.match(
		navbar,
		/if \(isActive\)\s*{[^}]*navLinks\.querySelector\("a"\)\?\.focus\(\)/,
	);
	assert.match(navbar, /matchMedia\("\(max-width: 640px\)"\)/);
	assert.match(
		navbar,
		/\.site-nav \.site-title:focus-visible\s*{[^}]*outline:\s*2px solid var\(--primary\)[^}]*outline-offset:\s*4px/,
	);
});

test("homepage link interaction tokens stay inside the Atlas palette", async () => {
	const resetCss = await readRepo("src/styles/reset.css");

	assert.ok(resetCss, "expected reset CSS");
	assertCssDeclarations(resetCss, ":root,\nhtml[data-theme=\"light\"]", {
		"--primary-light": "#8a3e25",
		"--primary-lightest": "#6a2f1c",
	});
	assertCssDeclarations(resetCss, 'html[data-theme="dark"]', {
		"--primary-light": "#e7a384",
		"--primary-lightest": "#f4c5ad",
	});
	assertCssDeclarations(resetCss, "body.page-home", {
		"--primary-light": "var(--home-signal)",
		"--primary-lightest": "var(--home-cobalt-bright)",
	});
	assertCssDeclarations(resetCss, 'html[data-theme="light"] body.page-home', {
		"--primary-light": "var(--home-cobalt)",
		"--primary-lightest": "var(--home-cobalt-bright)",
	});
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
	assert.match(publicationsHtml, /<html[^>]*data-home-hero="passed"/);
	assert.match(
		publicationsHtml,
		/<nav[^>]*class="[^"]*site-nav-atlas[^"]*"[^>]*data-nav-variant="atlas"/,
	);
	assert.match(publicationsHtml, /<meta name="theme-color" content="#1735d6"/);

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
