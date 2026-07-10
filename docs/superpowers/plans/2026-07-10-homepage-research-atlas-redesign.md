# Homepage Research Atlas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current homepage's manuscript-heavy editorial treatment with a cobalt Research Atlas hero, a sticky five-stop Atlas Relay, restrained reading sections, a full-width blue awards chapter, and dark/warm-paper reading surfaces.

**Architecture:** Keep Astro's build-time content flow and introduce one typed atlas data module plus two focused presentational components. A small Intersection Observer controller writes hero, section, and publication-group state to data attributes; CSS owns all visual transitions, responsive behavior, and theme rendering.

**Tech Stack:** Astro 6, TypeScript, Astro content collections, HTML/CSS, Intersection Observer, Node's built-in test runner, Biome.

## Global Constraints

- Add no runtime dependency and no animation library.
- Keep cobalt `#1735D6`, bright cobalt `#3151FF`, signal yellow `#F5FF65`, ink `#111116`, warm paper `#F1ECE2`, dark text `#F4F0E8`, and light text `#15151B` exact.
- Keep Fraunces for display type, Geist for prose, and Geist Mono for coordinates and progress labels.
- Preserve all biography links, experience copy, awards, service entries, selected publications, and publication lineage.
- Keep the semantic `h1` as `Hengquan Guo`; render `Research as a living atlas.` as supporting display copy.
- Remove the manuscript layer, ghost numerals, repeated divider ticks, persistent formula drift, and whole-row publication translation from the homepage.
- Keep Full Publications and Projects on their current information architecture.
- Preserve a `24-64px` next-section cue in supported desktop and mobile first viewports.
- Honor `prefers-reduced-motion`; no animation may require per-frame JavaScript.
- Use direct local verification commands because the workspace currently exposes pnpm 11 while `package.json` pins pnpm 10.27.0.

---

## File Map

### Create

- `src/data/research-atlas.ts` - single typed source for research nodes and homepage section stops.
- `src/components/ResearchAtlas.astro` - semantic research graph and decorative edge layer.
- `src/components/ResearchRelay.astro` - sticky section progress navigation and contextual label.

### Modify

- `src/pages/index.astro` - homepage composition, data attributes, and the observer controller.
- `src/styles/index.css` - hero, reading sections, blue chapter, relay, responsive behavior, and motion.
- `src/styles/reset.css` - homepage-only color tokens while retaining existing tokens for secondary pages.
- `src/styles/globals.css` - `main-home` canvas sizing.
- `src/layouts/Layout.astro` - `home` layout mode, homepage body class, nav variant, and ambient-layer opt-out.
- `src/components/LayoutGrid.astro` - `home` wrapper without mobile side margins.
- `src/components/Navbar.astro` - atlas variant and hero/read-surface states.
- `src/components/ThemeToggle.astro` - cobalt browser theme color on the homepage.
- `src/components/PublicationTeaser.astro` - homepage-only `atlas` variant.
- `tests/site.test.mjs` - replace legacy visual assertions and add redesign contracts.

---

### Task 1: Add the Shared Research Atlas Model and Semantic Components

**Files:**
- Create: `src/data/research-atlas.ts`
- Create: `src/components/ResearchAtlas.astro`
- Create: `src/components/ResearchRelay.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Produces: `researchAtlas`, `homeSections`, `ResearchAtlasNode`, `HomeSection`, and `HomeSectionId` from `src/data/research-atlas.ts`.
- Produces: `<ResearchAtlas mode="hero" | "compact" />` with `data-research-atlas` and `data-research-group` hooks.
- Produces: `<ResearchRelay sections={homeSections} />` with `data-research-relay`, `data-relay-link`, and `data-relay-context` hooks.

- [ ] **Step 1: Write the failing source-contract test**

Append this test after the existing homepage structure test in `tests/site.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
node --test --test-name-pattern="research atlas data" tests/site.test.mjs
```

Expected: FAIL with `expected research atlas data source`.

- [ ] **Step 3: Create the typed atlas data module**

Create `src/data/research-atlas.ts`:

```ts
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
	{ id: "experience", number: "02", label: "Experience", context: "Field work" },
	{ id: "awards", number: "03", label: "Awards", context: "Recognition" },
	{ id: "service", number: "04", label: "Service & Teaching", context: "Community" },
	{ id: "publications", number: "05", label: "Selected Publications", context: "Research branches" },
] as const;

export type HomeSection = (typeof homeSections)[number];
export type HomeSectionId = HomeSection["id"];
```

- [ ] **Step 4: Create the semantic atlas component**

Create `src/components/ResearchAtlas.astro`:

```astro
---
import { researchAtlas } from "../data/research-atlas";

interface Props {
	mode?: "hero" | "compact";
}

const { mode = "hero" } = Astro.props;
const nodes = researchAtlas.groups.flatMap((group) => group.nodes);
---

<nav
	class:list={["research-atlas", `research-atlas--${mode}`]}
	aria-label={researchAtlas.label}
	data-research-atlas
>
	<span class="research-atlas-kicker">{researchAtlas.label}</span>
	<a class="research-atlas-core" href={researchAtlas.core.href}>
		<span>{researchAtlas.core.label}</span>
	</a>
	<div class="research-atlas-edges" aria-hidden="true">
		{nodes.map((node) => <span class={`research-atlas-edge edge-${node.id}`} />)}
	</div>
	<div class="research-atlas-groups">
		{
			researchAtlas.groups.map((group, groupIndex) => (
				<section class="research-atlas-group" data-atlas-group={group.id}>
					<h2>
						<span>{String(groupIndex + 1).padStart(2, "0")}</span>
						{group.label}
					</h2>
					<ul>
						{group.nodes.map((node) => (
							<li>
								<a
									href={node.href}
									data-atlas-node={node.id}
									data-research-group={node.publicationGroup}
								>
									<span class="research-atlas-node-label">{node.label}</span>
									<span class="research-atlas-node-short" aria-hidden="true">{node.shortLabel}</span>
								</a>
							</li>
						))}
					</ul>
				</section>
			))
		}
	</div>
</nav>
```

- [ ] **Step 5: Create the relay component**

Create `src/components/ResearchRelay.astro`:

```astro
---
import type { HomeSection } from "../data/research-atlas";

interface Props {
	sections: readonly HomeSection[];
}

const { sections } = Astro.props;
---

<nav class="research-relay" aria-label="Homepage sections" data-research-relay>
	<strong class="research-relay-title">Research Atlas</strong>
	<ol class="research-relay-track">
		{
			sections.map((section, index) => (
				<li>
					<a
						href={`#${section.id}`}
						data-relay-link={section.id}
						aria-current={index === 0 ? "location" : undefined}
					>
						<span>{section.number}</span>
						<span class="research-relay-link-label">{section.label}</span>
					</a>
				</li>
			))
		}
	</ol>
	<span class="research-relay-context" data-relay-context>{sections[0].context}</span>
