# Spectre Academic Homepage Theme And Publications Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Spectre academic homepage with an ivory-by-default light theme, a persisted light/dark toggle, a denser CV-first homepage layout, a transparent bird avatar, and a complete CV-backed `Full Publications` page.

**Architecture:** Keep the existing Astro content-collection structure, but extend publication metadata with explicit status fields so one content source can power both the curated homepage and the exhaustive `/publications` route. Move theme logic into layout-level HTML/data attributes and CSS variables so light and dark modes share the same component structure without duplicating templates or hardcoding dark-only values.

**Tech Stack:** Astro 6, TypeScript, Astro content collections, MDX, Astro assets, PNPM, Node.js built-in test runner, Python 3 + Pillow for avatar background cleanup if needed.

---

## File Structure

- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/tests/site.test.mjs`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/astro.config.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content.config.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications/[publication].astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/layouts/Layout.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Navbar.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Card.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/ImageGlow.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/PublicationTeaser.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Background.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/scripts/page-background.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/reset.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/globals.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/background.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/index.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article-list.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/awards.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/experience.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/contextual-bandits-knapsacks-small-budget.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/enhancing-safety-rlhf-rectified-policy-optimization.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/online-convex-optimization-hard-constraints.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/rectified-pessimistic-optimistic-learning.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/stochastic-constrained-contextual-bandits.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/towards-safe-optimal-online-bidding-modular-look-ahead-lyapunov-framework.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/triple-optimistic-learning-general-constraints.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/assets/profile-bird.png`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/ThemeToggle.astro`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/pobo-safe-optimal-resource-management-cloud-microservices.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/learning-to-schedule-online-tasks-with-bandit-feedback.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/queueflower-orchestrating-microservice-workflows-dynamic-queue-balancing.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/safe-learning-stochastic-continuum-armed-bandit-network-resource-management.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/on-the-power-of-optimism-in-constrained-online-convex-optimization.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/no-regret-reinforcement-learning-algorithms-online-scheduling-multi-stage-tasks.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/sabo-safe-aggressive-bayesian-optimization-legged-locomotion-controller-tuning.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/towards-temporal-interest-modeling-in-recommendation-via-reinforcement-learning.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/grb-generative-reinforcement-bidding-framework-multi-channel-online-advertising.mdx`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/publications/block-open-source-bi-stage-mllm-character-to-skin-pipeline.mdx`

## Chunk 1: Acceptance Contract And Publication Data

### Task 1: Add Failing Tests For Theme, Homepage Order, And Full Publication Coverage

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/tests/site.test.mjs`

- [ ] **Step 1: Add a homepage contract test for the reordered sections and light-theme shell**

Add a new assertion block that checks:

```js
assert.match(html, /data-theme="light"/);
assert.match(html, /id="theme-toggle"/);
assert.match(
  html,
  /About me[\s\S]*Awards[\s\S]*Academic Service(?:\s*&amp;\s*|\s*&\s*)Teaching[\s\S]*Experience[\s\S]*Selected Publications[\s\S]*Projects/,
);
assert.doesNotMatch(html, /PhD Researcher/);
assert.match(html, /Research Intern/);
```

- [ ] **Step 2: Add a publications-page contract for the missing CV titles and status labels**

Add assertions like:

```js
assert.match(publicationsHtml, /POBO: Safe and Optimal Resource Management for Cloud Microservices/);
assert.match(publicationsHtml, /SABO: Safe and Aggressive Bayesian Optimization for Automatic Legged Locomotion Controller Tuning/);
assert.match(publicationsHtml, /Submitted|Preprint|ArXiv|Journal/);
```

- [ ] **Step 3: Add an avatar/theme test**

Add assertions that the homepage HTML references the new avatar asset and exposes the toggle button near the shell:

```js
assert.match(html, /profile-bird/);
assert.match(html, /theme-toggle/);
```

- [ ] **Step 4: Run the test file to verify it fails for the expected reasons**

Run:

