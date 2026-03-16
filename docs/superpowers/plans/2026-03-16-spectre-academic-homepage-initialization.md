# Spectre Academic Homepage CV Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the existing Spectre-based academic homepage so it matches the approved CV-driven design: hero with right-side About, selected publications with compact covers, awards, experience, academic service and teaching, and a dedicated `Full Publications` navigation path.

**Architecture:** Keep the current Astro + content-collection structure, but extend the data model so the homepage can render structured academic CV sections cleanly. Reuse one shared publication teaser component for both the homepage and `/publications`, loosen the socials model to support obfuscated non-link contact items, and seed the new homepage sections from JSON/MDX content rather than hardcoding large arrays inside page files.

**Tech Stack:** Astro 6, TypeScript, Astro content collections, MDX, PNPM, Node.js built-in test runner

---

## File Structure

- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/tests/site.test.mjs`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content.config.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/socials.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/info.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/other/about.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Navbar.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/index.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article-list.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/*.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-1.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-2.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-3.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/awards.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/experience.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/service-teaching.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/PublicationTeaser.astro`

## Chunk 1: Data Model And Acceptance Tests

### Task 1: Update The Site-Shape Test To Cover The New Academic CV Scope

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/tests/site.test.mjs`

- [ ] **Step 1: Expand the homepage assertions to match the approved sections**

Replace the current homepage assertions with checks for the new public contract:

```js
test("homepage renders the academic CV structure and omits excluded personal data", async () => {
  const html = await readBuilt("index.html");

  assert.ok(html, "expected built homepage HTML");
  assert.match(html, /Hengquan Guo/);
  assert.match(html, /ShanghaiTech University/);
  assert.match(html, /Reinforcement Learning/);
  assert.match(html, /LLM Alignment/);
  assert.match(html, /About me/);
  assert.match(html, /Selected Publications/);
  assert.match(html, /Awards/);
  assert.match(html, /Experience/);
  assert.match(html, /Academic Service(?:\s*&amp;\s*|\s*&\s*)Teaching/);
  assert.match(html, /guohq \\(at\\) shanghaitech\\.edu\\.cn/);
  assert.match(html, /href="https:\\/\\/scholar\\.google\\.com\\/citations\\?user=8bGinucAAAAJ/);
  assert.match(html, /National Scholarship,? 2025/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /tel:/);
  assert.doesNotMatch(html, /Xiangtan University/);
  assert.doesNotMatch(html, /Latest Posts/);
  assert.doesNotMatch(html, /Made in Germany/);
});
```

- [ ] **Step 2: Expand the publications/nav assertions**

Add checks that `/publications` is the full listing page and the nav uses the approved label:

```js
test("publications route and homepage navigation expose full publications", async () => {
  const publicationsHtml = await readBuilt("publications/index.html");
  const homepageHtml = await readBuilt("index.html");

  assert.ok(publicationsHtml, "expected built publications index");
  assert.match(publicationsHtml, /Full Publications|Publications/);
  assert.match(publicationsHtml, /Triple-Optimistic Learning/i);
  assert.match(homepageHtml, /href="\\/publications"/);
  assert.match(homepageHtml, />Full Publications</);
});
```

- [ ] **Step 3: Keep the placeholder-project expectation**

Add these lines inside the same homepage test from Step 1 so the placeholder-project assertions actually execute against the built homepage HTML:

```js
assert.match(html, /Project Placeholder 1/);
assert.match(html, /Project Placeholder 2/);
assert.match(html, /Project Placeholder 3/);
```

- [ ] **Step 4: Run the verification command before implementation**

Run:

```bash
pnpm verify:site
```

Expected: FAIL, because the current homepage does not yet render the new sections or obfuscated school email.

- [ ] **Step 5: Commit the failing test update**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init add tests/site.test.mjs
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init commit -m "Add failing CV homepage acceptance tests"
```

Expected: commit succeeds and the branch now contains the updated failing acceptance contract.

### Task 2: Extend The Content Collections For Academic CV Data

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content.config.ts`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/awards.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/experience.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/service-teaching.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/socials.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/info.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/other/about.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/online-convex-optimization-hard-constraints.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/rectified-pessimistic-optimistic-learning.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/stochastic-constrained-contextual-bandits.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/contextual-bandits-knapsacks-small-budget.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/triple-optimistic-learning-general-constraints.mdx`

- [ ] **Step 1: Loosen the `socials` schema so contact items may be plain text**

Update the `socials` collection schema to allow `link` to be optional, and update the `publications` schema so homepage curation can rely on an explicit `selected` flag:

```ts
const socials = defineCollection({
  loader: file("src/content/socials.json"),
  schema: z.object({
    id: z.number(),
    icon: z.union([lucideIconSchema, simpleIconSchema]),
    text: z.string(),
    link: z.string().url().optional(),
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
      selected: z.boolean().optional(),
      image: image().optional(),
      link: z.string().url().optional(),
    }),
});
```

- [ ] **Step 2: Add structured collections for awards, experience, and service/teaching**

Create file-backed collections with simple flat schemas:

```ts
const awards = defineCollection({
  loader: file("src/content/awards.json"),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    meta: z.string().optional(),
    year: z.number().optional(),
  }),
});
```

Mirror that pattern for:

- `experience.json`:

```ts
const experience = defineCollection({
  loader: file("src/content/experience.json"),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    organization: z.string(),
    period: z.string(),
    description: z.string().optional(),
  }),
});
```

- `service-teaching.json`:

```ts
const serviceTeaching = defineCollection({
  loader: file("src/content/service-teaching.json"),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    meta: z.string(),
    kind: z.enum(["service", "teaching", "talk"]),
  }),
});
```

Then export the collections from `src/content.config.ts`.

- [ ] **Step 3: Seed the approved CV content**

Populate:

- `src/content/awards.json` with the six approved awards, including `National Scholarship, 2025` and grouped `ShanghaiTech University Scholarship, 2021 - 2025`
- `src/content/experience.json` with the ShanghaiTech PhD role and Tencent CDG internship
- `src/content/service-teaching.json` with reviewer/service venues and `Teaching Assistant, Online Optimization and Learning (CS245), 2022 - 2025`

Example seed rows to lock field names:

```json
[
  { "id": 1, "title": "National Scholarship", "meta": "China", "year": 2025 }
]
```

```json
[
  {
    "id": 1,
    "title": "PhD Researcher",
    "organization": "ShanghaiTech University",
    "period": "2021.09 - Present"
  }
]
```

```json
[
  {
    "id": 1,
    "title": "Teaching Assistant, Online Optimization and Learning (CS245)",
    "meta": "2022 - 2025",
    "kind": "teaching"
  }
]
```

Also update:

- `src/content/socials.json` so only Google Scholar remains a live link, while the email is plain text `guohq (at) shanghaitech.edu.cn` and GitHub/CV use clear placeholders
- `src/content/info.json` so the quick facts emphasize `Reinforcement Learning`, `LLM Alignment`, and the approved academic profile
- `src/content/other/about.mdx` with a concise English academic summary that does not mention undergraduate education

- [ ] **Step 4: Mark the curated homepage publications**

Add `selected: true` to the 4-5 homepage papers and keep the publication metadata consistent enough for both homepage and `/publications` sorting.

- [ ] **Step 5: Run the targeted build to verify the collection schema is valid**

Run:

```bash
pnpm build
```

Expected: build succeeds and collection parsing passes without schema errors; the acceptance tests are still expected to fail until the new UI wiring lands.

- [ ] **Step 5a: Re-run the acceptance suite after seeding content**

Run:

```bash
pnpm verify:site
```

Expected: the suite still fails because the homepage and publications UI are not rewired yet, but failures are limited to page-shape expectations rather than schema or content-loading errors.

- [ ] **Step 6: Commit the data-model update**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init add src/content.config.ts src/content
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init commit -m "Add academic CV content collections"
```

Expected: content model and seed data are committed independently from the page layout changes.

## Chunk 2: Shared UI Components And Page Layout

### Task 3: Build A Shared Publication Teaser With Compact Cover Styling

**Files:**
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/PublicationTeaser.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/index.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article-list.css`

- [ ] **Step 1: Create a reusable publication teaser component**

Create `src/components/PublicationTeaser.astro` that accepts one publication entry and a compact/full variant:

```astro
---
const { publication, href, variant = "compact" } = Astro.props;
---

<a href={href} class:list={["publication-teaser", variant]}>
  <div class="publication-cover" aria-hidden="true">
    <span class="publication-badge">{publication.data.venue}</span>
    <strong>{publication.data.year}</strong>
  </div>
  <div class="publication-copy">
    <div class="post-header">
      <h3>{publication.data.title}</h3>
      <span class="post-date">{publication.data.year}</span>
    </div>
    <span>{publication.data.venue} / {publication.data.authors}</span>
  </div>
</a>
```

- [ ] **Step 1a: Keep teaser links explicit and safe**

Derive the `href` in each page context instead of hard-coding it inside the component. Use the internal detail route only where it already exists (`/publications/${publication.id}`), and prefer `publication.data.link` as the fallback when a detail page is not available. When the teaser renders an external link in a new tab, require the site's safe-link attributes such as `rel="noopener noreferrer"`.

- [ ] **Step 2: Add a consistent fallback cover treatment**

Style the teaser so the cover is a small fixed-ratio badge panel rather than a missing image hole. Keep it decorative with `aria-hidden="true"` and a stable ratio such as `3 / 4`.

- [ ] **Step 3: Reuse the same component in both list contexts**

Keep compact spacing for the homepage and a roomier variant for `/publications`, but do not fork the markup into two separate ad-hoc implementations.

- [ ] **Step 4: Run the test command to keep the TDD loop active**

Run:

```bash
pnpm test
```

Expected: still FAIL until the pages are updated, but no component import or CSS build errors appear.

### Task 4: Rebuild The Homepage Hero And Academic Sections

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/index.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-1.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-2.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/projects/project-placeholder-3.mdx`

- [ ] **Step 1: Load the new content collections on the homepage**

Update `src/pages/index.astro` to fetch:

- `awards`
- `experience`
- `serviceTeaching`
- `socials`
- `quickInfo`
- `about`
- selected publications only
- projects

and to sort publications reverse-chronologically before slicing or filtering.

- [ ] **Step 2: Move `About me` into the hero’s right side**

Keep the left column for avatar, name, affiliation, interests, and links. Replace the old stacked-card layout on the right with a hero-adjacent `About me` card so the upper fold is balanced.

The left-column links must explicitly render:

- Google Scholar with the confirmed live URL
- `guohq (at) shanghaitech.edu.cn` as plain text, not `mailto:`
- GitHub and CV as obvious placeholders

- [ ] **Step 3: Add the three new academic sections in homepage order**

Render `Awards`, `Experience`, and `Academic Service & Teaching` as compact cards beneath `Selected Publications`, followed by the existing placeholder projects.

Explicitly omit:

- phone number
- undergraduate institution

- [ ] **Step 4: Normalize placeholder project copy**

Update the three placeholder project MDX files so they use consistent `Project Placeholder 1/2/3` naming and `Coming soon`-style descriptions.

- [ ] **Step 5: Add responsive styling**

Ensure:

- hero collapses to one column on small screens
- publication teaser covers stay aligned
- the new CV sections do not overflow or create large empty gutters

- [ ] **Step 6: Run the full verification command**

Run:

```bash
pnpm verify:site
```

Expected: homepage-related assertions now pass; remaining failures, if any, should be isolated to `/publications` or nav wording.

- [ ] **Step 7: Commit the homepage redesign**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init add src/pages/index.astro src/styles/index.css src/content/projects src/components/PublicationTeaser.astro src/styles/article-list.css
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init commit -m "Redesign homepage as academic CV landing page"
```

Expected: the homepage CV transformation is isolated in its own commit.

### Task 5: Align The Publications Route And Navbar With The Approved IA

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Navbar.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article-list.css`

- [ ] **Step 1: Rename the nav item to `Full Publications`**

Update `src/components/Navbar.astro` so the `/publications` link label is `Full Publications`, keeps correct active-state behavior, and preserves the search + projects items unless they now conflict with the approved layout.

- [ ] **Step 2: Make `/publications` the canonical full listing page**

Update `src/pages/publications.astro` to:

- use the shared `PublicationTeaser` component
- pass an explicit `href` for each teaser
- sort publications reverse-chronologically
- present the page as a fuller publication index rather than another “selected” list

- [ ] **Step 3: Keep the page left rail useful but minimal**

Retain lightweight stats or summary content only if it still helps scanability; otherwise simplify rather than carrying forward irrelevant template chrome.

- [ ] **Step 4: Run the full verification command again**

Run:

```bash
pnpm verify:site
```

Expected: all tests pass and the built site includes the updated nav + publications route behavior.

- [ ] **Step 5: Commit the navigation/publications alignment**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init add src/components/Navbar.astro src/pages/publications.astro src/styles/article-list.css
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init commit -m "Align publications route with academic navigation"
```

Expected: nav wording and full-publications page behavior are committed separately from the homepage redesign.

## Chunk 3: Final Verification And Branch Finish

### Task 6: Verify The Final Site And Prepare The Branch For Handoff

**Files:**
- Context only: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init`

- [ ] **Step 1: Run a runtime sanity check**

Run:

```bash
pnpm install
timeout 20s pnpm dev --host 127.0.0.1
```

Expected: dependencies resolve successfully and the Astro dev server starts without configuration/runtime errors before `timeout` stops it.

- [ ] **Step 2: Run the final verification suite**

Run:

```bash
pnpm verify:site
```

Expected: PASS with all acceptance tests green, including the checks for `/publications`, `Full Publications`, obfuscated email text without `mailto:`, no `tel:`, Google Scholar href, the homepage CV sections, visible project placeholders, and the excluded undergraduate institution.

- [ ] **Step 3: Run a small-screen and semantics smoke check**

Use Playwright or an equivalent browser tool against the local dev server to confirm:

- the hero places `About me` in the right-side column on desktop
- the hero collapses cleanly into one column on a small viewport such as `375px` wide
- `/publications` shows the active nav state for `Full Publications`
- `Selected Publications` still shows the compact cover-style visual treatment
- decorative publication covers remain `aria-hidden="true"`, and if any real cover images are introduced they use meaningful `alt` text
- external links keep safe-link attributes where applicable
- placeholder text such as `Coming soon` remains visible where expected

Expected: desktop and mobile browser inspection confirms the spec-critical layout, responsive, nav-state, accessibility, and placeholder details that static HTML assertions do not fully cover.

- [ ] **Step 4: Inspect the working tree**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init status --short
```

Expected: only intentional tracked changes remain; generated preview artifacts such as `dist/`, `.astro/`, `output/`, and `tmp/` stay uncommitted.

- [ ] **Step 5: Review the diff before handoff**

Run:

```bash
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init log --oneline --decorate --graph --max-count=20
git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init diff --stat "$(git -C /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init merge-base HEAD main)"..HEAD
```

Expected: the branch history reflects the TDD/content/layout/nav progression and the diff is scoped to the full approved academic homepage work, not just the last few commits.

- [ ] **Step 6: Use `superpowers:finishing-a-development-branch`**

After verification passes, present the user with the standard merge / PR / keep / discard options instead of assuming the integration path.

Expected: the branch-finish step ends with a recorded user decision about integration, such as merge locally, open a PR, keep the branch for later, or discard it.