</nav>
```

- [ ] **Step 6: Run the focused test and confirm green**

Run:

```bash
node --test --test-name-pattern="research atlas data" tests/site.test.mjs
```

Expected: PASS with one matching test and no failures.

- [ ] **Step 7: Commit the shared model and components**

```bash
git add src/data/research-atlas.ts src/components/ResearchAtlas.astro src/components/ResearchRelay.astro tests/site.test.mjs
git commit -m "feat: add research atlas components"
```

---

### Task 2: Add the Homepage Layout Mode and Ambient-Layer Opt-Out

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/LayoutGrid.astro`
- Modify: `src/styles/globals.css`
- Modify: `src/pages/index.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the existing `Layout` title and description props.
- Produces: `layout="home"`, `ambient="none"`, `body.page-home`, `main.main-home`, and `LayoutGrid variant="home"`.

- [ ] **Step 1: Replace the manuscript test with route-specific expectations**

Replace the test named `manuscript layer typesets compiled math into the page background` with:

```js
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
```

- [ ] **Step 2: Build the failing fixture**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds and regenerates `dist` with the old ambient layer.

- [ ] **Step 3: Run the focused test and confirm the red state**

Run:

```bash
node --test --test-name-pattern="homepage opts out" tests/site.test.mjs
```

Expected: FAIL because the built homepage still contains `class="manuscript-layer"`.

- [ ] **Step 4: Extend `Layout.astro` with exact home and ambient props**

Change the prop definitions and derived values to:

```ts
interface Props {
	title: string;
	description?: string;
	image?: ImageMetadata;
	layout?: "split" | "single" | "home";
	ambient?: "manuscript" | "none";
	article?: {
		createdAt: Date;
		updatedAt?: Date;
	};
}

const {
	title,
	description,
	image,
	article,
	layout = "split",
	ambient = "manuscript",
} = Astro.props;
```

Change the body and main shell to:

```astro
<body class:list={[layout === "home" && "page-home"]}>
	{ambient === "manuscript" && <ManuscriptLayer />}
	<main
		class:list={[
			layout === "single" && "main-single",
			layout === "home" && "main-home",
		]}
		data-layout={layout}
	>
		<Navbar />
		{
			layout === "split" ? (
				<LayoutGrid>
					<slot name="left" slot="left" />
					<slot name="right" slot="right" />
				</LayoutGrid>
			) : (
				<LayoutGrid variant={layout}>
					<slot />
				</LayoutGrid>
			)
		}
		<slot name="404" />
		<footer class:list={["site-footer", layout === "single" && "site-footer-single"]}>
			<hr class="hairline" />
			<p>
				&copy; {currentYear} Hengquan Guo. Powered by
				<a href="https://openai.com/codex/" target="_blank" rel="noopener noreferrer">Codex</a>
				&amp;
				<a href="https://www.anthropic.com/claude-code" target="_blank" rel="noopener noreferrer">Claude Code</a>.<SnakeGame />
			</p>
			<div class="snake-board-wrap" id="snake-board-wrap">
				<div class="snake-board" id="snake-board"></div>
			</div>
		</footer>
	</main>
	<Background />
</body>
```

- [ ] **Step 5: Add the home wrapper to `LayoutGrid.astro`**

Use this variant interface and wrapper branch:

```astro
---
interface Props {
	variant?: "split" | "single" | "home";
}

const { variant = "split" } = Astro.props;
---

{variant === "split" ? (
	<div class="layout-grid">
		<slot name="left" />
		<slot name="right" />
	</div>
) : (
	<div class:list={[variant === "single" ? "layout-single" : "layout-home"]}>
		<slot />
	</div>
)}
```

Add `.layout-home { position: relative; width: 100%; }` beside `.layout-single`. Keep the existing mobile margin rule on `.layout-single` only.

- [ ] **Step 6: Add the home canvas size**

Append to the main layout section of `src/styles/globals.css`:

```css
main.main-home {
	max-width: 1280px;
	gap: 0;
	padding-top: 0;
}
```

- [ ] **Step 7: Opt the homepage into the new layout contract**

Change the opening layout in `src/pages/index.astro` to:

```astro
<Layout
	title={openGraph.home.title || name}
	description={openGraph.home.description}
	layout="home"
	ambient="none"
>
```

- [ ] **Step 8: Rebuild and confirm the focused test passes**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: 23 pages build successfully.

Run:

```bash
node --test --test-name-pattern="homepage opts out" tests/site.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Commit the layout boundary**

```bash
git add src/layouts/Layout.astro src/components/LayoutGrid.astro src/styles/globals.css src/pages/index.astro tests/site.test.mjs
git commit -m "feat: add homepage layout mode"
```

---

### Task 3: Add the Cobalt Dual-Surface Theme and Atlas Navigation Variant

**Files:**
- Modify: `src/styles/reset.css`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/Navbar.astro`
- Modify: `src/components/ThemeToggle.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `body.page-home` and `Navbar variant="atlas"` from Task 2.
- Produces: homepage tokens `--home-cobalt`, `--home-cobalt-bright`, `--home-signal`, `--home-surface`, and `--home-ink`.
- Produces: `html[data-home-hero="visible|passed"]` as the nav state contract used by Task 5.

- [ ] **Step 1: Write the failing theme and nav contract test**

Append:

```js
test("homepage shell exposes the cobalt dual-surface navigation contract", async () => {
	const html = await readBuilt("index.html");
	const resetCss = await readRepo("src/styles/reset.css");
	const navbar = await readRepo("src/components/Navbar.astro");
	const themeToggle = await readRepo("src/components/ThemeToggle.astro");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(resetCss, "expected reset CSS");
	assert.ok(navbar, "expected Navbar source");
	assert.ok(themeToggle, "expected ThemeToggle source");
	assert.match(resetCss, /--home-cobalt:\s*#1735d6/i);
	assert.match(resetCss, /--home-signal:\s*#f5ff65/i);
	assert.match(resetCss, /html\[data-theme="light"\] body\.page-home/);
	assert.match(navbar, /variant\?: "default" \| "atlas"/);
	assert.match(navbar, /data-nav-variant/);
	assert.match(navbar, /data-home-hero="visible"/);
	assert.doesNotMatch(html, /class="reading-progress"/);
	assert.match(themeToggle, /#1735d6/);
});
```

- [ ] **Step 2: Build and run the focused test to confirm red**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="cobalt dual-surface" tests/site.test.mjs
```

Expected: FAIL because `--home-cobalt` is absent.

- [ ] **Step 3: Add homepage-only theme tokens to `reset.css`**

Insert after the existing dark-theme token block:

```css
body.page-home {
	--home-cobalt: #1735d6;
	--home-cobalt-bright: #3151ff;
	--home-signal: #f5ff65;
	--home-ink: #111116;
	--home-paper: #f1ece2;
	--home-text-dark: #f4f0e8;
	--home-text-light: #15151b;
	--home-surface: var(--home-ink);
	--home-surface-text: var(--home-text-dark);
	--home-surface-muted: rgba(244, 240, 232, 0.62);
	--page-bg: var(--home-surface);
	--text-primary: var(--home-surface-text);
	--text-secondary: var(--home-surface-muted);
	--primary: var(--home-cobalt-bright);
	--primary-rgb: 49, 81, 255;
	background: var(--home-surface);
}

html[data-theme="light"] body.page-home {
	--home-surface: var(--home-paper);
	--home-surface-text: var(--home-text-light);
	--home-surface-muted: rgba(21, 21, 27, 0.62);
}
```

- [ ] **Step 4: Add the Navbar variant prop and remove bottom reading progress**

At the top of `Navbar.astro`, add:

```astro
interface Props {
	variant?: "default" | "atlas";
}

