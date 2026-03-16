# Spectre Profile Rail And Avatar Motion Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generated avatar with a transparent cutout of the user's original image, add subtle avatar pointer motion, tighten the profile rail, move `Experience` below `About me`, and simplify `Awards` into a plain text list.

**Architecture:** Keep the current Astro page structure, but reorganize the homepage data presentation in `src/pages/index.astro` and supporting CSS. Handle avatar cleanup as a local asset-generation step, and keep the motion effect lightweight by using a small client-side pointer script rather than a heavy animation dependency.

**Tech Stack:** Astro 6, TypeScript, Astro assets, Node built-in test runner, CSS, Python 3 + Pillow.

---

## File Structure

- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/tests/site.test.mjs`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/components/ImageGlow.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/styles/index.css`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/info.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/socials.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/assets/profile-bird-original.png`

## Chunk 1: Homepage Contract

### Task 1: Add Failing Tests For Profile Rail Layout And Awards Simplification

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/tests/site.test.mjs`

- [ ] **Step 1: Add assertions for the new homepage order**

Add a homepage assertion that checks:

```js
assert.match(
  html,
  /About me[\s\S]*Experience[\s\S]*Awards[\s\S]*Academic Service(?:\s*&amp;\s*|\s*&\s*)Teaching/,
);
```

- [ ] **Step 2: Add assertions for the profile rail**

Add assertions that:

```js
assert.match(html, /Hengquan Guo[\s\S]*ShanghaiTech University/);
assert.match(html, /Google Scholar/);
assert.match(html, /guohq \(at\) shanghaitech\.edu\.cn/);
assert.doesNotMatch(html, /GitHub \(Coming soon\)/);
assert.doesNotMatch(html, /CV \(Coming soon\)/);
assert.match(html, /Research Interests/);
assert.doesNotMatch(html, /<h3[^>]*>\s*Links\s*<\/h3>/);
```

- [ ] **Step 3: Add assertions for the original avatar and motion hook**

Add assertions that:

```js
assert.match(html, /profile-bird-original/);
assert.match(html, /data-avatar-parallax/);
```

- [ ] **Step 4: Add assertions that awards are no longer boxed**

Add assertions that:

```js
assert.match(html, /awards-text-list/);
assert.doesNotMatch(html, /award-entry/);
```

- [ ] **Step 5: Run the test file and verify it fails**

Run: `pnpm test tests/site.test.mjs`
Expected: FAIL because the homepage still uses the current avatar asset, still renders the `Links` card, still places `Awards` before `Experience`, and still uses boxed award entries.

- [ ] **Step 6: Commit the red-state tests**

Run:

```bash
git add tests/site.test.mjs
git commit -m "Add failing profile rail refresh tests"
```

## Chunk 2: Content And Asset Updates

### Task 2: Trim Visible Link Data And Prepare The Original Avatar Asset

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/socials.json`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/content/info.json`
- Create: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/assets/profile-bird-original.png`

- [ ] **Step 1: Reduce visible socials to the approved two entries**

Update `socials.json` so it only includes:
- `Google Scholar`
- `guohq (at) shanghaitech.edu.cn`

- [ ] **Step 2: Remove the institution from the research-interest list**

Update `info.json` so it only contains research-interest items, not `ShanghaiTech University`.

- [ ] **Step 3: Generate a transparent asset from the original image**

Use Pillow to read:

`/Users/ghq/Documents/homepage/00c8c994-feb5-41ef-ab83-f397dcd6d169.png`

and write a conservative transparent cutout to:

`src/assets/profile-bird-original.png`

- [ ] **Step 4: Verify the new asset is RGBA**

Run a quick check with Python or `file`.
Expected: PNG with transparency present.

- [ ] **Step 5: Run a build**

Run: `pnpm build`
Expected: PASS. The site should still build even before the layout refresh lands.

- [ ] **Step 6: Commit the data and asset prep**

Run:

```bash
git add src/content/socials.json src/content/info.json src/assets/profile-bird-original.png
git commit -m "Prepare profile rail data and avatar asset"
```

## Chunk 3: Homepage Layout And Motion

### Task 3: Rebuild The Profile Rail, Move Experience, And Simplify Awards

**Files:**
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/pages/index.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/components/ImageGlow.astro`
- Modify: `/Users/ghq/Documents/homepage/.worktrees/codex/profile-rail-refresh/src/styles/index.css`

- [ ] **Step 1: Switch the homepage avatar import**

Replace the generated avatar asset import with `profile-bird-original.png`.

- [ ] **Step 2: Rebuild the left identity card**

Render:
- avatar
- `Hengquan Guo`
- `ShanghaiTech University`
- inline link row

Remove the separate `Links` card.

- [ ] **Step 3: Turn the secondary left card into `Research Interests`**

Move the current quick-info list into a dedicated `Research Interests` block.

- [ ] **Step 4: Move `Experience` directly below `About me`**

Reorder the right-column cards to:
- `About me`
- `Experience`
- `Awards`
- remaining sections

- [ ] **Step 5: Simplify awards markup**

Render awards as a plain text list with one column and wrapping text. Do not use boxed item containers.

- [ ] **Step 6: Add the avatar parallax hook**

Implement a small client-side script that:
- watches pointer movement over the avatar area
- applies a small clamped `translate` transform
- resets smoothly on pointer leave
- remains static for coarse pointers

- [ ] **Step 7: Style the new layout**

Update CSS so:
- links are inline and compact
- research interests are visually lighter than before
- awards appear as a text list
- avatar motion feels smooth without causing layout shift

- [ ] **Step 8: Run the focused test file**

Run: `pnpm test tests/site.test.mjs`
Expected: PASS.

- [ ] **Step 9: Run the full site verification**

Run: `pnpm verify:site`
Expected: PASS.

- [ ] **Step 10: Commit the implementation**

Run:

```bash
git add src/pages/index.astro src/components/ImageGlow.astro src/styles/index.css
git commit -m "Refresh profile rail and avatar motion"
```