```bash
pnpm test tests/site.test.mjs
```

Expected: FAIL because the current homepage is still dark-only, still shows the old section order, still contains the PhD role, and `/publications` is incomplete.

- [ ] **Step 5: Commit the failing test update**

Run:

```bash
git add tests/site.test.mjs
git commit -m "Add failing homepage refresh acceptance tests"
```

Expected: commit succeeds with a red-state contract for the refresh.

### Task 2: Extend Publication Metadata And Seed The Missing CV Entries

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content.config.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/experience.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/content/awards.json`
- Modify: existing selected publication MDX files listed above
- Create: the ten missing publication MDX files listed in File Structure

- [ ] **Step 1: Extend the publication schema with explicit status support**

Update the publications collection schema so it includes:

```ts
status: z.enum(["conference", "journal", "submitted", "preprint"]).optional(),
venueShort: z.string().optional(),
homepageCategory: z
  .enum([
    "agent-llm-alignment",
    "recommendation-bidding",
    "reinforcement-learning-bandits",
  ])
  .optional(),
```

- [ ] **Step 2: Update the existing selected publications to carry `status`**

Set the currently accepted conference papers to `status: "conference"`, and the TON paper to `status: "journal"` when that item is created or edited.

- [ ] **Step 3: Add the missing accepted and journal papers from the CV**

Create MDX entries for:

```text
POBO
Learning to Schedule Online Tasks with Bandit Feedback
QueueFlower
Safe Learning in Stochastic Continuum-Armed Bandit With Constraints and Its Application to Network Resource Management
On the Power of Optimism in Constrained Online Convex Optimization
No Regret Reinforcement Learning Algorithms for Online Scheduling with Multi-Stage Tasks
```

Use:
- `status: "conference"` for AAMAS/ICWS/IJCAI/Performance-style accepted conference entries
- `status: "journal"` for the TON paper

- [ ] **Step 4: Add the missing submitted and preprint entries from the CV**

Create MDX entries for:

```text
SABO
Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning
GRB
BLOCK
```

Use:
- `status: "submitted"` for ICRA/ICML/KDD submissions
- `status: "preprint"` for `BLOCK`

- [ ] **Step 5: Trim homepage experience to Tencent only**

Replace `src/content/experience.json` with a single row:

```json
[
  {
    "id": 1,
    "title": "Research Intern",
    "organization": "Tencent CDG",
    "period": "2025.06 - 2026.06",
    "description": "Studying reinforcement learning for recommendation and bidding, with one accepted ICLR paper, two active submissions, and two patents under review."
  }
]
```

- [ ] **Step 6: Keep awards data intact but prepare it for denser rendering**

Do not remove awards; only preserve ordering and metadata so the UI can tighten spacing later.

- [ ] **Step 7: Run the build to confirm the expanded content schema parses**

Run:

```bash
pnpm build
```

Expected: PASS. The site should build with the expanded publication set, but the new acceptance test should still fail until the UI is refreshed.

- [ ] **Step 8: Commit the content-model and publication-content changes**

Run:

```bash
git add src/content.config.ts src/content/experience.json src/content/awards.json src/content/publications
git commit -m "Expand publication content for homepage refresh"
```

Expected: commit succeeds with all CV publications represented in content files.

## Chunk 2: Theme System, Toolbar Removal, And Avatar Replacement

### Task 3: Introduce A Persisted Light/Dark Theme Toggle

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/astro.config.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/layouts/Layout.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Navbar.astro`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/ThemeToggle.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/reset.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/globals.css`

- [ ] **Step 1: Write the toggle shell into the layout before implementing styling**

Add a `ThemeToggle` component into the layout/nav shell so the built HTML includes:

```html
<button id="theme-toggle" type="button" aria-label="Toggle color theme">
```

and set the initial shell marker:

```html
<html lang="en" data-theme="light">
```

- [ ] **Step 2: Disable the Astro dev toolbar in config**

Update `astro.config.ts` with:

```ts
devToolbar: {
  enabled: false,
},
```

- [ ] **Step 3: Add minimal theme-toggle script behavior**

Implement a small inline script or component script that:
- reads `localStorage.getItem("theme")`
- defaults to `"light"`
- writes `document.documentElement.dataset.theme`
- persists the next value when the button is clicked

- [ ] **Step 4: Convert global color styling to CSS variables**

In `globals.css` and `reset.css`, define a light default and dark override, for example:

```css
:root {
  --page-bg: #f6f1e8;
  --surface: #fffdf8;
  --surface-strong: #ffffff;
  --border-color: #d8cbb8;
  --text-color: #2f241f;
  --muted-text: #7b6c60;
  --link-color: #9a3412;
  --primary: #9a3412;
  --primary-rgb: 154, 52, 18;
}