const { variant = "default" } = Astro.props;
```

Change the nav opening element to:

```astro
<nav
	class:list={["site-nav", variant === "atlas" && "site-nav-atlas"]}
	aria-label="Primary"
	data-nav-variant={variant}
>
```

Then change the existing Navbar call in `src/layouts/Layout.astro` to:

```astro
<Navbar variant={layout === "home" ? "atlas" : "default"} />
```

Delete `<span class="reading-progress" aria-hidden="true"></span>`, its `@supports (animation-timeline: scroll())` block, and `@keyframes reading-fill`.

Add these scoped rules:

```css
.site-nav-atlas {
	margin-bottom: -3.5rem;
	padding-inline: 1.25rem;
	color: var(--text-primary);
	background: color-mix(in srgb, var(--home-surface) 92%, transparent);
}

:global(html[data-home-hero="visible"]) .site-nav-atlas {
	color: #ffffff;
	background: transparent;
	backdrop-filter: none;
}

:global(html[data-home-hero="visible"]) .site-nav-atlas .site-title,
:global(html[data-home-hero="visible"]) .site-nav-atlas .nav-link {
	color: #ffffff;
}

:global(html[data-home-hero="visible"]) .site-nav-atlas::after {
	background: rgba(255, 255, 255, 0.24);
}
```

- [ ] **Step 5: Establish the no-JavaScript nav fallback in `Layout.astro`**

Change the opening HTML element to:

```astro
<html
	lang="en"
	data-theme="dark"
	data-home-hero={layout === "home" ? "passed" : undefined}
>
```

The default `passed` state keeps a solid readable nav when JavaScript is unavailable. Task 5 switches it to `visible` once the homepage controller starts.

- [ ] **Step 6: Keep homepage browser chrome cobalt in both themes**

In `ThemeToggle.astro`, replace the meta-color assignment inside `applyTheme` with:

```js
if (themeMeta) {
	const isAtlasHome = document.body.classList.contains("page-home");
	themeMeta.setAttribute(
		"content",
		isAtlasHome ? "#1735d6" : theme === "dark" ? "#15130f" : "#f4efe4",
	);
}
```

In `Layout.astro`, add:

```ts
const isHomeLayout = layout === "home";
const initialThemeColor = isHomeLayout ? "#1735d6" : darkThemeColor;
```

Use the derived value and pass `isHomeLayout` into the existing inline script:

```astro
<meta name="theme-color" content={initialThemeColor}>
<script is:inline define:vars={{ lightThemeColor, darkThemeColor, isHomeLayout }}>
	(() => {
		const storageKey = "homepage-theme";
		const storedTheme = localStorage.getItem(storageKey);
		const theme = storedTheme === "light" ? "light" : "dark";
		document.documentElement.dataset.theme = theme;
		document.documentElement.style.colorScheme = theme;
		const themeMeta = document.querySelector('meta[name="theme-color"]');
		if (themeMeta) {
			themeMeta.setAttribute(
				"content",
				isHomeLayout ? "#1735d6" : theme === "dark" ? darkThemeColor : lightThemeColor,
			);
		}
	})();
</script>
```

- [ ] **Step 7: Replace the legacy reading-progress assertions**

Delete the old test named `homepage ships the editorial fine-print upgrade`. Its remaining hero and section requirements are covered by Tasks 4-8, while the new test in this task asserts that reading progress is absent.

- [ ] **Step 8: Rebuild and run the focused test**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="cobalt dual-surface" tests/site.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Commit the theme shell**

```bash
git add src/styles/reset.css src/layouts/Layout.astro src/components/Navbar.astro src/components/ThemeToggle.astro tests/site.test.mjs
git commit -m "feat: add cobalt homepage theme shell"
```

---

### Task 4: Rebuild the Hero Around the Research Atlas

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/index.css`
- Modify: `src/components/ResearchAtlas.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `researchAtlas`, `homeSections`, and `<ResearchAtlas />` from Task 1.
- Produces: `.home-atlas`, `[data-home-atlas]`, `[data-atlas-hero]`, `.atlas-hero`, and the cobalt first viewport.

- [ ] **Step 1: Replace legacy hero/map assertions with the new hero contract**

In the first homepage test, replace assertions for `.research-map`, `.research-map-node`, and `.research-map-branch` with:

```js
	assert.match(html, /class="home-atlas"/);
	assert.match(html, /data-home-atlas/);
	assert.match(html, /data-atlas-hero/);
	assert.match(html, /<h1[^>]*class="atlas-hero-name"[^>]*>\s*Hengquan Guo\s*<\/h1>/);
	assert.match(html, /Research as[\s\S]*a living atlas\./i);
	assert.match(html, /data-research-atlas/);
	assert.match(html, /aria-label="Research interests"/);
	assert.doesNotMatch(html, /class="research-map"/);
```

Replace the test named `homepage implements the editorial art and motion proposal hooks` with:

```js
test("homepage renders the cobalt atlas hero without legacy visual layers", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.match(html, /class="atlas-hero"/);
	assert.match(html, /class="atlas-hero-portrait"/);
	assert.match(html, /class="atlas-hero-orbit"/);
	assert.match(indexCss, /--atlas-cobalt:\s*#1735d6/i);
	assert.match(indexCss, /\.atlas-hero\s*{[^}]*background:\s*var\(--atlas-cobalt\)/);
	assert.match(indexCss, /\.atlas-hero-name/);
	assert.match(indexCss, /\.atlas-hero-statement/);
	assert.doesNotMatch(html, /data-draw-line|hero-hairline/);
	assert.doesNotMatch(indexCss, /ghost numerals/i);
	assert.doesNotMatch(indexCss, /\.home > \.hairline::before/);
	assert.doesNotMatch(indexPage, /const researchMap/);
});
```

- [ ] **Step 2: Build and run the new hero test to confirm red**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds with the old hero.

Run:

```bash
node --test --test-name-pattern="cobalt atlas hero" tests/site.test.mjs
```

Expected: FAIL because `.atlas-hero` is absent.

- [ ] **Step 3: Replace homepage-local atlas data with imports**

In `src/pages/index.astro`, add:

```ts
import ResearchAtlas from "../components/ResearchAtlas.astro";
import { homeSections } from "../data/research-atlas";
```

Delete the local `researchMap`, `Section` type, and `sections` constant. Use `homeSections` wherever section number or label data is rendered.

- [ ] **Step 4: Replace the old hero with the atlas hero**

Change the article opening and hero to:

```astro
<article class="home-atlas" data-home-atlas>
	<header class="atlas-hero" data-atlas-hero>
		<div class="atlas-hero-copy">
			<p class="atlas-hero-kicker">Decision-making under constraints · Shanghai</p>
			<h1 class="atlas-hero-name">{name}</h1>
			<p class="atlas-hero-statement">Research as <em>a living atlas.</em></p>
			<p class="atlas-hero-role">PhD student, ShanghaiTech University</p>
			<p class="atlas-hero-lede">
				Reinforcement learning and bandits, from theoretical foundations to agentic and multimodal systems.
			</p>
			<div class="atlas-hero-links" aria-label="Profile links">
				{sortedSocials.map((item) => item.data.link ? (
					<a href={item.data.link} target="_blank" rel="noopener noreferrer">{item.data.text}</a>
				) : (
					<span>{item.data.text}</span>
				))}
			</div>
		</div>
		<div class="atlas-hero-portrait">
			<span class="atlas-hero-orbit" aria-hidden="true"><span /></span>
			<Image
				src={ProfilePicture}
				alt="Blue bird portrait of Hengquan Guo"
				width={288}
				height={288}
				quality={100}
				loading="eager"
			/>
		</div>
		<div class="atlas-hero-coordinates" aria-hidden="true">
			31.2304° N · 121.4737° E<br />PhD · ShanghaiTech University
		</div>
		<div class="atlas-hero-map"><ResearchAtlas /></div>
	</header>
