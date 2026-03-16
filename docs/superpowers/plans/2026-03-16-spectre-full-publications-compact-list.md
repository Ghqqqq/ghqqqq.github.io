# Spectre Full Publications Compact List Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `/publications` page to a compact no-cover publication list while leaving homepage publication cards untouched.

**Architecture:** Extend `PublicationTeaser` with a new list-focused variant and point the full publications page at that variant. Verify the change with targeted assertions that distinguish the full list from the homepage teaser layout.

**Tech Stack:** Astro, content collections, component-scoped CSS, Node test runner

---

## Chunk 1: Red-Green Coverage

### Task 1: Add failing compact-list expectations

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/tests/site.test.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions that the full publications page:
- includes a compact-list marker
- omits the cover block marker for full-page items
- still includes existing publication titles and status labels

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/site.test.mjs`
Expected: FAIL because the current full publications page still uses the cover layout.

### Task 2: Implement the list variant

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/pages/publications.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/components/PublicationTeaser.astro`

- [ ] **Step 3: Write minimal implementation**

Add a `list` variant to `PublicationTeaser` that:
- removes the cover block
- keeps title, authors, venue, year, and status
- uses compact spacing suitable for the full publications page

Update `/publications` to use that variant.

- [ ] **Step 4: Run targeted verification**

Run: `pnpm build && pnpm test tests/site.test.mjs`
Expected: PASS

## Chunk 2: Full Verification

### Task 3: Verify and commit

**Files:**
- No additional files unless verification reveals regressions

- [ ] **Step 5: Run full verification**

Run: `pnpm verify:site`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tests/site.test.mjs src/pages/publications.astro src/components/PublicationTeaser.astro
git commit -m "Compact full publications list layout"
```