:root[data-theme="dark"] {
  --page-bg: #0b0b0b;
  --surface: #121212;
  --surface-strong: #191919;
  --border-color: #353535;
  --text-color: #ffffff;
  --muted-text: #c7c7c7;
  --link-color: #a277ff;
  --primary: #8c5cf5;
  --primary-rgb: 140, 92, 245;
}
```

- [ ] **Step 5: Update navbar colors to use the new theme variables**

Replace hardcoded white and dark backgrounds in `Navbar.astro` with variables such as `var(--text-color)`, `var(--surface)`, and `var(--border-color)`.

- [ ] **Step 6: Run the build and tests to verify the toggle markup exists and the toolbar no longer appears**

Run:

```bash
pnpm verify:site
```

Expected: homepage-order/publication assertions may still fail until Chunk 3, but the theme-shell and toolbar-related assertions should move closer to green. If the suite still fails on homepage structure, note the remaining failures and continue.

- [ ] **Step 7: Commit the theme-shell changes**

Run:

```bash
git add astro.config.ts src/layouts/Layout.astro src/components/Navbar.astro src/components/ThemeToggle.astro src/styles/reset.css src/styles/globals.css
git commit -m "Add persisted homepage theme toggle"
```

Expected: commit succeeds with theme plumbing and toolbar removal in place.

### Task 4: Replace The Placeholder Avatar With The Transparent Bird Image

**Files:**
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/assets/profile-bird.png`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/ImageGlow.astro`

- [ ] **Step 1: Save the supplied avatar into the assets pipeline**

Create a local source image file from the approved user-provided bird avatar and name the processed asset `src/assets/profile-bird.png`.

- [ ] **Step 2: If the gray background is opaque, remove it before use**

Run a small Pillow cleanup script that keys out the flat gray background:

```bash
python3 - <<'PY'
from PIL import Image

image = Image.open("tmp/avatar-source.png").convert("RGBA")
target = (128, 128, 128)
pixels = []
for rgba in image.getdata():
    if all(abs(channel - target[i]) <= 18 for i, channel in enumerate(rgba[:3])):
        pixels.append((0, 0, 0, 0))
    else:
        pixels.append(rgba)
image.putdata(pixels)
image.save("src/assets/profile-bird.png")
PY
```

Expected: output PNG has transparency where the flat gray background used to be.

- [ ] **Step 3: Swap the homepage import to the new avatar**

Change:

```ts
import ProfilePicture from "../assets/pfp.png";
```

to:

```ts
import ProfilePicture from "../assets/profile-bird.png";
```

- [ ] **Step 4: Update the avatar alt text**

Replace placeholder wording with:

```astro
alt="Blue bird profile avatar"
```

- [ ] **Step 5: Make the glow component safe for a light theme**

Reduce or soften the duplicate-image blur in `ImageGlow.astro` so the transparent avatar does not create a muddy halo on ivory backgrounds. Keep the effect subtle rather than removing it entirely.

- [ ] **Step 6: Run a focused build verification**

Run:

```bash
pnpm build
```

Expected: PASS. Astro should process the new PNG asset without image-pipeline errors.

- [ ] **Step 7: Commit the avatar replacement**

Run:

```bash
git add src/assets/profile-bird.png src/pages/index.astro src/components/ImageGlow.astro
git commit -m "Replace placeholder avatar with bird profile image"
```

Expected: commit succeeds with the new avatar wired into the homepage.

## Chunk 3: Homepage Reorder, Dense CV Sections, And Publication UI Refresh

### Task 5: Reorder The Homepage And Tighten Awards/Experience

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Card.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/index.css`

