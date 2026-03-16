# Spectre Academic Homepage Initialization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize a Spectre-based Astro homepage for Hengquan Guo and adapt the default blog template into an academic-first site with publications and placeholder projects.

**Architecture:** Start from the upstream `louisescher/spectre` template, preserve its visual system and Astro structure, then replace blog-oriented homepage semantics with academic equivalents. Reuse the existing content-driven approach where it stays clean, but introduce a dedicated `publications` route and collection so the public site no longer exposes blog wording or sample Spectre identity content.

**Tech Stack:** Astro 6, TypeScript, MDX content collections, PNPM/Corepack, Node.js built-in test runner

---

## Chunk 1: Workspace And Template Bootstrap

### Task 1: Prepare The Isolated Workspace And Local Tooling

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.gitignore`
- Create: `/Users/ghq/Documents/homepage/.worktrees/` or external worktree directory
- Context: `/Users/ghq/Documents/homepage/docs/superpowers/specs/2026-03-16-spectre-academic-homepage-design.md`

- [ ] **Step 1: Confirm the worktree location with the user**

Ask exactly one concise question if neither `.worktrees/` nor `worktrees/` exists:

```text
No worktree directory exists yet. Should I create the isolated branch in `.worktrees/` inside this repo, or in `~/.config/superpowers/worktrees/homepage/`?
```

- [ ] **Step 2: Install Node.js if it is missing**

Run:

```bash
node -v
```

If missing, run:

```bash
brew install node
```

Expected: `node -v` succeeds after installation.

- [ ] **Step 3: Add local ignore rules if using a project-local worktree**

If the user chooses `.worktrees/` or `worktrees/`, update `/Users/ghq/Documents/homepage/.gitignore` with:

```gitignore
.DS_Store
.worktrees/
worktrees/
```

Run:

```bash
git -C /Users/ghq/Documents/homepage add .gitignore
git -C /Users/ghq/Documents/homepage commit -m "Add local workspace ignore rules"
```

Expected: commit succeeds before any worktree is created.

- [ ] **Step 4: Create the isolated worktree on a feature branch**

Use a `codex/` branch name:

```bash
git -C /Users/ghq/Documents/homepage worktree add /Users/ghq/Documents/homepage/.worktrees/codex/spectre-init -b codex/spectre-init
```

If the user chooses the global location, adapt only the destination path.

Expected: a clean worktree exists on branch `codex/spectre-init`.

- [ ] **Step 5: Verify the worktree starts clean**

Run:

```bash
git -C <worktree-path> status --short
```

Expected: no tracked file changes.

- [ ] **Step 6: Commit any workspace-only setup**

If Step 3 changed `.gitignore`, that commit is already done. Otherwise skip this step.

### Task 2: Import The Spectre Template And Verify The Baseline Build

**Files:**
- Create: `/Users/ghq/Documents/homepage/package.json`
- Create: `/Users/ghq/Documents/homepage/astro.config.ts`
- Create: `/Users/ghq/Documents/homepage/pnpm-lock.yaml`
- Create: `/Users/ghq/Documents/homepage/pnpm-workspace.yaml`
- Create: `/Users/ghq/Documents/homepage/src/**`
- Create: `/Users/ghq/Documents/homepage/public/**`
- Create: `/Users/ghq/Documents/homepage/package/**`

- [ ] **Step 1: Clone the upstream Spectre template into a temporary directory**

Run:

```bash
tmpdir=$(mktemp -d /tmp/spectre-init.XXXXXX)
git clone --depth 1 https://github.com/louisescher/spectre.git "$tmpdir"
echo "$tmpdir"
```

Expected: a temporary checkout exists and prints its path.

- [ ] **Step 2: Copy the upstream template into the isolated worktree without copying `.git`**

Run:

```bash
rsync -a --exclude '.git' "$tmpdir"/ <worktree-path>/
```

Expected: Spectre project files appear in the worktree.

- [ ] **Step 3: Enable Corepack and install dependencies**

Run:

```bash
corepack enable
pnpm install
```

Expected: dependencies install successfully in the worktree.

- [ ] **Step 4: Run the unmodified baseline build**

Run:

```bash
pnpm build
```

Expected: the upstream template builds successfully before customization.

- [ ] **Step 5: Commit the imported baseline**

Run:

```bash
git add .
git commit -m "Import Spectre template baseline"
```

Expected: one commit containing the upstream starting point.

## Chunk 2: TDD For Academic Homepage Behavior

### Task 3: Write A Failing Site-Shape Test For The Academic Homepage

**Files:**
- Modify: `<worktree-path>/package.json`
- Create: `<worktree-path>/tests/site.test.mjs`

- [ ] **Step 1: Add a test script to `package.json`**

Add:

```json
{
  "scripts": {
    "test": "node --test tests/site.test.mjs",
    "verify:site": "pnpm build && pnpm test"
  }
}
```

- [ ] **Step 2: Write the failing test for the required public site shape**

Create `<worktree-path>/tests/site.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readBuilt(relativePath) {
  try {
    return await readFile(resolve("dist", relativePath), "utf8");
  } catch {
    return null;
  }
}

test("homepage exposes academic identity instead of Spectre demo copy", async () => {
  const html = await readBuilt("index.html");

  assert.ok(html, "expected built homepage HTML");
  assert.match(html, /Hengquan Guo/);
  assert.match(html, /ShanghaiTech University/);
  assert.match(html, /Selected Publications/);
  assert.match(html, /Reinforcement Learning/);
  assert.match(html, /LLM Alignment/);
  assert.doesNotMatch(html, /Latest Posts/);
  assert.doesNotMatch(html, /Work Experience/);
  assert.doesNotMatch(html, /Made in Germany/);
});

test("publications page exists and project placeholders are visible", async () => {
  const publicationsHtml = await readBuilt("publications/index.html");
  const homepageHtml = await readBuilt("index.html");

  assert.ok(publicationsHtml, "expected built publications index");
  assert.match(publicationsHtml, /Selected Publications|Publications/);
  assert.match(publicationsHtml, /Online convex optimization with hard constraints/i);

  assert.ok(homepageHtml, "expected built homepage HTML");
  assert.match(homepageHtml, /Project Placeholder 1/);
  assert.match(homepageHtml, /Project Placeholder 2/);
  assert.match(homepageHtml, /Project Placeholder 3/);
});
```

- [ ] **Step 3: Run the verification command and watch it fail**

Run:

```bash
pnpm verify:site
```

Expected: FAIL because the unmodified template still renders Spectre demo content and has no `/publications` page.

- [ ] **Step 4: Commit the failing test scaffold**

Run:

```bash
git add package.json tests/site.test.mjs
git commit -m "Add failing academic homepage site-shape tests"
```

Expected: commit succeeds with intentionally failing tests on top of the baseline.

### Task 4: Implement The Academic Homepage, Publications, And Placeholder Projects

**Files:**
- Modify: `<worktree-path>/astro.config.ts`
- Modify: `<worktree-path>/src/content.config.ts`
- Modify: `<worktree-path>/src/components/Navbar.astro`
- Modify: `<worktree-path>/src/pages/index.astro`
- Modify: `<worktree-path>/src/pages/projects.astro`
- Modify: `<worktree-path>/src/content/info.json`
- Modify: `<worktree-path>/src/content/socials.json`
- Modify: `<worktree-path>/src/content/work.json`
- Modify: `<worktree-path>/src/content/other/about.mdx`
- Create: `<worktree-path>/src/pages/publications.astro`
- Create: `<worktree-path>/src/pages/publications/[publication].astro`
- Create: `<worktree-path>/src/content/publications/online-convex-optimization-hard-constraints.mdx`
- Create: `<worktree-path>/src/content/publications/rectified-pessimistic-optimistic-learning.mdx`
- Create: `<worktree-path>/src/content/publications/stochastic-constrained-contextual-bandits.mdx`
- Create: `<worktree-path>/src/content/publications/contextual-bandits-knapsacks-small-budget.mdx`
- Create: `<worktree-path>/src/content/publications/triple-optimistic-learning-general-constraints.mdx`
- Create: `<worktree-path>/src/content/projects/project-placeholder-1.mdx`
- Create: `<worktree-path>/src/content/projects/project-placeholder-2.mdx`
- Create: `<worktree-path>/src/content/projects/project-placeholder-3.mdx`
- Delete: `<worktree-path>/src/pages/blog.astro`
- Delete: `<worktree-path>/src/pages/blog/[post].astro`
- Delete: `<worktree-path>/src/content/posts/getting-started.mdx`
- Delete: `<worktree-path>/src/content/projects/spectre.mdx`

- [ ] **Step 1: Make the smallest content/configuration changes needed to satisfy the first homepage assertions**

Implement:

```ts
// astro.config.ts
spectre({
  name: "Hengquan Guo",
  openGraph: {
    home: {
      title: "Hengquan Guo",
      description: "Academic homepage for Hengquan Guo.",
    },
    blog: {
      title: "Publications",
      description: "Selected publications and research outputs.",
    },
    projects: {
      title: "Projects",
      description: "Research and engineering projects.",
    },
  },
})
```

Replace demo quick info in `src/content/info.json` with:

```json
[
  {
    "id": 1,
    "icon": { "type": "lucide", "name": "building-2" },
    "text": "ShanghaiTech University"
  },
  {
    "id": 2,
    "icon": { "type": "lucide", "name": "brain" },
    "text": "Reinforcement Learning"
  },
  {
    "id": 3,
    "icon": { "type": "lucide", "name": "sparkles" },
    "text": "LLM Alignment"
  },
  {
    "id": 4,
    "icon": { "type": "lucide", "name": "badge-help" },
    "text": "Constrained Optimization / Online Learning / Bandit"
  }
]
```

- [ ] **Step 2: Replace navigation and homepage section wording**

Implement:

```astro
<!-- src/components/Navbar.astro -->
<a href="/publications" class:list={{ active: path.startsWith("/publications") }}>
  Publications
</a>
```

Update `src/pages/index.astro` so the right-column cards become:

- `About`
- `Selected Publications`
- `Projects`

and remove the homepage `Work Experience` card entirely.

- [ ] **Step 3: Introduce a dedicated `publications` collection and route**

Add a `publications` collection in `src/content.config.ts` mirroring the former posts schema without tags:

```ts
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
```

Create `src/pages/publications.astro` and `src/pages/publications/[publication].astro` by adapting the old blog routes to publications terminology.

- [ ] **Step 4: Replace demo content with Scholar-derived publications and placeholders**

Create five publication entries based on the approved Scholar-derived list and placeholder-friendly metadata. Update:

- `src/content/socials.json` with:
  - real Google Scholar URL
  - placeholder email
  - placeholder GitHub
  - placeholder CV
- `src/content/other/about.mdx` with concise English placeholder biography text
- `src/content/work.json` to `[]`
- `src/content/projects/` with exactly three placeholder entries titled:
  - `Project Placeholder 1`
  - `Project Placeholder 2`
  - `Project Placeholder 3`

- [ ] **Step 5: Remove public demo pages and sample content**

Delete:

```text
src/pages/blog.astro
src/pages/blog/[post].astro
src/content/posts/getting-started.mdx
src/content/projects/spectre.mdx
```

Expected: no public Spectre demo identity remains reachable from the homepage flow.

- [ ] **Step 6: Run the test suite and make it pass**

Run:

```bash
pnpm verify:site
```

Expected: PASS, with the academic homepage assertions now satisfied.

- [ ] **Step 7: Refactor lightly if needed while keeping tests green**

Allowed cleanup:

- simplify duplicated publication-card rendering
- improve labels or placeholder wording
- adjust route titles

Do not add extra features such as auto-sync, CV generation, or deployment config.

- [ ] **Step 8: Commit the academic initialization**

Run:

```bash
git add astro.config.ts package.json src tests
git commit -m "Initialize academic homepage from Spectre"
```

Expected: commit succeeds with passing tests.

## Chunk 3: Verification And Handoff

### Task 5: Verify The Build Output And Working Tree State

**Files:**
- Verify only: `<worktree-path>/dist/**`

- [ ] **Step 1: Run the final verification commands fresh**

Run:

```bash
pnpm build
pnpm test
git status --short
```

Expected:

- `pnpm build` exits 0
- `pnpm test` exits 0
- `git status --short` shows only expected tracked changes, or a clean tree if the final commit already happened

- [ ] **Step 2: Manually inspect the built HTML for the highest-risk user-facing strings**

Run:

```bash
rg -n "Hengquan Guo|Selected Publications|Project Placeholder|Latest Posts|Work Experience" dist
```

Expected:

- required academic strings are present
- `Latest Posts` and `Work Experience` are absent from built homepage output

- [ ] **Step 3: Commit any final cleanup if needed**

Run:

```bash
git add -A
git commit -m "Polish academic homepage initialization"
```

Only do this if Step 2 required a real follow-up change.

- [ ] **Step 4: Hand off for branch completion**

Use `superpowers:finishing-a-development-branch` after the implementation and verification steps are complete.
