# Spectre Academic Homepage Initialization Design

## Summary

Initialize a personal homepage using the [louisescher/spectre](https://github.com/louisescher/spectre) Astro theme as the foundation, then adapt its default blog-oriented homepage into an academic-first personal site for Hengquan Guo.

The first version should be a clean, runnable starter rather than a fully completed website. Confirmed public information should come from the user's Google Scholar profile, while everything else should remain explicitly marked as placeholder content.

## Goals

- Start from the upstream Spectre template rather than rebuilding the site from scratch.
- Preserve the Spectre visual language and overall layout.
- Turn the homepage into an academic homepage in English.
- Replace the default "Latest Posts" section with "Selected Publications".
- Keep a dedicated `Projects` section with placeholder cards for future project content.
- Remove misleading example/demo content from the template.
- Use only confirmed public profile data where available.

## Non-Goals

- Completing a full academic website with all biography, links, publications, and project details.
- Importing all Google Scholar publications automatically.
- Building CMS, admin tooling, or automation for content sync.
- Finalizing deployment, analytics, comments, or SEO tuning beyond template defaults.

## Confirmed Source Data

As observed from the user's public Google Scholar page on 2026-03-16:

- Name: `Hengquan Guo`
- Affiliation: `ShanghaiTech University`
- Google Scholar profile: `https://scholar.google.com/citations?user=8bGinucAAAAJ&hl=zh-CN`
- Research interests to display:
  - `Reinforcement Learning`
  - `LLM Alignment`
  - `Constrained Optimization`
  - `Online Learning`
  - `Bandit`

The homepage should not display `Minecraft` as a research interest, even though it appears on the current Scholar page.

## Information Architecture

The initialized homepage will keep Spectre's two-column homepage layout but adapt the content blocks:

### Left Column

#### Profile

- Name
- Affiliation
- Research interests
- Placeholder avatar if no custom image is provided

#### Links

- Google Scholar (real link)
- Email (placeholder)
- GitHub (placeholder)
- CV (placeholder)

### Right Column

#### About

- English introduction text
- Initial content should be placeholder text that clearly indicates it should be replaced

#### Selected Publications

- Replaces the original `Latest Posts` homepage block
- Shows 4-5 representative publications derived from the currently visible Scholar page
- Each entry should include:
  - title
  - venue
  - year
  - short author line or metadata snippet
  - external or internal detail link when available

#### Projects

- Keeps the existing project-style card/list concept from Spectre
- Contains 3 clearly labeled placeholder entries
- Serves as a scaffold for future research projects, open-source work, or demos

## Content Strategy

### Publications

The initial `Selected Publications` set should be curated from visible Scholar entries rather than generated from a separate publication database. The implementation should favor recent and representative work aligned with the research interests above.

Candidate papers observed from the public profile include:

1. `Online convex optimization with hard constraints: Towards the best of two worlds and beyond` (NeurIPS 2022)
2. `Rectified pessimistic-optimistic learning for stochastic continuum-armed bandit with constraints` (L4DC 2023)
3. `Stochastic constrained contextual bandits via lyapunov optimization based estimation to decision framework` (COLT 2024)
4. `On stochastic contextual bandits with knapsacks in small budget regime` (ICLR 2025)
5. `Triple-Optimistic Learning for Stochastic Contextual Bandits with General Constraints` (ICML 2025)

These can be adjusted during implementation if the underlying template structure suggests a cleaner presentation.

## Placeholder Policy

The following must remain placeholders unless the user provides more information:

- biography details beyond affiliation and interests
- email address
- GitHub URL
- CV URL
- profile photo
- project details
- any additional social links

Placeholders should be obvious and non-deceptive, such as `email@example.com`, `GitHub profile coming soon`, or `Project details to be added`.

## Template Adaptation Plan

The implementation should adapt the Spectre template with minimal structural disruption:

- initialize from the upstream Spectre template
- preserve Astro + TypeScript setup
- preserve the existing terminal-inspired design system
- remove sample/demo identity content
- replace homepage labels and content sources with academic equivalents
- keep the site easy to extend through the template's existing content collections

## Content Model Direction

The existing Spectre content model includes `info`, `socials`, `posts`, `projects`, `work`, and other supporting content.

For initialization:

- `info` should be repurposed for profile quick facts
- `socials` should become academic/personal links
- `posts` should either be repurposed or bypassed for homepage `Selected Publications`
- `projects` should remain and be filled with placeholder entries
- `work` should be removed from the homepage for now unless needed to satisfy template requirements

The implementation should prefer simple, maintainable reuse of the current template structure over large schema rewrites, unless the rewrite is clearly cleaner.

## Error Handling and Safety

- Do not invent personal facts.
- Do not scrape beyond publicly visible profile information needed for initialization.
- If a field is unknown, render a placeholder rather than leaving the UI broken.
- If the Spectre template includes required assets or content collections, provide safe placeholder records so the build stays green.

## Verification

Before calling the initialization complete, verify:

- dependencies install successfully
- the Astro dev server starts
- the homepage renders without broken required content
- the homepage reflects the academic structure described above
- placeholder fields are visibly placeholders
- sample/demo identity content has been removed from the public-facing homepage

## Out of Scope for This Initialization

- custom logo or brand system
- publication filtering, search tuning, or pagination changes
- automatic Scholar synchronization
- deployment setup
- full mobile polish beyond what the template already provides
- replacing all template internals if a lighter adaptation works

## Implementation Outcome

After implementation, the workspace should contain a runnable Spectre-based Astro site whose homepage presents:

- Hengquan Guo
- ShanghaiTech University
- reordered research interests emphasizing Reinforcement Learning and LLM Alignment
- an About section with placeholder copy
- a Selected Publications section based on current public Scholar data
- a Projects section with placeholder entries
- placeholder academic/personal links except for the confirmed Google Scholar URL