```

Delete the old hero hairline. Remove the research map from the About section so the graph appears exactly once.

Remove every `data-reveal` and `data-draw-line` attribute, remove `data-home-motion`, and delete the legacy reveal/line/active-section script. The article's only root hook is `data-home-atlas`.

Give every existing publication group a valid atlas anchor at the same time:

```astro
<section class="publication-group" id={`publications-${section.id}`}>
```

- [ ] **Step 5: Replace legacy hero/map CSS with the cobalt hero foundation**

At the top of `src/styles/index.css`, remove the legacy reveal, hairline, hero, ghost numeral, and `.research-map*` rule blocks. Add:

```css
.home-atlas {
	--atlas-cobalt: #1735d6;
	--atlas-cobalt-bright: #3151ff;
	--atlas-signal: #f5ff65;
	--atlas-ink: #111116;
	--atlas-paper: #f1ece2;
	width: 100%;
	color: var(--home-surface-text);
	background: var(--home-surface);
}

.atlas-hero {
	position: relative;
	min-height: calc(100svh - 64px);
	overflow: hidden;
	padding: clamp(7rem, 12vh, 9rem) clamp(1.5rem, 5vw, 4rem) 3rem;
	color: #ffffff;
	background: var(--atlas-cobalt);
}

.atlas-hero::before {
	content: "";
	position: absolute;
	inset: 0;
	pointer-events: none;
	background-size: 52px 52px;
	background-image:
		linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
		linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
}

.atlas-hero-copy {
	position: relative;
	z-index: 3;
	max-width: 47rem;
}

.atlas-hero-kicker,
.atlas-hero-coordinates {
	font-family: var(--font-mono);
	font-size: 0.72rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.atlas-hero-name {
	margin: 1.1rem 0 0;
	font-size: clamp(4rem, 9vw, 8rem);
	font-weight: 500;
	line-height: 0.84;
	letter-spacing: -0.055em;
}

.atlas-hero-statement {
	margin: 0.7rem 0 0 clamp(0rem, 6vw, 5rem);
	font-family: var(--font-display);
	font-size: clamp(2.3rem, 5vw, 5.25rem);
	line-height: 0.92;
	letter-spacing: -0.045em;
}

.atlas-hero-statement em {
	display: block;
	color: var(--atlas-signal);
	font-weight: 400;
}

.atlas-hero-lede {
	max-width: 34rem;
	margin: 0.7rem 0 0;
	color: rgba(255, 255, 255, 0.76);
	font-size: 1rem;
	line-height: 1.6;
}

.atlas-hero-role {
	margin: 1.5rem 0 0;
	font-family: var(--font-display);
	font-size: 1rem;
	font-style: italic;
}

.atlas-hero-links {
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem 1.1rem;
	margin-top: 1.4rem;
	font-size: 0.82rem;
}

.atlas-hero-links a,
.atlas-hero-links span {
	color: rgba(255, 255, 255, 0.78);
	text-decoration: none;
}

.atlas-hero-portrait {
	position: absolute;
	z-index: 4;
	top: clamp(9rem, 20vh, 13rem);
	right: clamp(2rem, 7vw, 6rem);
	width: clamp(10rem, 18vw, 15rem);
	aspect-ratio: 1;
}

.atlas-hero-portrait img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	border: 1px solid rgba(255, 255, 255, 0.58);
	border-radius: 50%;
}

.atlas-hero-orbit {
	position: absolute;
	inset: -1.25rem;
	border: 1px dashed rgba(255, 255, 255, 0.3);
	border-radius: 50%;
}

.atlas-hero-orbit span {
	position: absolute;
	top: -0.28rem;
	left: 50%;
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	background: var(--atlas-signal);
	transform: translateX(-50%);
}

.atlas-hero-coordinates {
	position: absolute;
	z-index: 3;
	top: clamp(22rem, 47vh, 30rem);
	right: clamp(2rem, 7vw, 6rem);
	color: rgba(255, 255, 255, 0.62);
	line-height: 1.7;
	text-align: right;
}

.atlas-hero-map {
	position: absolute;
	z-index: 3;
	right: clamp(1.5rem, 4vw, 3.5rem);
	bottom: 2rem;
	width: min(55%, 42rem);
}
```

- [ ] **Step 6: Add visual geometry styles inside `ResearchAtlas.astro`**

Add a scoped style block that uses a centered core, two group columns, and six positioned edge spans. The required state selectors are:

```css
.research-atlas {
	position: relative;
	min-height: 15rem;
	padding-top: 2rem;
	color: #ffffff;
}

.research-atlas-kicker {
	font-family: var(--font-mono);
	font-size: 0.68rem;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	opacity: 0.66;
}

.research-atlas-core,
.research-atlas-group a {
	border: 1px solid rgba(255, 255, 255, 0.34);
	background: rgba(8, 25, 126, 0.62);
	color: inherit;
	text-decoration: none;
}

.research-atlas-core {
	position: absolute;
	z-index: 3;
	top: 5.4rem;
	left: 50%;
	width: min(16rem, 48%);
	padding: 0.85rem 1rem;
	transform: translateX(-50%);
	border-color: var(--atlas-signal);
	text-align: center;
}

.research-atlas-groups {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
	padding-top: 8.5rem;
}

