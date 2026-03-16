# Spectre Academic Homepage Design

## Summary

Adapt the imported [louisescher/spectre](https://github.com/louisescher/spectre) Astro theme into an English academic homepage for Hengquan Guo. The site should keep Spectre's visual identity, but the homepage should behave like a compact academic landing page rather than a blog index.

This revision expands the earlier initialization scope. The homepage should now present a stronger academic CV structure: a hero with profile + about text, selected publications with small visual covers, awards, experience, academic service and teaching, and a clear top navigation path to a dedicated `Full Publications` page.

## Goals

- Keep the Spectre template as the base instead of rebuilding the site from scratch.
- Preserve the theme's overall layout language and terminal-inspired personality.
- Present the site in English.
- Make the homepage academic-first and CV-aware rather than blog-first.
- Move `About me` into the right side of the personal-info hero area to reduce empty space.
- Keep `Selected Publications` on the homepage, but add a top-level `Full Publications` navigation entry for the complete list page.
- Add `Awards`, `Experience`, and `Academic Service & Teaching` sections to the homepage.
- Use confirmed data from the user's Google Scholar profile and Chinese CV PDF where provided.
- Leave unknown fields as obvious placeholders instead of inventing facts.

## Non-Goals

- Building an automatic Google Scholar sync pipeline.
- Building a full paper database or citation tooling beyond static content files.
- Publishing every CV detail on the homepage.
- Adding phone number, undergraduate education, or other information the user explicitly excluded.
- Completing final deployment, analytics, comments, or advanced SEO changes.

## Confirmed Source Data

### Public Google Scholar

As confirmed from the user's public Google Scholar profile on 2026-03-16:

- Name: `Hengquan Guo`
- Affiliation: `ShanghaiTech University`
- Scholar URL: `https://scholar.google.com/citations?user=8bGinucAAAAJ&hl=zh-CN`
- Preferred research interests to show, in this order:
  - `Reinforcement Learning`
  - `LLM Alignment`
  - `Constrained Optimization`
  - `Online Learning`
  - `Bandit`

`Minecraft` must not appear as a research interest, even if it appears on the Scholar profile.

### CV-Derived Content Approved By User

The following content is approved for homepage use:

- Email: `guohq (at) shanghaitech.edu.cn`
- Experience:
  - `PhD Researcher, ShanghaiTech University, 2021.09 - Present`
  - `Research Intern, Tencent CDG, 2025.06 - 2026.06`
- Awards:
  - `NeurIPS Top Reviewer (Top 5%), 2025`
  - `National Scholarship, 2025`
  - `ShanghaiTech University Scholarship, 2021 - 2025`
  - `Annual Conference on Learning Theory Travel Grant, 2024`
  - `ACM SIGMETRICS/IFIP Performance Travel Grant, 2023`
  - `Outstanding Teaching Assistant, ShanghaiTech University, 2023`
- Academic service / teaching signals:
  - reviewer or service entries for `NeurIPS`, `ICML`, `ICLR`, `IROS`, `IEEE/ACM TON`, and `JSAC`
  - `Teaching Assistant, Online Optimization and Learning (CS245), 2022 - 2025`
  - selected talks from the CV may be summarized if they fit cleanly

### Explicit Exclusions

- Do not show the phone number.
- Do not show the undergraduate institution.
- Do not add any unverified personal links or biography details as if they were confirmed.

## Information Architecture

The homepage should remain a Spectre-style landing page, but with academic-CV blocks instead of blog/work blocks.

### Top Navigation

The top navigation should expose the most important academic destinations:

- `Home`
- `Full Publications`
- any other existing minimal navigation items required by the template, if they remain relevant

`Full Publications` should route to the dedicated publications listing page at `/publications` rather than staying as a homepage anchor. The expected route file is `src/pages/publications.astro` unless the existing Spectre structure provides an equivalent page that already maps cleanly to `/publications`.

### Homepage Structure

The homepage should be ordered like this:

1. `Hero`
2. `Selected Publications`
3. `Awards`
4. `Experience`
5. `Academic Service & Teaching`
6. `Projects`

This order keeps the most decision-relevant academic information above the fold or close to it while still leaving room for future project expansion.

## Hero Design

The hero should use the homepage's two-column balance more effectively.

### Left Side

The left side should contain concise profile facts:

- avatar or placeholder avatar
- name
- affiliation
- research interests
- academic links

### Right Side

The right side should contain `About me` instead of leaving a large empty area. This should read as a short academic summary in English and can still contain limited placeholder copy where the user has not supplied a final biography.

The right-side `About me` block should feel like part of the hero, not a detached lower section.

On small screens, the hero should collapse into a single-column stack with the profile facts first and the `About me` block immediately after it.

## Contact And Links Policy

The profile link cluster should include:

- Google Scholar with the real URL
- school email rendered as plain obfuscated text: `guohq (at) shanghaitech.edu.cn`
- GitHub as a placeholder if no URL is yet confirmed
- CV as a placeholder if no public CV URL is yet confirmed

The email should not be rendered as a `mailto:` link. The phone number should not appear anywhere on the page.

## Homepage Content Sections

### Selected Publications

This section replaces the original Spectre blog emphasis on the homepage.

Requirements:

- show 4 to 5 curated papers
- prioritize relevance to RL, LLM alignment, constrained optimization, online learning, and bandits
- use the user's approved compact image treatment: each publication card/listing should include a small cover-style visual
- the visual can be a generated paper-cover/venue badge style treatment rather than a real paper figure if no real asset exists
- include title, venue, year, and a concise metadata line
- include a clear path to the publication detail page or external paper link where supported by the current content model
- use the same underlying publication records as the full publications page, with homepage curation controlled by a simple content flag such as `selected: true`

The homepage version should stay curated and compact. It is not the exhaustive list.

### Full Publications

The dedicated publications page should contain the broader publication list and be reachable from the top navigation. It should act as the canonical paper index for the site.

Requirements:

- keep the page clearly separate from the homepage's curated `Selected Publications`
- prioritize legibility and scanability over large card visuals
- support a fuller list than the homepage
- preserve the existing Spectre content-driven workflow where practical
- default to reverse-chronological ordering, with optional year grouping if that matches the current page structure cleanly

### Awards

The homepage should gain a compact `Awards` section containing the approved award list.

Presentation goals:

- keep the section concise and high-signal
- allow the `ShanghaiTech University Scholarship, 2021 - 2025` entry to appear as one grouped item rather than five separate rows
- order primarily by significance and recency

### Experience

The homepage should gain a short `Experience` section focused on the user's most relevant current research roles:

- `PhD Researcher, ShanghaiTech University, 2021.09 - Present`
- `Research Intern, Tencent CDG, 2025.06 - 2026.06`

This section should stay concise and should not expand into a full long-form CV timeline.

### Academic Service & Teaching

This homepage section should combine service and teaching into one compact block.

It should include:

- reviewer/service venues
- `Teaching Assistant, Online Optimization and Learning (CS245), 2022 - 2025`
- optional concise selected-talk highlights if they fit without making the section noisy

The section should emphasize academic contribution without becoming a dense bullet dump.

### Projects

Keep a `Projects` section as future-facing scaffold content.

Requirements:

- retain 3 placeholder entries for now
- label them clearly as placeholders or works in progress
- keep them visually consistent with the rest of the homepage

## Content Strategy

### Publications To Seed Initially

The initial curated publication set can continue to draw from the papers already identified from the public Scholar page, including representative work such as:

1. `Online convex optimization with hard constraints: Towards the best of two worlds and beyond`
2. `Rectified pessimistic-optimistic learning for stochastic continuum-armed bandit with constraints`
3. `Stochastic constrained contextual bandits via lyapunov optimization based estimation to decision framework`
4. `On stochastic contextual bandits with knapsacks in small budget regime`
5. `Triple-Optimistic Learning for Stochastic Contextual Bandits with General Constraints`

This set may be adjusted during implementation if a slightly different 4-to-5-paper mix produces a clearer homepage story, but the scope should remain curated rather than exhaustive.

### Placeholder Policy

The following items should remain placeholders unless the user later supplies confirmed public values:

- avatar image
- GitHub URL
- CV download URL
- detailed personal biography beyond the approved summary
- project details

Placeholders must be obvious and non-deceptive.

Presentation conventions should be consistent:

- text placeholders should use explicit labels such as `Coming soon` or `Pending`
- missing publication covers should use a consistent fallback visual treatment rather than collapsing the layout
- empty optional sections should either be hidden cleanly or show a short `No items yet` message; the implementation should pick one behavior and use it consistently across homepage sections

## Template Adaptation Direction

Implementation should prefer minimal structural disruption to the imported Spectre theme:

- reuse existing content collections where reasonable
- remove or hide demo identity content that conflicts with the academic homepage
- replace blog/work emphasis on the homepage with the approved academic sections
- keep the site easy to extend through content files

Large schema rewrites are acceptable only if they make the academic structure much cleaner and do not create unnecessary complexity.

## Content Model Direction

The existing Spectre content model includes profile info, socials, publications/posts, and projects. The implementation should adapt those pieces like this:

- `info` or equivalent profile metadata: personal facts, affiliation, interests, summary support
- `socials`: academic links and obfuscated contact display
- publication content collection: power both `Selected Publications` and `Full Publications`
- projects collection: keep placeholder projects

The same publication source files should ideally support both the homepage and the full publications page, with the homepage applying a curated subset rather than duplicating content in a second data source.

The minimal publication content interface should be explicit and implementation-friendly. Each publication record should support the fields needed by both views, such as:

- `title`
- `authors`
- `venue`
- `year`
- `selected`
- `cover` or equivalent visual metadata
- `links` for paper-detail destinations such as PDF, arXiv, project page, or code when available

If the current template already uses a slightly different naming convention, the implementation may map to that structure instead of forcing a large rewrite.

## Error Handling And Safety

- Do not invent personal facts.
- If a field is unknown, render a placeholder rather than a broken or empty UI.
- If the theme expects required assets or records, provide safe placeholder data so the build stays green.
- Preserve the user's privacy choices: no phone number, no undergraduate school, no scraped extras beyond the approved sources.
- Publication cover visuals should include consistent accessibility treatment: use descriptive `alt` text when the image conveys publication-specific information, or empty alt text when the cover is purely decorative.
- External publication links should open safely using the site's existing conventions, including `rel=\"noopener noreferrer\"` whenever a new tab is used.

## Verification

Before this design can be called implemented, verify:

- dependencies install successfully
- the Astro dev server starts
- the homepage renders without broken required content
- the hero shows `About me` on the right side of the personal-info area
- the hero collapses cleanly on mobile screens
- the homepage includes `Selected Publications`, `Awards`, `Experience`, `Academic Service & Teaching`, and `Projects`
- `Selected Publications` includes the compact cover-style visual treatment
- the top navigation links to `/publications` and the active route behaves correctly
- phone number is absent
- undergraduate school is absent
- the email is rendered as `guohq (at) shanghaitech.edu.cn`
- placeholder fields are visibly placeholders where still needed
- publication visuals have consistent fallback behavior and acceptable alt-text handling

## Implementation Outcome

After implementation, the workspace should contain a runnable Spectre-based Astro site whose public-facing academic homepage presents:

- Hengquan Guo
- ShanghaiTech University
- research interests led by `Reinforcement Learning` and `LLM Alignment`
- a hero with personal facts on the left and `About me` on the right
- curated `Selected Publications` with small cover-style visuals
- `Awards`
- `Experience`
- `Academic Service & Teaching`
- placeholder `Projects`
- a top navigation route to `Full Publications`
- obfuscated school email text and no phone number
