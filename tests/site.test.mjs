import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function readBuilt(relativePath) {
	for (const basePath of [resolve("dist", relativePath), resolve("dist", "client", relativePath)]) {
		try {
			return await readFile(basePath, "utf8");
		} catch {}
	}

	return null;
}

async function readBuiltStylesheets(html) {
	const stylesheetPaths = Array.from(
		html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+\.css)"/g),
		([, href]) => href,
	).filter((href) => href.startsWith("/"));
	const stylesheets = await Promise.all(
		stylesheetPaths.map((href) => readBuilt(href.slice(1))),
	);

	assert.ok(stylesheets.length > 0, "expected built local stylesheets");
	assert.ok(
		stylesheets.every(Boolean),
		"expected every built stylesheet to be readable",
	);
	return stylesheets.join("\n");
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

function decodeHtmlEntities(value) {
	const namedEntities = {
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		nbsp: " ",
		quot: '"',
	};

	return value.replace(
		/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
		(entity, decimal, hexadecimal, named) => {
			const codePoint = decimal
				? Number.parseInt(decimal, 10)
				: hexadecimal
					? Number.parseInt(hexadecimal, 16)
					: null;
			if (codePoint !== null) {
				try {
					return String.fromCodePoint(codePoint);
				} catch {
					return entity;
				}
			}

			return namedEntities[named.toLowerCase()] ?? entity;
		},
	);
}

function normalizeVisibleHtml(value) {
	return decodeHtmlEntities(
		value
			.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
			.replace(/<!--[\s\S]*?-->/g, " ")
			.replace(/<[^>]*>/g, " "),
	)
		.replace(/\s+/g, " ")
		.trim();
}

function classAttributePattern(className) {
	const token = escapeRegExp(className);
	return `\\sclass\\s*=\\s*(?:"(?:[^"]*\\s)?${token}(?:\\s[^"]*)?"|'(?:[^']*\\s)?${token}(?:\\s[^']*)?')`;
}

function elementByClassRegExp(className, tagName = null, flags = "gi") {
	const tagPattern = tagName ? escapeRegExp(tagName) : "[a-z][\\w:-]*";
	return new RegExp(
		`<(${tagPattern})\\b(?=[^>]*${classAttributePattern(className)})[^>]*>([\\s\\S]*?)<\\/\\1>`,
		flags,
	);
}

function extractElementsByClass(html, className, tagName = null) {
	return Array.from(
		html.matchAll(elementByClassRegExp(className, tagName)),
		([, tag, contents]) => ({ contents, tag }),
	);
}

