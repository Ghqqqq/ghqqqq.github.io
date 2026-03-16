# Spectre Awards and Selected Publications Tightening Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the homepage awards layout, correct the Tencent internship date, and broaden selected-publication coverage for the first two research groups.

**Architecture:** Keep the change data-first where possible. The homepage already reads content collections into grouped sections, so the work mostly consists of adding failing assertions, updating content/frontmatter, and simplifying the awards row markup plus CSS to match the denser presentation.

**Tech Stack:** Astro, content collections, JSON content files, MDX publications, Node test runner

---

## Chunk 1: Red-Green Test Coverage

### Task 1: Add failing homepage expectations

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/tests/site.test.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions for:
- Tencent internship period `2025.06 - 2026.02`
- new awards inline-row structure marker(s)
- `BLOCK`
- `Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning`
- `GRB: A Generative Reinforcement Bidding Framework for Multi-Channel Online Advertising`

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/site.test.mjs`
Expected: FAIL because the built output still reflects the previous homepage.

### Task 2: Update content and homepage rendering

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/experience.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/publications/block-open-source-bi-stage-mllm-character-to-skin-pipeline.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/publications/towards-temporal-interest-modeling-in-recommendation-via-reinforcement-learning.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/publications/grb-generative-reinforcement-bidding-framework-multi-channel-online-advertising.mdx`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/styles/index.css`

- [ ] **Step 3: Write minimal implementation**

Implement the smallest set of changes that make the new assertions pass:
- change the internship period string
- mark the three additional publications as selected and assign homepage categories
- flatten awards markup into a single row with inline meta and right-aligned year
- tighten the corresponding CSS

- [ ] **Step 4: Run targeted verification**

Run: `pnpm build && pnpm test tests/site.test.mjs`
Expected: PASS

## Chunk 2: Full Site Verification

### Task 3: Run complete verification and capture preview

**Files:**
- No source-file changes required unless verification reveals regressions

- [ ] **Step 5: Run full verification**

Run: `pnpm verify:site`
Expected: PASS with all tests green

- [ ] **Step 6: Capture an updated homepage screenshot**

Run the local preview and save a screenshot under:
`/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/output/playwright/`

- [ ] **Step 7: Commit**

```bash
git add tests/site.test.mjs src/content/experience.json src/content/publications/block-open-source-bi-stage-mllm-character-to-skin-pipeline.mdx src/content/publications/towards-temporal-interest-modeling-in-recommendation-via-reinforcement-learning.mdx src/content/publications/grb-generative-reinforcement-bidding-framework-multi-channel-online-advertising.mdx src/pages/index.astro src/styles/index.css
git commit -m "Tighten awards layout and expand selected publications"
```