- [ ] **Step 1: Reorder the homepage cards to match the approved sequence**

Move the sections in `index.astro` so the rendered order is:

```text
About
Awards
Academic Service & Teaching
Experience
Selected Publications
Projects
```

- [ ] **Step 2: Keep `Experience` to the single Tencent entry**

Render whatever comes from the trimmed `experience.json` without reintroducing the PhD role in template logic.

- [ ] **Step 3: Tighten awards spacing**

Change the award entries from padded block cards to denser rows, for example:

```css
.section-entry.compact {
  gap: 0.2rem;
  padding: 0.65rem 0.85rem;
}
```

Use a dedicated compact class for awards if needed rather than shrinking all sections indiscriminately.

- [ ] **Step 4: Re-run the acceptance suite to verify homepage order and PhD removal**

Run:

```bash
pnpm test tests/site.test.mjs
```

Expected: homepage order and experience assertions PASS. Full-publications styling/status assertions may still need work in Task 6.

- [ ] **Step 5: Commit the homepage layout reorder**

Run:

```bash
git add src/pages/index.astro src/components/Card.astro src/styles/index.css
git commit -m "Reorder homepage sections for CV-first layout"
```

Expected: commit succeeds with the denser homepage structure.

### Task 6: Make Full Publications Exhaustive And Status-Aware

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/pages/publications/[publication].astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/PublicationTeaser.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article-list.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/article.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/scripts/page-background.ts`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/components/Background.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/spectre-init/src/styles/background.css`

- [ ] **Step 1: Update `PublicationTeaser` to prefer explicit `venueShort` and show status**

Render a metadata stack like:

```astro
<p class="publication-meta">{publication.data.venue}</p>
{publication.data.status && <p class="publication-status">{statusLabel}</p>}
```

with `statusLabel` derived from the enum:
- `conference` → `Published`
- `journal` → `Journal`
- `submitted` → `Submitted`
- `preprint` → `Preprint`

- [ ] **Step 2: Refresh the stats card on `/publications`**

Ensure `publications.length` reflects the full CV-backed count after the new entries are added.

- [ ] **Step 3: Make the publication detail page show explicit status when present**

Add the status line into both the sticky info card and the article header metadata row so submitted/preprint items are clearly labeled.

- [ ] **Step 4: Make the animated background theme-aware**

Update `page-background.ts` and `background.css` so:
- light mode uses a barely visible warm pattern or very low-opacity letters
- dark mode preserves the stronger animated effect
- switching themes updates the background colors without requiring reload

- [ ] **Step 5: Run the full verification command**

Run:

```bash
pnpm verify:site
```

Expected: PASS with all homepage/theme/publication assertions green.

- [ ] **Step 6: Run a manual browser check using Playwright**

Run:

```bash
pnpm dev --host 127.0.0.1 --port 4321
```

Then verify in the browser:
- light mode is ivory by default
- top-left toggle switches to dark and back
- the bird avatar is transparent
- awards look tighter
- `/publications` lists the full CV-derived set with visible status cues
- no Astro dev toolbar appears

- [ ] **Step 7: Commit the publication-page and background refinements**

Run:

```bash
git add src/pages/publications.astro src/pages/publications/[publication].astro src/components/PublicationTeaser.astro src/styles/article-list.css src/styles/article.css src/scripts/page-background.ts src/components/Background.astro src/styles/background.css
git commit -m "Complete publications page and theme-aware background"
```

Expected: commit succeeds with the refreshed publication UX and theme-aware background behavior.