function splitAwardMeta(meta, year) {
	const compactMeta = meta?.trim();
	const yearLabel = year
		? String(year)
		: compactMeta && /^\d{4}\s*-\s*\d{4}$/.test(compactMeta)
			? compactMeta
			: undefined;
	const inlineMeta = yearLabel === compactMeta ? undefined : compactMeta;

	return { inlineMeta, yearLabel };
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

function extractBaseCss(source) {
	let baseCss = "";
	let cursor = 0;

	while (cursor < source.length) {
		const mediaIndex = source.indexOf("@media", cursor);
		if (mediaIndex === -1) return baseCss + source.slice(cursor);
		baseCss += source.slice(cursor, mediaIndex);

		const openingBraceIndex = source.indexOf("{", mediaIndex);
		assert.notEqual(openingBraceIndex, -1, "expected @media to open a CSS block");
		let depth = 1;
		let closingBraceIndex = openingBraceIndex + 1;
		for (; closingBraceIndex < source.length; closingBraceIndex += 1) {
			if (source[closingBraceIndex] === "{") depth += 1;
			if (source[closingBraceIndex] === "}") depth -= 1;
			if (depth === 0) break;
		}
		assert.equal(depth, 0, "expected @media to close its CSS block");
		cursor = closingBraceIndex + 1;
	}

	return baseCss;
}

function extractSectionById(html, id) {
	const section = html.match(
		new RegExp(
			`<section\\b(?=[^>]*\\bid="${escapeRegExp(id)}")[^>]*>[\\s\\S]*?<\\/section>`,
		),
	);
	assert.ok(section, `expected built section #${id}`);
	return section[0];
}

function assertAwardsContract(awardsHtml, expectedTuples) {
	const awardItems = extractElementsByClass(awardsHtml, "award-item", "li");
	assert.equal(
		awardItems.length,
		expectedTuples.length,
		"expected rendered award item count to match awards data",
	);

	const renderedTuples = awardItems.map(({ contents: item }, index) => {
		const title = extractElementsByClass(item, "award-title");
		const sub = extractElementsByClass(item, "award-sub");
		assert.equal(title.length, 1, `expected award ${index + 1} title`);
		assert.equal(sub.length, 1, `expected award ${index + 1} metadata wrapper`);
		const meta = extractElementsByClass(sub[0].contents, "award-meta");
		const year = extractElementsByClass(sub[0].contents, "award-year");
		assert.ok(meta.length <= 1, `expected at most one award ${index + 1} inline metadata`);
		assert.equal(year.length, 1, `expected award ${index + 1} year`);

		return [
			normalizeVisibleHtml(title[0].contents),
			meta.length === 0 ? null : normalizeVisibleHtml(meta[0].contents),
			normalizeVisibleHtml(year[0].contents),
		];
	});

	assert.deepEqual(
		renderedTuples,
		expectedTuples,
		"expected rendered award display tuples in stable year-descending order",
	);
}

function createAtlasControllerFixture({
	hasIntersectionObserver,
	hasHero = true,
	hasRoot = true,
	queryThrows = false,
	readyState = "complete",
}) {
	class FixtureElement {
		constructor(attributes = {}) {
			this.attributes = new Map(Object.entries(attributes));
			this.dataset = {};
			this.textContent = "";
		}

		getAttribute(name) {
			return this.attributes.get(name) ?? null;
		}

		setAttribute(name, value) {
			this.attributes.set(name, value);
		}

		removeAttribute(name) {
			this.attributes.delete(name);
		}
	}

	const hero = new FixtureElement({ "data-atlas-hero": "" });
	const sections = [
		["about", "Research core"],
		["experience", "Field work"],
		["awards", "Recognition"],
		["service", "Community"],
		["publications", "Research branches"],
	].map(
		([id, context]) =>
			new FixtureElement({
				"data-home-section": id,
				"data-section-context": context,
			}),
	);
	const publicationGroups = [
		["agent-llm-alignment", "Agent / LLM Alignment"],
		["recommendation-bidding", "Recommendation & Bidding"],
		["reinforcement-learning-bandits", "Reinforcement Learning & Bandits"],
	].map(
		([id, context]) =>
			new FixtureElement({
				"data-publication-group": id,
				"data-publication-context": context,
			}),
	);
	const relayLinks = sections.map(
		(section) =>
			new FixtureElement({ "data-relay-link": section.getAttribute("data-home-section") }),
	);
	const context = new FixtureElement({ "data-relay-context": "" });
	const root = new FixtureElement({ "data-home-atlas": "" });
	root.querySelector = (selector) => {
		if (selector === "[data-atlas-hero]") return hasHero ? hero : null;
		if (selector === "[data-relay-context]") return context;
		return null;
	};
	root.querySelectorAll = (selector) => {
		if (selector === "[data-home-section]") return sections;
		if (selector === "[data-publication-group]") return publicationGroups;
		if (selector === "[data-relay-link]") return relayLinks;
		return [];
	};

	const documentElement = new FixtureElement();
	const eventListeners = new Map();
	const document = {
		documentElement,
		readyState,
		addEventListener(type, callback) {
			const listeners = eventListeners.get(type) ?? [];
			listeners.push(callback);
			eventListeners.set(type, listeners);
		},
		querySelector(selector) {
			if (queryThrows) throw new Error("fixture query failure");
			return selector === "[data-home-atlas]" && hasRoot ? root : null;
		},
	};
	const fireDOMContentLoaded = () => {
		document.readyState = "complete";
		for (const listener of eventListeners.get("DOMContentLoaded") ?? []) listener();
	};
	const observers = [];
	class FixtureIntersectionObserver {
		constructor(callback, options) {
			this.callback = callback;
			this.options = options;
			this.targets = [];
			observers.push(this);
		}

		observe(target) {
			this.targets.push(target);
		}
	}

	const window = hasIntersectionObserver
		? { IntersectionObserver: FixtureIntersectionObserver }
		: {};

	return {
		context,
		document,
		eventListeners,
		fireDOMContentLoaded,
		hero,
		HTMLElement: FixtureElement,
		IntersectionObserver: FixtureIntersectionObserver,
		observers,
		publicationGroups,
		relayLinks,
		root,
		sections,
		window,
	};
}

function findObserver(fixture, targets, options) {
	const observer = fixture.observers.find(
		(candidate) =>
			candidate.targets.length === targets.length &&
			candidate.targets.every((target, index) => target === targets[index]) &&
			Object.entries(options).every(
				([name, value]) => candidate.options[name] === value,
			),
	);

	assert.ok(observer, `expected observer for ${targets.length} target(s)`);
	assert.deepEqual({ ...observer.options }, options);
	return observer;
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
	assert.match(
		html,
		/<p class="about-manifesto">\s*Learning under\s*<em>constraints, feedback,<\/em>\s*and changing environments\.\s*<\/p>/,
	);
	assert.match(
		html,
		/Learning under\s*<em>constraints, feedback,<\/em>\s*and changing environments\./,
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
		/Agent \/ LLM Alignment[\s\S]*publication-teaser atlas[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding[\s\S]*publication-teaser atlas[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits[\s\S]*publication-teaser atlas/,
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

test("homepage publications use the atlas index variant without changing the archive", async () => {
	const homeHtml = await readBuilt("index.html");
	const publicationsHtml = await readBuilt("publications/index.html");
	const teaser = await readRepo("src/components/PublicationTeaser.astro");
	const homepage = await readRepo("src/pages/index.astro");
	const homeStyles = await readRepo("src/styles/index.css");

	assert.ok(homeHtml, "expected built homepage HTML");
	assert.ok(publicationsHtml, "expected built publications HTML");
	assert.ok(teaser, "expected PublicationTeaser source");
	assert.ok(homepage, "expected homepage source");
	assert.ok(homeStyles, "expected homepage stylesheet source");
	assert.match(teaser, /"compact" \| "full" \| "list" \| "atlas"/);

	const homeTeaserVariants = Array.from(
		homeHtml.matchAll(/<article class="publication-teaser ([^"]+)"[^>]*>/g),
		([, variant]) => variant,
	);
	const archiveTeaserVariants = Array.from(
		publicationsHtml.matchAll(/<article class="publication-teaser ([^"]+)"[^>]*>/g),
		([, variant]) => variant,
	);
	const atlasArticles = Array.from(
		homeHtml.matchAll(
			/<article class="publication-teaser atlas"[^>]*>([\s\S]*?)<\/article>/g,
		),
		([, article]) => article,
	);
	const archiveArticles = Array.from(
		publicationsHtml.matchAll(
			/<article class="publication-teaser list"[^>]*>([\s\S]*?)<\/article>/g,
		),
		([, article]) => article,
	);

	assert.ok(homeTeaserVariants.length > 0, "expected homepage publication teasers");
	assert.ok(archiveTeaserVariants.length > 0, "expected archive publication teasers");
	assert.ok(homeTeaserVariants.every((variant) => variant === "atlas"));
	assert.ok(archiveTeaserVariants.every((variant) => variant === "list"));
	assert.equal(atlasArticles.length, homeTeaserVariants.length);
	assert.equal(archiveArticles.length, archiveTeaserVariants.length);
	assert.equal(
		(homeHtml.match(/class="publication-atlas-year"/g) ?? []).length,
		atlasArticles.length,
	);
	assert.equal(
		(homeHtml.match(/class="publication-atlas-venue"/g) ?? []).length,
		atlasArticles.length,
	);
	for (const article of atlasArticles) {
		assert.equal((article.match(/class="publication-atlas-year"/g) ?? []).length, 1);
		assert.equal((article.match(/class="publication-atlas-venue"/g) ?? []).length, 1);
		assert.doesNotMatch(article, /publication-cover(?:-link)?|post-date/);
	}
	for (const article of archiveArticles) {
		assert.equal((article.match(/class="post-date"/g) ?? []).length, 1);
		assert.doesNotMatch(article, /publication-atlas-(?:year|venue)/);
	}
	assert.doesNotMatch(publicationsHtml, /class="publication-teaser atlas"/);
	assert.doesNotMatch(publicationsHtml, /class="publication-atlas-(?:year|venue)"/);

	assert.equal((homeHtml.match(/class="publication-lineage"/g) ?? []).length, 1);
	assert.doesNotMatch(publicationsHtml, /class="publication-lineage"/);
	assert.match(teaser, /showLineage\?: boolean/);
	assert.match(teaser, /showLineage = false/);
	assert.match(
		teaser,
		/const lineage = showLineage \? publication\.data\.lineage : undefined/,
	);
	assert.match(homepage, /variant="atlas"[\s\S]*showLineage=\{true\}/);

	assert.doesNotMatch(teaser, /translateX\(/);
	assert.match(
		teaser,
		/\.publication-teaser\.atlas:has\(\.publication-main-link:hover\)[\s\S]*background:\s*transparent/,
	);
	assert.match(
		teaser,
		/\.publication-teaser\.atlas:has\(\.publication-main-link:focus-visible\)::before/,
	);
	assert.match(teaser, /\.publication-teaser\.atlas::before\s*{[^}]*width:\s*2px/);
	assert.match(
		teaser,
		/:global\(html\[data-theme="dark"\]\) \.publication-atlas-year\s*{[^}]*color:\s*var\(--atlas-signal\)/,
	);
	assert.match(
		teaser,
		/:global\(html\[data-theme="light"\]\) \.publication-atlas-year\s*{[^}]*color:\s*var\(--atlas-cobalt\)/,
	);
	assert.match(
		teaser,
		/:global\(html\[data-theme="dark"\]\)[\s\S]*\.publication-teaser\.atlas \.publication-main-link:hover h3,[\s\S]*color:\s*var\(--atlas-signal\)/,
	);
	assert.match(
		teaser,
		/:global\(html\[data-theme="light"\]\)[\s\S]*\.publication-teaser\.atlas \.publication-main-link:hover h3,[\s\S]*color:\s*var\(--atlas-cobalt\)/,
	);
	const teaserLetterSpacings = Array.from(
		teaser.matchAll(/letter-spacing:\s*([^;]+);/g),
		([, value]) => value.trim(),
	);
	assert.ok(teaserLetterSpacings.length > 0);
	assert.ok(teaserLetterSpacings.every((value) => value === "0"));
	assert.match(
		teaser,
		/@media screen and \(max-width:\s*640px\)[\s\S]*\.publication-teaser\.atlas\s*{[^}]*grid-template-columns:\s*3\.5rem minmax\(0,\s*1fr\)/,
	);
	assert.match(
		teaser,
		/@media screen and \(max-width:\s*640px\)[\s\S]*\.publication-teaser\.atlas \.publication-atlas-venue\s*{[^}]*grid-column:\s*2/,
	);

	assert.doesNotMatch(homeStyles, /\.publication-group::before/);
	assert.doesNotMatch(homeStyles, /\.publication-group:(?:hover|focus-within)/);
	assert.match(homeStyles, /\.publication-group-rule\s*{[^}]*display:\s*none/);
	assert.match(
		homeStyles,
		/\.publication-group-index\s*{[^}]*letter-spacing:\s*0[^}]*color:\s*var\(--atlas-signal\)/,
	);
	assert.match(
		homeStyles,
		/html\[data-theme="light"\] \.publication-group-index\s*{[^}]*color:\s*var\(--atlas-cobalt\)/,
	);
	const groupNameRule = homeStyles.match(/\.publication-group-name\s*{([^}]*)}/)?.[1];
	assert.ok(groupNameRule, "expected publication group name rule");
	assert.match(groupNameRule, /font-size:\s*2\.25rem/);
	assert.match(groupNameRule, /font-style:\s*italic/);
	assert.match(groupNameRule, /letter-spacing:\s*0/);
	assert.doesNotMatch(groupNameRule, /clamp\(|vw/);
	assert.match(
		homeStyles,
		/@media screen and \(max-width:\s*1100px\)[\s\S]*\.publication-group-name\s*{[^}]*font-size:\s*2rem/,
	);
	assert.match(
		homeStyles,
		/@media screen and \(max-width:\s*640px\)[\s\S]*\.publication-group-name\s*{[^}]*font-size:\s*1\.65rem/,
	);

	assert.match(homeHtml, /ArXiv preprint/);
	assert.match(homeHtml, /Advances in Neural Information Processing Systems \(NeurIPS 2025\)/);
	assert.match(homeHtml, /International Conference on Learning Representations \(ICLR 2025\)/);
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
		/data-home-motion|data-reveal|data-draw-line|is-active-section|\b(?:revealObserver|lineObserver|sectionHeads)\b/;
	assert.doesNotMatch(html, legacyHeroHooks);
	assert.doesNotMatch([indexPage, indexCss, atlasComponent].join("\n"), legacyHeroHooks);
	assert.doesNotMatch(html, /hero-hairline/);
	assert.doesNotMatch(indexCss, /ghost numerals/i);
	assert.doesNotMatch(indexCss, /\.home > \.hairline::before/);
	assert.doesNotMatch(indexPage, /const researchMap/);
});

test("homepage uses spacing-led reading sections and a cobalt awards chapter", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");
	const layout = await readRepo("src/layouts/Layout.astro");
	const awardsSource = await readRepo("src/content/awards.json");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.ok(layout, "expected layout source");
	assert.ok(awardsSource, "expected awards data source");

	const homeArticle = html.match(
		/<article class="home-atlas"[^>]*>[\s\S]*?<\/article>/,
	);
	assert.ok(homeArticle, "expected built homepage article");
	const manifestoSentence =
		"Learning under constraints, feedback, and changing environments.";
	const homeArticleText = normalizeVisibleHtml(homeArticle[0]);
	assert.equal(
		homeArticleText.match(new RegExp(escapeRegExp(manifestoSentence), "g"))?.length ?? 0,
		1,
		"expected manifesto sentence exactly once in visible homepage article text",
	);
	const manifestoMarkup =
		/<p class="about-manifesto">\s*Learning under\s*<em>constraints, feedback,<\/em>\s*and changing environments\.\s*<\/p>/g;
	assert.equal(html.match(/class="about-manifesto"/g)?.length ?? 0, 1);
	assert.equal(
		html.match(manifestoMarkup)?.length ?? 0,
		1,
		"expected one exact built manifesto paragraph",
	);
	assert.doesNotMatch([html, indexPage, indexCss].join("\n"), /about-pull-quote/);
	assert.doesNotMatch(
		[html, indexPage].join("\n"),
		/<blockquote\b[^>]*>[\s\S]*?Learning under[\s\S]*?changing environments\.[\s\S]*?<\/blockquote>/i,
	);
	assert.match(
		html,
		/class="home-section home-section--blue"[^>]*id="awards"/,
	);

	const awardsData = JSON.parse(awardsSource);
	assert.ok(Array.isArray(awardsData), "expected awards data array");
	assert.equal(awardsData.length, 8, "expected exactly eight awards in source data");
	const expectedAwardTuples = [...awardsData]
		.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
		.map((award) => {
			const { inlineMeta, yearLabel } = splitAwardMeta(award.meta, award.year);
			return [award.title, inlineMeta ?? null, yearLabel ?? null];
		});
	const awardsSection = extractSectionById(html, "awards");
	assert.doesNotMatch(awardsSection, /id="service"|class="[^"]*service/);
	assertAwardsContract(awardsSection, expectedAwardTuples);
	const awardsWithFlexibleMarkup = awardsSection
		.replace('class="award-item"', 'class="featured award-item pinned"')
		.replace(
			/<div class="award-title">([\s\S]*?)<\/div>/,
			'<h3 class="featured award-title compact">$1</h3>',
		)
		.replace('class="award-sub"', 'class="award-sub compact"')
		.replace('class="award-meta"', 'class="signal award-meta"')
		.replace('class="award-year"', 'class="award-year muted"');
	assert.doesNotThrow(() =>
		assertAwardsContract(awardsWithFlexibleMarkup, expectedAwardTuples),
	);
	const awardsWithOneItemRemoved = awardsSection.replace(
		elementByClassRegExp("award-item", "li", "i"),
		"",
	);
	assert.throws(
		() => assertAwardsContract(awardsWithOneItemRemoved, expectedAwardTuples),
		/expected rendered award item count to match awards data/,
	);
	const awardsWithCorruptedMetadata = awardsSection.replace("Top 25%", "Top 20%");
	assert.throws(
		() => assertAwardsContract(awardsWithCorruptedMetadata, expectedAwardTuples),
		/expected rendered award display tuples in stable year-descending order/,
	);

	const awardsLoopStart = indexPage.indexOf("sortedAwards.map((award) => {");
	const awardsLoopEnd = indexPage.indexOf("</ul>", awardsLoopStart);
	assert.notEqual(awardsLoopStart, -1, "expected unchanged sorted awards loop");
	assert.notEqual(awardsLoopEnd, -1, "expected awards loop closing list");
	const awardsLoopSource = indexPage.slice(awardsLoopStart, awardsLoopEnd);
	for (const className of [
		"award-item",
		"award-title",
		"award-sub",
		"award-meta",
		"award-year",
	]) {
		assert.match(
			awardsLoopSource,
			new RegExp(`class="${className}"`),
			`expected awards loop to retain .${className}`,
		);
	}

	assert.match(indexCss, /--atlas-cobalt:\s*#1735d6/i);
	assert.match(
		indexCss,
		/\.home-section--blue\s*{[^}]*background:\s*var\(--atlas-cobalt\)/,
	);
	assertCssDeclarations(indexCss, ".award-item", {
		border: "0",
		"border-radius": "0",
		"box-shadow": "none",
	});
	assertCssDeclarationGroup(
		indexCss,
		[
			".home-section--blue .section-num",
			".home-section--blue .award-meta",
			".home-section--blue .award-year",
		],
		{ color: "var(--atlas-signal)" },
	);

	assert.doesNotMatch(homeArticle[0], /<hr class="hairline"/);
	assert.doesNotMatch(indexPage, /<hr class="hairline"/);
	const builtFooter = html.match(
		/<footer\b(?=[^>]*class="[^"]*site-footer)[^>]*>[\s\S]*?<\/footer>/,
	);
	assert.ok(builtFooter, "expected built homepage footer");
	assert.match(builtFooter[0], /<hr class="hairline"\s*\/?>/);
	assert.match(layout, /<footer\b[\s\S]*?<hr class="hairline"\s*\/?>[\s\S]*?<\/footer>/);
	assert.doesNotMatch(indexCss, /\.prose > p:first-of-type::first-letter/);
	assert.doesNotMatch(indexCss, /\.section-head:hover|\.section-head:focus-within/);

	assert.match(
		indexCss,
		/\.home-section\s*{[^}]*scroll-margin-top:\s*calc\(\s*var\(--home-nav-offset\)\s*\+\s*var\(--home-relay-height\)\s*\+\s*0\.75rem\s*\)/,
	);
	const desktopSectionCss = extractCssBlock(
		indexCss,
		"@media screen and (min-width: 861px)",
	);
	assert.match(
		desktopSectionCss,
		/\.section-head\s*{[^}]*position:\s*sticky[^}]*top:\s*calc\(\s*var\(--home-nav-offset\)\s*\+\s*var\(--home-relay-height\)\s*\+\s*0\.75rem\s*\)/,
	);

	const readingSystemCss = indexCss.match(
		/\/\* ---------- Sections \(spacing-led reading system\) ---------- \*\/([\s\S]*?)\/\* ---------- Publications/,
	);
	assert.ok(readingSystemCss, "expected a bounded reading-system CSS section");
	const baseReadingCss = extractBaseCss(readingSystemCss[1]);
	assert.doesNotMatch(baseReadingCss, /@media/);
	assert.match(
		baseReadingCss,
		/\.award-list\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
	);
	const mobileReadingCss = extractCssBlock(
		readingSystemCss[1],
		"@media screen and (max-width: 640px)",
	);
	assert.match(
		mobileReadingCss,
		/\.award-list\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
	);
	assert.doesNotMatch(readingSystemCss[1], /font-size:\s*[^;]*vw/i);
	const readingLetterSpacing = Array.from(
		readingSystemCss[1].matchAll(/letter-spacing:\s*([^;]+);/gi),
		([, value]) => value.trim(),
	);
	assert.ok(readingLetterSpacing.length > 0, "expected reading-system letter spacing declarations");
	assert.ok(
		readingLetterSpacing.every((value) => value === "0"),
		`expected zero reading-system letter spacing, received ${readingLetterSpacing.join(", ")}`,
	);
	assert.match(
		readingSystemCss[1],
		/\.about-manifesto em\s*{[^}]*font-style:\s*normal/,
	);
});