.research-atlas-group h2 {
	margin: 0 0 0.55rem;
	font-family: var(--font-mono);
	font-size: 0.68rem;
	font-style: normal;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.research-atlas-group h2 span {
	margin-right: 0.55rem;
	color: var(--atlas-signal);
}

.research-atlas-group ul {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.45rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.research-atlas-group a {
	display: block;
	padding: 0.55rem 0.65rem;
	font-family: var(--font-display);
	font-size: 0.88rem;
	line-height: 1.2;
}

.research-atlas a:focus-visible {
	outline: 2px solid var(--atlas-signal);
	outline-offset: 3px;
}

.research-atlas-node-short {
	display: none;
}

.research-atlas-edges {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.research-atlas-edge {
	position: absolute;
	z-index: 1;
	top: 7rem;
	left: 50%;
	width: 34%;
	height: 1px;
	background: rgba(245, 255, 101, 0.45);
	transform-origin: left;
}

.edge-bandits-online-learning { transform: rotate(150deg); }
.edge-safe-constrained-learning { transform: rotate(128deg); }
.edge-recommendation-bidding { transform: rotate(30deg); }
.edge-llm-alignment { transform: rotate(10deg); }
.edge-agentic-llms { transform: rotate(-10deg); }
.edge-multimodal-llms { transform: rotate(-30deg); }
```

- [ ] **Step 7: Rebuild and run the focused tests**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="cobalt atlas hero|academic CV structure" tests/site.test.mjs
```

Expected: both matching tests PASS.

- [ ] **Step 8: Commit the hero**

```bash
git add src/pages/index.astro src/styles/index.css src/components/ResearchAtlas.astro tests/site.test.mjs
git commit -m "feat: rebuild homepage hero around research atlas"
```

---

### Task 5: Add the Sticky Atlas Relay and Observer Controller

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/index.css`
- Modify: `src/components/ResearchRelay.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `homeSections` and `<ResearchRelay />` from Task 1.
- Produces: root attributes `data-active-section` and `data-active-research-group` plus document attribute `data-home-hero`.
- Produces: active relay links through `aria-current="location"`.

- [ ] **Step 1: Write the failing relay behavior test**

Append:

```js
test("atlas relay tracks hero, section, and publication-group state", async () => {
	const html = await readBuilt("index.html");
	const indexPage = await readRepo("src/pages/index.astro");
	const indexCss = await readRepo("src/styles/index.css");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexPage, "expected homepage source");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.match(html, /data-research-relay/);
	assert.match(html, /href="#about"/);
	assert.match(html, /href="#experience"/);
	assert.match(html, /href="#awards"/);
	assert.match(html, /href="#service"/);
	assert.match(html, /href="#publications"/);
	assert.match(indexPage, /data-home-section/);
	assert.match(indexPage, /data-publication-group/);
	assert.match(indexPage, /document\.documentElement\.dataset\.homeHero/);
	assert.match(indexPage, /root\.dataset\.activeSection/);
	assert.match(indexPage, /root\.dataset\.activeResearchGroup/);
	assert.match(indexPage, /setAttribute\("aria-current", "location"\)/);
	assert.match(indexCss, /\.research-relay\s*{[^}]*position:\s*sticky/);
});
```

- [ ] **Step 2: Build and run the relay test to confirm red**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds without the relay.

Run:

```bash
node --test --test-name-pattern="atlas relay tracks" tests/site.test.mjs
```

Expected: FAIL because `data-research-relay` is absent.

- [ ] **Step 3: Render the relay and section state hooks**

Import `ResearchRelay` in `src/pages/index.astro`, then render it immediately after the hero:

```astro
<ResearchRelay sections={homeSections} />
```

Apply these exact attributes to the five existing section opening tags:

```astro
<section
	class="home-section"
	id="about"
	data-home-section="about"
	data-section-context={homeSections[0].context}
>
<section
	class="home-section"
	id="experience"
	data-home-section="experience"
	data-section-context={homeSections[1].context}
>
<section
	class="home-section home-section--blue"
	id="awards"
	data-home-section="awards"
	data-section-context={homeSections[2].context}
>
<section
	class="home-section"
	id="service"
	data-home-section="service"
	data-section-context={homeSections[3].context}
>
<section
	class="home-section"
	id="publications"
	data-home-section="publications"
	data-section-context={homeSections[4].context}
>
```

For each publication group, use:

```astro
<section
	class="publication-group"
	id={`publications-${section.id}`}
	data-publication-group={section.id}
	data-publication-context={section.title}
>
```

- [ ] **Step 4: Add the homepage controller**

Add this inline controller at the end of `src/pages/index.astro`:

```astro
<script is:inline>
	(() => {
		const root = document.querySelector("[data-home-atlas]");
		if (!(root instanceof HTMLElement)) return;

		const hero = root.querySelector("[data-atlas-hero]");
		const sections = Array.from(root.querySelectorAll("[data-home-section]"));
		const publicationGroups = Array.from(root.querySelectorAll("[data-publication-group]"));
		const relayLinks = Array.from(root.querySelectorAll("[data-relay-link]"));
		const context = root.querySelector("[data-relay-context]");

		const setSection = (section) => {
			const id = section.getAttribute("data-home-section");
			const label = section.getAttribute("data-section-context");
			if (!id) return;

			root.dataset.activeSection = id;
			if (id !== "publications") delete root.dataset.activeResearchGroup;
			for (const link of relayLinks) {
				if (link.getAttribute("data-relay-link") === id) {
					link.setAttribute("aria-current", "location");
				} else {
					link.removeAttribute("aria-current");
				}
			}
			if (context && label) context.textContent = label;
		};

		const setResearchGroup = (group) => {
			const id = group.getAttribute("data-publication-group");
			const label = group.getAttribute("data-publication-context");
			if (!id) return;
			root.dataset.activeResearchGroup = id;
			if (context && label) context.textContent = label;
		};

		if (sections[0]) setSection(sections[0]);

		if (!("IntersectionObserver" in window)) {
			document.documentElement.dataset.homeHero = "passed";
			root.dataset.heroState = "passed";
			return;
		}

		document.documentElement.dataset.homeHero = "visible";

		if (hero) {
			new IntersectionObserver(
				([entry]) => {
					const state = entry?.isIntersecting ? "visible" : "passed";
					document.documentElement.dataset.homeHero = state;
					root.dataset.heroState = state;
				},
				{ threshold: 0.15 },
			).observe(hero);
		}

		const sectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setSection(entry.target);
				}
			},
			{ rootMargin: "-32% 0px -52% 0px", threshold: 0 },
		);

		const groupObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setResearchGroup(entry.target);
				}
			},
			{ rootMargin: "-30% 0px -55% 0px", threshold: 0 },
		);

		for (const section of sections) sectionObserver.observe(section);
		for (const group of publicationGroups) groupObserver.observe(group);
	})();
</script>
```

- [ ] **Step 5: Style the relay and active states**

Add to `src/styles/index.css`:

```css
.research-relay {
	position: sticky;
	top: 3.5rem;
	z-index: 28;
	display: grid;
	grid-template-columns: 8rem minmax(0, 1fr) auto;
	align-items: center;
	gap: 1.25rem;
	min-height: 3.75rem;
	padding: 0 1.5rem;
	border-block: 1px solid color-mix(in srgb, var(--home-surface-text) 16%, transparent);
	background: color-mix(in srgb, var(--home-surface) 94%, transparent);
	backdrop-filter: blur(18px);
	opacity: 0;
	transform: translateY(-0.4rem);
	transition:
		opacity 0.42s ease,
		transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

html[data-home-hero="passed"] .research-relay {
	opacity: 1;
	transform: none;
}

.research-relay-track {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	margin: 0;
	padding: 0;
	list-style: none;
}

.research-relay-track li {
	position: relative;
}

.research-relay-track li::before {
	content: "";
	position: absolute;
	top: 50%;
	left: 0;
	right: 0;
	height: 1px;
	background: var(--atlas-cobalt-bright);
}

.research-relay-track a {
	position: relative;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	color: var(--home-surface-muted);
	font-family: var(--font-mono);
	font-size: 0.68rem;
	text-decoration: none;
}

.research-relay-track a::before {
	content: "";
	width: 0.45rem;
	height: 0.45rem;
	border-radius: 50%;
	background: var(--atlas-cobalt-bright);
}

.research-relay-track a[aria-current="location"] {
	color: var(--home-surface-text);
}

.research-relay-track a:focus-visible {
	outline: 2px solid var(--atlas-cobalt-bright);
	outline-offset: 4px;
}

.research-relay-track a[aria-current="location"]::before {
	background: var(--atlas-signal);
	box-shadow: 0 0 0 0.3rem color-mix(in srgb, var(--atlas-signal) 14%, transparent);
}

html[data-theme="light"] .research-relay-track a[aria-current="location"]::before {
	background: var(--atlas-cobalt-bright);
}

.research-relay-context {
	color: var(--atlas-cobalt-bright);
	font-family: var(--font-mono);
	font-size: 0.68rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.home-atlas[data-active-research-group] [data-atlas-node] {
	opacity: 0.55;
}

.home-atlas[data-active-research-group="agent-llm-alignment"]
	[data-research-group="agent-llm-alignment"],
.home-atlas[data-active-research-group="recommendation-bidding"]
	[data-research-group="recommendation-bidding"],
.home-atlas[data-active-research-group="reinforcement-learning-bandits"]
	[data-research-group="reinforcement-learning-bandits"] {
	border-color: var(--atlas-signal);
	opacity: 1;
}
```

- [ ] **Step 6: Rebuild and run the relay test**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="atlas relay tracks" tests/site.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the relay behavior**

```bash
git add src/pages/index.astro src/styles/index.css src/components/ResearchRelay.astro tests/site.test.mjs
git commit -m "feat: add atlas relay navigation"
```

---

### Task 6: Redesign Reading Sections and the Blue Awards Chapter

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/index.css`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `homeSections` section metadata and relay data hooks from Task 5.
- Produces: `.home-section--blue`, `.about-manifesto`, and the spacing-led reading system.

- [ ] **Step 1: Write the failing section-style test**

In the first homepage structure test, replace the `.about-pull-quote` class assertion with:

```js
	assert.match(html, /class="about-manifesto"/);
```

Keep the existing `Learning under constraints, feedback, and changing environments.` content assertion; the sentence now appears inside the manifesto.

Append:

```js
test("homepage uses spacing-led reading sections and a cobalt awards chapter", async () => {
	const html = await readBuilt("index.html");
	const indexCss = await readRepo("src/styles/index.css");

	assert.ok(html, "expected built homepage HTML");
	assert.ok(indexCss, "expected homepage CSS source");
	assert.match(html, /class="about-manifesto"/);
	assert.match(html, /class="home-section home-section--blue"[^>]*id="awards"/);
	assert.match(indexCss, /\.home-section--blue\s*{[^}]*background:\s*var\(--atlas-cobalt\)/);
	assert.match(indexCss, /\.award-list\s*{[^}]*grid-template-columns:\s*repeat\(4/);
	assert.doesNotMatch(html, /<hr class="hairline"/);
	assert.doesNotMatch(indexCss, /\.section-num\s*{[^}]*font-size:\s*clamp\(3/);
	assert.doesNotMatch(indexCss, /\.prose > p:first-of-type::first-letter/);
});
```

- [ ] **Step 2: Build and run the focused test to confirm red**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds with old section styling.

Run:

```bash
node --test --test-name-pattern="spacing-led reading sections" tests/site.test.mjs
```

Expected: FAIL because `.about-manifesto` is absent.

- [ ] **Step 3: Replace separators and add the About manifesto**

Delete every homepage `<hr class="hairline" ... />`. In the About section, insert before `.prose`:

```astro
<p class="about-manifesto">
	Learning under <em>constraints, feedback,</em> and changing environments.
</p>
```

Keep the existing `<About />` content and advisor links unchanged. Remove the old `about-pull-quote` because the manifesto carries the visual emphasis.

- [ ] **Step 4: Make Awards the blue chapter without changing its data loop**

Keep `id="awards"`, `.award-list`, `.award-item`, `.award-title`, `.award-meta`, and `.award-year`. Add the `home-section--blue` class through the common section contract from Task 5.

- [ ] **Step 5: Replace section, award, and service CSS with the new system**

Delete the old `.about-pull-quote`, `.prose > p:first-of-type::first-letter`, `.award-*`, `.service-*`, `.section-head`, `.section-num`, `.section-title`, and `.home-section` rule blocks before adding the replacement rules below.

Use:

```css
.home-section {
	display: grid;
	grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr);
	gap: clamp(2rem, 5vw, 4.5rem);
	min-height: 34rem;
	padding: clamp(4.5rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem);
	background: var(--home-surface);
}

.section-head {
	position: sticky;
	top: 8.25rem;
	align-self: start;
}

.section-num {
	display: block;
	color: var(--atlas-cobalt-bright);
	font-family: var(--font-mono);
	font-size: 0.74rem;
	letter-spacing: 0.12em;
}

.section-title {
	margin: 0.65rem 0 0;
	font-size: clamp(1.75rem, 3vw, 2.65rem);
	font-style: normal;
	font-weight: 500;
	line-height: 1;
}

.about-manifesto {
	max-width: 48rem;
	margin: 0 0 2rem;
	font-family: var(--font-display);
	font-size: clamp(2.25rem, 5vw, 4.4rem);
	line-height: 1.02;
	letter-spacing: -0.04em;
}

.about-manifesto em {
	color: var(--atlas-cobalt-bright);
	font-weight: 400;
}

.prose {
	max-width: 45rem;
	font-size: 1rem;
	line-height: 1.75;
}

.home-section--blue {
	min-height: 40rem;
	color: #ffffff;
	background: var(--atlas-cobalt);
}

.home-section--blue .section-num,
.home-section--blue .award-meta,
.home-section--blue .award-year {
	color: var(--atlas-signal);
}

.home-section--blue .section-title,
.home-section--blue .award-title {
	color: #ffffff;
}

.award-list {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 1px;
	border: 1px solid rgba(255, 255, 255, 0.3);
	background: rgba(255, 255, 255, 0.3);
}

.award-item {
	min-height: 10rem;
	padding: 1.25rem;
	border: 0;
	background: color-mix(in srgb, var(--atlas-cobalt) 88%, #0b1e93);
}

.award-title {
	font-size: 1.12rem;
	line-height: 1.15;
}

.service-list,
.entry-list {
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
}

.service-item {
	padding: 0 0 1.25rem;
	border-bottom: 1px solid color-mix(in srgb, var(--home-surface-text) 13%, transparent);
}
```

- [ ] **Step 6: Rebuild and run content plus section tests**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="spacing-led reading sections|academic CV structure" tests/site.test.mjs
```

Expected: both matching tests PASS, proving content preservation and new section styling.

- [ ] **Step 7: Commit the reading sections**

```bash
git add src/pages/index.astro src/styles/index.css tests/site.test.mjs
git commit -m "feat: redesign homepage sections and awards"
```

---

### Task 7: Add the Homepage Atlas Publication Variant

**Files:**
- Modify: `src/components/PublicationTeaser.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/index.css`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Extends: `PublicationTeaser` variant union with `"atlas"`.
- Preserves: `"list"` for Full Publications and `showLineage` behavior.
- Produces: `.publication-atlas-year` and `.publication-atlas-venue`.

- [ ] **Step 1: Write the failing publication variant test**

In the existing test named `homepage groups selected publications by research area with real venue badges`, replace the three homepage-only `publication-teaser list` expectations with `publication-teaser atlas`. Keep the archive route assertions on `publication-teaser list` unchanged.

Append:

```js
test("homepage publications use the atlas index variant without changing the archive", async () => {
	const homeHtml = await readBuilt("index.html");
	const publicationsHtml = await readBuilt("publications/index.html");
	const teaser = await readRepo("src/components/PublicationTeaser.astro");

	assert.ok(homeHtml, "expected built homepage HTML");
	assert.ok(publicationsHtml, "expected built publications HTML");
	assert.ok(teaser, "expected PublicationTeaser source");
	assert.match(teaser, /"compact" \| "full" \| "list" \| "atlas"/);
	assert.match(homeHtml, /class="publication-teaser atlas"/);
	assert.match(homeHtml, /class="publication-atlas-year"/);
	assert.match(homeHtml, /class="publication-atlas-venue"/);
	assert.doesNotMatch(publicationsHtml, /class="publication-teaser atlas"/);
	assert.match(publicationsHtml, /class="publication-teaser list"/);
	assert.match(homeHtml, /class="publication-lineage"/);
	assert.doesNotMatch(teaser, /translateX\(/);
});
```

- [ ] **Step 2: Build and run the focused test to confirm red**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds with the homepage still using `list`.

Run:

```bash
node --test --test-name-pattern="atlas index variant" tests/site.test.mjs
```

Expected: FAIL because the variant union lacks `atlas`.

- [ ] **Step 3: Extend the variant interface and markup**

Change the prop union to:

```ts
variant?: "compact" | "full" | "list" | "atlas";
```

Inside the article, render the atlas year before `.publication-copy`:

```astro
{variant === "atlas" && (
	<span class="publication-atlas-year">{publication.data.year}</span>
)}
```

Change the post header to avoid a duplicate year:

```astro
<div class="post-header">
	<h3>{publication.data.title}</h3>
	{variant !== "atlas" && <span class="post-date">{publication.data.year}</span>}
</div>
```

Render the atlas venue after `.publication-copy`:

```astro
{variant === "atlas" && (
	<span class="publication-atlas-venue">{venueLabel}</span>
)}
```

- [ ] **Step 4: Add scoped atlas publication styles**

Add to `PublicationTeaser.astro`:

```css
.publication-teaser.atlas {
	position: relative;
	display: grid;
	grid-template-columns: 4rem minmax(0, 1fr) auto;
	gap: 1.25rem;
	padding: 1.55rem 0;
	border-top: 1px solid color-mix(in srgb, var(--home-surface-text) 14%, transparent);
	background: transparent;
}

.publication-teaser.atlas::before {
	content: "";
	position: absolute;
	left: -0.9rem;
	top: 0;
	bottom: 0;
	width: 2px;
	background: var(--atlas-cobalt-bright);
	transform: scaleY(0);
	transform-origin: top;
	transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.publication-teaser.atlas:has(.publication-main-link:hover)::before,
.publication-teaser.atlas:has(.publication-main-link:focus-visible)::before {
	transform: scaleY(1);
}

.publication-atlas-year,
.publication-atlas-venue {
	font-family: var(--font-mono);
	font-size: 0.72rem;
	letter-spacing: 0.08em;
}

.publication-atlas-year {
	color: var(--atlas-cobalt-bright);
}

.publication-atlas-venue {
	align-self: start;
	padding: 0.3rem 0.4rem;
	border: 1px solid color-mix(in srgb, var(--home-surface-text) 20%, transparent);
	color: var(--home-surface-text);
}

.publication-teaser.atlas .publication-copy {
	gap: 0.38rem;
}

.publication-teaser.atlas .publication-copy h3 {
	font-size: 1.18rem;
}

.publication-teaser.atlas:has(.publication-main-link:hover),
.publication-teaser.atlas:has(.publication-main-link:focus-visible) {
	background: transparent;
}
```

- [ ] **Step 5: Switch only homepage teasers to `atlas`**

In `src/pages/index.astro`, change:

```astro
<PublicationTeaser
	publication={publication}
	href={`/publications/${publication.id}`}
	variant="atlas"
	showLineage={true}
/>
```

Keep `src/pages/publications.astro` on `variant="list"`.

- [ ] **Step 6: Reduce publication group chrome**

In `src/styles/index.css`, keep the italic group name but remove `.publication-group::before`, index/rule scaling, and whole-group hover transforms. Use:

```css
.publication-groups {
	display: flex;
	flex-direction: column;
	gap: clamp(3rem, 6vw, 5rem);
}

.publication-group-title {
	display: flex;
	align-items: baseline;
	gap: 0.8rem;
	margin: 0 0 0.7rem;
}

.publication-group-index {
	color: var(--atlas-cobalt-bright);
	font-family: var(--font-mono);
	font-size: 0.72rem;
}

.publication-group-rule {
	display: none;
}

.publication-group-name {
	font-size: clamp(1.65rem, 3vw, 2.5rem);
	font-style: italic;
	font-weight: 460;
}
```

- [ ] **Step 7: Rebuild and run homepage plus archive publication tests**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: build succeeds.

Run:

```bash
node --test --test-name-pattern="atlas index variant|groups selected publications|publications route" tests/site.test.mjs
```

Expected: all three matching tests PASS.

- [ ] **Step 8: Commit the publication index**

```bash
git add src/components/PublicationTeaser.astro src/pages/index.astro src/styles/index.css tests/site.test.mjs
git commit -m "feat: add atlas publication index"
```

---

### Task 8: Complete Responsive Layout, Dual-Surface Details, and Reduced Motion

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/components/ResearchAtlas.astro`
- Modify: `src/components/ResearchRelay.astro`
- Modify: `src/components/Navbar.astro`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: all desktop classes and state hooks from Tasks 3-7.
- Produces: stable tablet/mobile layouts, finite signature motion, and static reduced-motion rendering.

- [ ] **Step 1: Write the failing responsive and motion contract test**

Append:

```js
test("research atlas homepage has explicit responsive and reduced-motion contracts", async () => {
	const indexCss = await readRepo("src/styles/index.css");
	const atlas = await readRepo("src/components/ResearchAtlas.astro");
	const relay = await readRepo("src/components/ResearchRelay.astro");

	assert.ok(indexCss, "expected homepage CSS source");
	assert.ok(atlas, "expected ResearchAtlas source");
	assert.ok(relay, "expected ResearchRelay source");
	assert.match(indexCss, /min-height:\s*calc\(100svh - 64px\)/);
	assert.match(indexCss, /@media screen and \(max-width:\s*860px\)/);
	assert.match(indexCss, /@media screen and \(max-width:\s*640px\)/);
	assert.match(indexCss, /@media \(prefers-reduced-motion:\s*reduce\)/);
	assert.match(atlas, /research-atlas-node-short/);
	assert.match(atlas, /@media screen and \(max-width:\s*640px\)/);
	assert.match(relay, /research-relay-link-label/);
	assert.doesNotMatch(indexCss, /animation-iteration-count:\s*infinite/);
	assert.doesNotMatch(indexCss, /translateX\(2px\)/);
});
```

- [ ] **Step 2: Run the focused source test to confirm red**

Run:

```bash
node --test --test-name-pattern="explicit responsive" tests/site.test.mjs
```

Expected: FAIL because the final mobile atlas rules are absent.

- [ ] **Step 3: Add tablet rules to `index.css`**

```css
@media screen and (max-width: 860px) {
	.atlas-hero {
		min-height: calc(100svh - 48px);
		padding: 6.5rem 1.5rem 2rem;
	}

	.atlas-hero-name {
		font-size: clamp(3.7rem, 13vw, 6rem);
	}

	.atlas-hero-statement {
		max-width: 33rem;
		margin-left: 0;
		font-size: clamp(2.2rem, 8vw, 4rem);
	}

	.atlas-hero-portrait {
		top: 20rem;
		right: 2rem;
		width: 10rem;
	}

	.atlas-hero-coordinates {
		top: 31rem;
		right: 2rem;
	}

	.atlas-hero-map {
		left: 1.5rem;
		right: 1.5rem;
		bottom: 1.5rem;
		width: auto;
	}

	.research-relay {
		grid-template-columns: 6.5rem minmax(0, 1fr);
	}

	.research-relay-context,
	.research-relay-link-label {
		display: none;
	}

	.home-section {
		grid-template-columns: minmax(0, 1fr);
		min-height: 0;
		padding: 4.5rem 1.5rem;
	}

	.section-head {
		position: static;
	}

	.award-list {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
```

- [ ] **Step 4: Add mobile rules to `index.css`**

```css
@media screen and (max-width: 640px) {
	.atlas-hero {
		min-height: calc(100svh - 40px);
		padding: 5.75rem 1rem 1.5rem;
	}

	.atlas-hero-name {
		font-size: clamp(3.2rem, 16vw, 4.5rem);
	}

	.atlas-hero-statement {
		font-size: clamp(2rem, 11vw, 3rem);
	}

	.atlas-hero-lede {
		max-width: 21rem;
		font-size: 0.9rem;
	}

	.atlas-hero-links {
		gap: 0.5rem 0.8rem;
	}

	.atlas-hero-portrait {
		top: auto;
		bottom: 13.5rem;
		left: 1rem;
		right: auto;
		width: 7.5rem;
	}

	.atlas-hero-coordinates {
		display: none;
	}

	.atlas-hero-map {
		bottom: 1rem;
	}

	.research-relay {
		top: 3.5rem;
		grid-template-columns: minmax(0, 1fr);
		min-height: 2.9rem;
		padding: 0 1rem;
	}

	.research-relay-title,
	.research-relay-context,
	.research-relay-link-label {
		display: none;
	}

	.home-section {
		padding-inline: 1rem;
	}

	.award-list {
		grid-template-columns: minmax(0, 1fr);
	}

	.publication-teaser.atlas {
		grid-template-columns: 2.7rem minmax(0, 1fr);
		gap: 0.85rem;
	}

	.publication-atlas-venue {
		grid-column: 2;
		width: fit-content;
	}
}
```

- [ ] **Step 5: Flatten the mobile atlas without removing labels**

Add to the scoped style in `ResearchAtlas.astro`:

```css
@media screen and (max-width: 640px) {
	.research-atlas {
		min-height: 10rem;
		padding-top: 0.8rem;
	}

	.research-atlas-kicker,
	.research-atlas-edges,
	.research-atlas-group h2 {
		display: none;
	}

	.research-atlas-core {
		top: 0;
		width: 11rem;
		padding: 0.65rem;
	}

	.research-atlas-groups {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
		padding-top: 4.1rem;
	}

	.research-atlas-group ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.research-atlas-group a {
		padding: 0.35rem 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.62rem;
	}

	.research-atlas-node-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	.research-atlas-node-short {
		display: inline;
	}
}
```

The anchor remains visible through its short label, so keyboard focus never lands on an invisible control.

- [ ] **Step 6: Add finite entry motion and reduced-motion rendering**

Add to `src/styles/index.css`:

```css
@keyframes atlas-orbit-entry {
	from { transform: rotate(-22deg); }
	to { transform: rotate(32deg); }
}

.atlas-hero-orbit {
	animation: atlas-orbit-entry 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.research-atlas-edge {
	animation: atlas-edge-entry 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes atlas-edge-entry {
	from { opacity: 0; scale: 0 1; }
	to { opacity: 1; scale: 1 1; }
}

@keyframes atlas-node-pulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(245, 255, 101, 0); }
	50% { box-shadow: 0 0 0 0.35rem rgba(245, 255, 101, 0.16); }
}

.home-atlas[data-active-research-group="agent-llm-alignment"]
	[data-research-group="agent-llm-alignment"],
.home-atlas[data-active-research-group="recommendation-bidding"]
	[data-research-group="recommendation-bidding"],
.home-atlas[data-active-research-group="reinforcement-learning-bandits"]
	[data-research-group="reinforcement-learning-bandits"] {
	animation: atlas-node-pulse 420ms cubic-bezier(0.22, 1, 0.36, 1) 2;
}

@media (prefers-reduced-motion: reduce) {
	.atlas-hero-orbit,
	.research-atlas-edge,
	[data-atlas-node] {
		animation: none;
	}

	.research-relay,
	.research-relay-track a,
	.publication-teaser.atlas::before {
		transition: none;
	}
}
```

- [ ] **Step 7: Rebuild and run the full test suite**

Run:

```bash
./node_modules/.bin/astro build
```

Expected: 23 pages build successfully.

Run:

```bash
node --test tests/site.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 8: Run Biome on the touched source and test files**

Run:

```bash
./node_modules/.bin/biome check src/pages/index.astro src/styles/index.css src/styles/reset.css src/styles/globals.css src/layouts/Layout.astro src/components/LayoutGrid.astro src/components/Navbar.astro src/components/ThemeToggle.astro src/components/ResearchAtlas.astro src/components/ResearchRelay.astro src/components/PublicationTeaser.astro src/data/research-atlas.ts tests/site.test.mjs
```

Expected: exit code 0 with no diagnostics.

- [ ] **Step 9: Perform browser QA before committing**

Start the dev server:

```bash
./node_modules/.bin/astro dev --host 127.0.0.1 --port 4321
```

Use the in-app Browser skill to verify these exact states:

- `1440x1000`, dark: cobalt hero, visible next-section cue, no overlap, relay sticks below nav.
- `1280x800`, light: cobalt hero remains unchanged, reading surface is warm paper.
- `390x844`, dark: no horizontal overflow, short atlas labels remain visible, one-column awards.
- `360x800`, light: hero leaves a next-section cue and publication years do not wrap into titles.
- Reduced motion: orbit and edge entry are static while section tracking still updates.
- Scroll through all five sections: exactly one relay link has `aria-current="location"`.
- Scroll through all three publication groups: relay context matches the visible group.
- Browser console: zero errors.

Expected: every state matches the checklist before the commit step.

- [ ] **Step 10: Commit responsive and motion completion**

```bash
git add src/styles/index.css src/components/ResearchAtlas.astro src/components/ResearchRelay.astro src/components/Navbar.astro tests/site.test.mjs
git commit -m "feat: finish responsive atlas experience"
```

---

## Final Verification

- [ ] Run production build:

```bash
./node_modules/.bin/astro build
```

Expected: exit code 0 and 23 generated pages.

- [ ] Run all repository tests:

```bash
node --test tests/site.test.mjs
```

Expected: zero failures.

- [ ] Check the final diff for whitespace and unintended files:

```bash
git diff --check HEAD~8..HEAD
git status --short
```

Expected: no whitespace errors. Only the pre-existing untracked `analemma.png`, diagnostics JSON, `docs/homepage-art-ideas.md`, and `docs/shots/` remain outside the implementation commits.

- [ ] Confirm commit sequence:

```bash
git log -8 --oneline
```

Expected commits, newest first:

```text
feat: finish responsive atlas experience
feat: add atlas publication index
feat: redesign homepage sections and awards
feat: add atlas relay navigation
feat: rebuild homepage hero around research atlas
feat: add cobalt homepage theme shell
feat: add homepage layout mode
feat: add research atlas components
```