test("atlas relay tracks hero, section, and publication-group state", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");
	const relayComponent = await readRepo("src/components/ResearchRelay.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.ok(relayComponent, "expected ResearchRelay source");
	assert.match(html, /data-research-relay/);
	assert.match(html, /<html[^>]*data-home-hero="passed"/);
	const sourceControllerIndex = indexPage.indexOf("data-atlas-controller");
	const sourceArticleIndex = indexPage.indexOf(
		'<article class="home-atlas" data-home-atlas>',
	);
	const sourceRelayIndex = indexPage.indexOf("<ResearchRelay");
	assert.notEqual(sourceControllerIndex, -1, "expected inline Atlas controller marker");
	assert.ok(
		sourceControllerIndex < sourceArticleIndex && sourceControllerIndex < sourceRelayIndex,
		"expected Atlas controller before article and Relay markup",
	);
	assert.equal(indexPage.match(/data-atlas-controller/g)?.length ?? 0, 1);
	assert.doesNotMatch(indexPage, /data-atlas-boot/);
	const builtControllerIndex = html.indexOf("data-atlas-controller");
	const builtArticleIndex = html.indexOf('<article class="home-atlas" data-home-atlas>');
	const builtRelayIndex = html.indexOf("data-research-relay");
	assert.notEqual(builtControllerIndex, -1, "expected built Atlas controller marker");
	assert.ok(
		builtControllerIndex < builtArticleIndex && builtControllerIndex < builtRelayIndex,
		"expected built Atlas controller before article and Relay markup",
	);
	assert.equal(html.match(/data-atlas-controller/g)?.length ?? 0, 1);
	assert.doesNotMatch(html, /data-atlas-boot/);
	const builtRoot = html.match(/<article[^>]*data-home-atlas[^>]*>/);
	assert.ok(builtRoot, "expected built home Atlas root");
	assert.doesNotMatch(builtRoot[0], /data-hero-state/);

	const expectedSections = [
		["about", "Research core"],
		["experience", "Field work"],
		["awards", "Recognition"],
		["service", "Community"],
		["publications", "Research branches"],
	];
	assert.equal(html.match(/data-home-section=/g)?.length ?? 0, expectedSections.length);
	for (const [id, context] of expectedSections) {
		assert.match(
			html,
			new RegExp(
				`<section[^>]*id="${escapeRegExp(id)}"[^>]*data-home-section="${escapeRegExp(id)}"[^>]*data-section-context="${escapeRegExp(context)}"[^>]*>`,
			),
		);
		assert.match(html, new RegExp(`href="#${escapeRegExp(id)}"`));
	}

	const expectedPublicationGroups = [
		["agent-llm-alignment", "Agent / LLM Alignment"],
		["recommendation-bidding", "Recommendation &#38; Bidding"],
		["reinforcement-learning-bandits", "Reinforcement Learning &#38; Bandits"],
	];
	assert.equal(
		html.match(/data-publication-group=/g)?.length ?? 0,
		expectedPublicationGroups.length,
	);
	for (const [id, context] of expectedPublicationGroups) {
		assert.match(
			html,
			new RegExp(
				`<section[^>]*id="publications-${escapeRegExp(id)}"[^>]*data-publication-group="${escapeRegExp(id)}"[^>]*data-publication-context="${escapeRegExp(context)}"[^>]*>`,
			),
		);
	}

	assert.match(indexPage, /new IntersectionObserver/);
	assert.equal(indexPage.match(/new IntersectionObserver/g)?.length ?? 0, 2);
	assert.doesNotMatch(indexPage, /queueMicrotask|[Gg]eneration|setTimeout/);
	assert.match(
		relayComponent,
		/sections:\s*readonly\s*\[HomeSection,\s*\.\.\.HomeSection\[\]\]/,
	);
	assertCssDeclarations(indexCss, ".home-atlas", {
		"--home-nav-offset": "3.5rem",
		"--home-relay-height": "3.75rem",
	});
	assertCssDeclarations(indexCss, ".research-relay", {
		position: "sticky",
		top: "var(--home-nav-offset)",
		"min-height": "var(--home-relay-height)",
		opacity: "0",
		visibility: "hidden",
		"pointer-events": "none",
	});
	assert.match(
		indexCss,
		/\.research-relay\s*{[^}]*-webkit-backdrop-filter:\s*blur\(18px\)[^}]*backdrop-filter:\s*blur\(18px\)/,
	);
	assertCssDeclarationGroup(
		indexCss,
		[
			"html:not([data-atlas-js]) .research-relay",
			'.home-atlas[data-hero-state="passed"] .research-relay',
		],
		{
			opacity: "1",
			transform: "none",
			visibility: "visible",
			"pointer-events": "auto",
		},
	);
	assert.doesNotMatch(
		indexCss,
		/html\[data-home-hero=[^\]]+\]\s+\.research-relay/,
	);
	assert.match(
		indexCss,
		/\.home-section\s*{[^}]*scroll-margin-top:\s*calc\(\s*var\(--home-nav-offset\)\s*\+\s*var\(--home-relay-height\)\s*\+\s*0\.75rem\s*\)/,
	);
	const desktopSectionCss = extractCssBlock(
		indexCss,
		"@media screen and (min-width: 861px)",
	);
	assert.match(
		desktopSectionCss,
		/\.section-head\s*{[^}]*position:\s*sticky[^}]*top:\s*calc\(\s*var\(--home-nav-offset\)\s*\+\s*var\(--home-relay-height\)\s*\+\s*0\.75rem\s*\)/,
	);
	assert.match(indexCss, /\.research-relay-context\s*{[^}]*letter-spacing:\s*0/);
	assertCssDeclarations(indexCss, ".research-relay-title", {
		color: "var(--home-surface-text)",
	});
	assertCssDeclarations(indexCss, ".research-relay-track a", {
		color: "var(--home-surface-muted)",
	});
	assertCssDeclarations(indexCss, '.research-relay-track a[aria-current="location"]', {
		color: "var(--home-surface-text)",
	});
	assertCssDeclarations(indexCss, ".research-relay-context", {
		color: "var(--home-surface-text)",
	});

	const builtCss = await readBuiltStylesheets(html);
	assert.match(
		builtCss,
		/\.research-relay\{[^}]*opacity:0[^}]*visibility:hidden[^}]*pointer-events:none/,
	);
	assert.match(
		builtCss,
		/html:not\(\[data-atlas-js\]\) \.research-relay,\.home-atlas\[data-hero-state=passed\] \.research-relay\{[^}]*opacity:1[^}]*visibility:visible[^}]*pointer-events:auto/,
	);
	assert.doesNotMatch(
		builtCss,
		/html\[data-home-hero=passed\] \.research-relay/,
	);

	const controllerMatch = indexPage.match(
		/<script is:inline data-atlas-controller>\s*([\s\S]*?)\s*<\/script>/,
	);
	assert.ok(controllerMatch, "expected inline Atlas controller");
	assert.match(controllerMatch[1], /dataset\.atlasJs\s*=\s*"booting"/);
	assert.match(controllerMatch[1], /dataset\.atlasJs\s*=\s*"ready"/);
	assert.match(controllerMatch[1], /readyState\s*===\s*"loading"/);
	assert.match(controllerMatch[1], /addEventListener\(\s*"DOMContentLoaded"/);

	const loading = createAtlasControllerFixture({
		hasIntersectionObserver: true,
		readyState: "loading",
	});
	runInNewContext(controllerMatch[1], loading);
	assert.equal(loading.document.documentElement.dataset.atlasJs, "booting");
	assert.equal(loading.document.documentElement.dataset.homeHero, "visible");
	assert.equal(loading.observers.length, 0);
	assert.equal(loading.eventListeners.get("DOMContentLoaded")?.length, 1);
	loading.fireDOMContentLoaded();
	assert.equal(loading.document.documentElement.dataset.atlasJs, "ready");
	assert.equal(loading.observers.length, 2);

	const fallback = createAtlasControllerFixture({ hasIntersectionObserver: false });
	runInNewContext(controllerMatch[1], fallback);
	assert.equal(fallback.document.documentElement.dataset.atlasJs, "ready");
	assert.equal(fallback.document.documentElement.dataset.homeHero, "passed");
	assert.equal(fallback.root.dataset.heroState, "passed");
	assert.equal(fallback.root.dataset.activeSection, "about");
	assert.equal(
		fallback.relayLinks.filter((link) => link.getAttribute("aria-current") === "location")
			.length,
		1,
	);

	const observed = createAtlasControllerFixture({ hasIntersectionObserver: true });
	runInNewContext(controllerMatch[1], observed);
	assert.equal(observed.observers.length, 2);
	assert.equal(observed.document.documentElement.dataset.atlasJs, "ready");
	assert.equal(observed.document.documentElement.dataset.homeHero, "visible");
	assert.equal(observed.root.dataset.heroState, "visible");

	const heroObserver = findObserver(observed, [observed.hero], {
		threshold: 0.15,
	});
	const contentObserver = findObserver(
		observed,
		[...observed.sections, ...observed.publicationGroups],
		{
		rootMargin: "-30% 0px -55% 0px",
		threshold: 0,
		},
	);

	heroObserver.callback([{ isIntersecting: false, target: observed.hero }]);
	assert.equal(observed.document.documentElement.dataset.homeHero, "passed");
	assert.equal(observed.root.dataset.heroState, "passed");

	contentObserver.callback([
		{ isIntersecting: true, target: observed.publicationGroups[1] },
		{ isIntersecting: true, target: observed.sections[4] },
	]);
	assert.equal(observed.root.dataset.activeSection, "publications");
	assert.equal(observed.root.dataset.activeResearchGroup, "recommendation-bidding");
	assert.equal(observed.context.textContent, "Recommendation & Bidding");
	assert.deepEqual(
		observed.relayLinks.map((link) => link.getAttribute("aria-current")),
		[null, null, null, null, "location"],
	);

	contentObserver.callback([
		{ isIntersecting: false, target: observed.publicationGroups[1] },
	]);
	assert.equal("activeResearchGroup" in observed.root.dataset, false);
	assert.equal(observed.context.textContent, "Research branches");

	contentObserver.callback([
		{ isIntersecting: true, target: observed.sections[4] },
		{ isIntersecting: true, target: observed.publicationGroups[2] },
	]);
	assert.equal(
		observed.root.dataset.activeResearchGroup,
		"reinforcement-learning-bandits",
	);
	assert.equal(observed.context.textContent, "Reinforcement Learning & Bandits");
	contentObserver.callback([
		{ isIntersecting: true, target: observed.publicationGroups[0] },
	]);
	assert.equal(observed.root.dataset.activeResearchGroup, "agent-llm-alignment");
	assert.equal(observed.context.textContent, "Agent / LLM Alignment");

	contentObserver.callback([
		{ isIntersecting: true, target: observed.sections[1] },
		{ isIntersecting: true, target: observed.sections[2] },
		{ isIntersecting: false, target: observed.sections[4] },
	]);
	assert.equal(observed.root.dataset.activeSection, "awards");
	assert.equal(observed.context.textContent, "Recognition");

	contentObserver.callback([
		{ isIntersecting: false, target: observed.sections[2] },
		{ isIntersecting: true, target: observed.sections[1] },
	]);
	assert.equal(observed.root.dataset.activeSection, "experience");
	assert.equal("activeResearchGroup" in observed.root.dataset, false);
	assert.equal(observed.context.textContent, "Field work");
	assert.deepEqual(
		observed.relayLinks.map((link) => link.getAttribute("aria-current")),
		[null, "location", null, null, null],
	);

	contentObserver.callback([
		{ isIntersecting: true, target: observed.publicationGroups[1] },
	]);
	assert.equal("activeResearchGroup" in observed.root.dataset, false);
	assert.equal(observed.context.textContent, "Field work");

	contentObserver.callback([
		{ isIntersecting: false, target: observed.sections[1] },
		{ isIntersecting: true, target: observed.sections[4] },
	]);
	assert.equal(observed.root.dataset.activeSection, "publications");
	assert.equal("activeResearchGroup" in observed.root.dataset, false);
	assert.equal(observed.context.textContent, "Research branches");

	contentObserver.callback([
		{ isIntersecting: true, target: observed.publicationGroups[1] },
		{ isIntersecting: false, target: observed.publicationGroups[1] },
	]);
	assert.equal("activeResearchGroup" in observed.root.dataset, false);
	assert.equal(observed.context.textContent, "Research branches");

	contentObserver.callback([
		{ isIntersecting: false, target: observed.publicationGroups[1] },
		{ isIntersecting: true, target: observed.publicationGroups[1] },
	]);
	assert.equal(observed.root.dataset.activeResearchGroup, "recommendation-bidding");
	assert.equal(observed.context.textContent, "Recommendation & Bidding");

	const missingHero = createAtlasControllerFixture({
		hasIntersectionObserver: true,
		hasHero: false,
	});
	runInNewContext(controllerMatch[1], missingHero);
	assert.equal(missingHero.document.documentElement.dataset.atlasJs, "ready");
	assert.equal(missingHero.document.documentElement.dataset.homeHero, "passed");
	assert.equal(missingHero.root.dataset.heroState, "passed");
	assert.equal(missingHero.observers.length, 1);
	findObserver(
		missingHero,
		[...missingHero.sections, ...missingHero.publicationGroups],
		{ rootMargin: "-30% 0px -55% 0px", threshold: 0 },
	);

	for (const failedInit of [
		createAtlasControllerFixture({ hasIntersectionObserver: true, hasRoot: false }),
		createAtlasControllerFixture({ hasIntersectionObserver: true, queryThrows: true }),
	]) {
		runInNewContext(controllerMatch[1], failedInit);
		assert.equal("atlasJs" in failedInit.document.documentElement.dataset, false);
		assert.equal(failedInit.document.documentElement.dataset.homeHero, "passed");
		assert.equal(failedInit.observers.length, 0);
	}
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
