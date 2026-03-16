# Spectre Academic Homepage Theme And Publications Refresh

## Summary

Refine the current Spectre-based academic homepage so it feels more like a polished faculty/research page: use an `ivory` light theme by default, preserve a dark theme as an optional toggle, reorder the homepage to prioritize CV signals, tighten the `Awards` presentation, trim `Experience`, and make `Full Publications` actually exhaustive based on the user's CV.

This spec extends the existing homepage design instead of replacing it. The goal is to improve hierarchy, polish, and completeness while keeping the site content-driven and easy to maintain.

## Goals

- Default the site to an ivory-toned light theme.
- Preserve a dark theme and expose a clear manual toggle in the top-left area of the page.
- Replace the current placeholder avatar with the user-provided blue-bird profile image.
- Reorder homepage sections so CV-heavy information appears before selected research highlights.
- Reduce visual bulk in `Awards`.
- Remove the `PhD Researcher` entry from homepage `Experience`.
- Expand `Full Publications` to include the complete CV list, including published, submitted, and arXiv-style entries approved by the user.
- Remove the Astro dev toolbar from the page chrome during local preview and normal site usage.

## Non-Goals

- Adding automatic bibliography sync.
- Building citation export, filters, or a publication search UI.
- Rewriting the site into a resume-only one-pager.
- Hiding the existence of preprint or submitted work; status should stay explicit.

## Confirmed User Decisions

### Theme

- Support both light and dark themes.
- Default theme: `ivory`.
- The light theme should feel editorial and academic rather than stark pure white.
- Add a visible theme toggle near the upper-left corner rather than burying it in page settings.

### Profile Image

- Use the user-provided blue-bird avatar image for the homepage profile block.
- If the supplied image background is not transparent, convert it to a transparent PNG before use.
- Keep the current square avatar placement and overall size unless later design changes require otherwise.

### Homepage Order

The homepage should be reordered to:

1. `About`
2. `Awards`
3. `Academic Service & Teaching`
4. `Experience`
5. `Selected Publications`
6. `Projects`

This keeps the page CV-forward while still preserving publications as a substantial lower section.

### Experience

- Remove `PhD Researcher, ShanghaiTech University` from the homepage `Experience` section.
- Keep the homepage experience block focused on the Tencent research internship.

### Awards Density

- The current awards cards are too visually large.
- Awards should be rendered in a noticeably tighter format, such as a dense list or compact rows.
- The section should still preserve award title, year, and small supporting metadata where present.

### Publications Completeness

`Full Publications` should be expanded to reflect the CV list, including:

- published conference and journal papers
- submitted papers
- arXiv / public preprint entries

The user explicitly wants these shown rather than filtered out.

## Publication Scope To Add

The full publications page should cover the CV list as of 2026-03-11, including items not yet represented in the content collection.

Already present or partially represented:

1. `Online Convex Optimization with Hard Constraints: Towards the Best of Two Worlds and Beyond`
2. `Rectified Pessimistic-Optimistic Learning for Stochastic Continuum-armed Bandit with Constraints`
3. `Stochastic Constrained Contextual Bandits via Lyapunov Optimization Based Estimation to Decision Framework`
4. `On Stochastic Contextual Bandits with Knapsacks in Small Budget Regime`
5. `Enhancing Safety in Reinforcement Learning with Human Feedback via Rectified Policy Optimization`
6. `Triple-Optimistic Learning for Stochastic Contextual Bandits with General Constraints`
7. `Towards Safe and Optimal Online Bidding: A Modular Look-ahead Lyapunov Framework`

Still to add from the CV:

1. `POBO: Safe and Optimal Resource Management for Cloud Microservices`
2. `Learning to Schedule Online Tasks with Bandit Feedback`
3. `QueueFlower: Orchestrating Microservice Workflows via Dynamic Queue Balancing`
4. `Safe Learning in Stochastic Continuum-Armed Bandit With Constraints and Its Application to Network Resource Management`
5. `On the Power of Optimism in Constrained Online Convex Optimization`
6. `No Regret Reinforcement Learning Algorithms for Online Scheduling with Multi-Stage Tasks`
7. `SABO: Safe and Aggressive Bayesian Optimization for Automatic Legged Locomotion Controller Tuning`
8. `Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning`
9. `GRB: A Generative Reinforcement Bidding Framework for Multi-Channel Online Advertising`
10. `BLOCK: An Open-Source Bi-Stage MLLM Character-to-Skin Pipeline for Minecraft`

## Publication Presentation Rules

### Full Publications Page

The full list should remain a single unified route at `/publications`, but each item should carry enough metadata to clarify status:

- `Published`
- `Journal`
- `Submitted`
- `Preprint` or `ArXiv`

Status can appear as a subtle metadata tag or short suffix line. The page should remain reverse chronological by year, while preserving clear venue/status wording.

The goal is not to hide submitted work, but to distinguish it honestly from accepted publications.

### Selected Publications

The homepage `Selected Publications` section should keep the current grouped structure:

1. `Agent / LLM Alignment`
2. `Recommendation & Bidding`
3. `Reinforcement Learning & Bandits`

The venue badge style should continue to use real short names such as `NeurIPS`, `ICLR`, `ICML`, `COLT`, and `L4DC`, with authors on a separate line below the title.

This section should remain curated rather than exhaustive.

## Theme Design Direction

### Light Theme

The ivory theme should use:

- warm off-white page background instead of pure white
- dark charcoal text
- soft neutral borders
- restrained accent color that still feels coherent with Spectre
- card surfaces with subtle separation instead of heavy dark blocks

The design should feel closer to an editorial academic site than a glowing cyber-terminal page.

### Dark Theme

Dark mode should remain available, but it should be treated as a supported alternate theme rather than the only visual identity. Existing dark styling can be retained as a base, with small adjustments if needed for parity with the new light-mode structure.

### Theme Toggle Behavior

- The toggle should be easy to discover.
- Default theme on first load should be `light`.
- User choice should persist across page loads, ideally with `localStorage`.
- The toggle should update the entire site shell, not just one card.

## Layout Adjustments

### Global Shell

The theme switch will require global color tokens rather than hardcoded dark-only values. Current direct uses of dark borders, white text, and dark backgrounds should be migrated toward CSS variables so both themes stay maintainable.

### Profile Card

The profile card should swap out the current placeholder image for the approved bird avatar. The implementation should preserve the current layout footprint so the new image does not cause reflow in the left-side profile column.

### Awards

Awards should become visually tighter by:

- reducing padding per entry
- reducing vertical gaps
- optionally using lighter metadata styling and a denser row format

This section should scan more like a concise honors list than a stack of large cards.

### Experience

`Experience` should become a short single-entry block centered on:

- `Research Intern, Tencent CDG, 2025.06 - 2026.06`

Its description can remain concise and achievement-oriented.

## Toolbar Removal

The bottom Astro developer toolbar visible in local preview should be removed so previews better match the eventual site presentation. This is a product-polish requirement, not just a development convenience.

Implementation is expected to disable Astro's dev toolbar in config rather than hiding it with brittle CSS.

## Content Model Direction

The publications collection should be extended just enough to support the expanded full list. Fields may include:

- `venueShort`
- `homepageCategory`
- `status`
- `link`

`status` is newly important because the full list now includes accepted, submitted, journal, and preprint items.

The content model should stay simple and file-driven.

## Acceptance Criteria

- The site loads in ivory light mode by default.
- A visible top-left theme toggle switches between light and dark themes and persists the preference.
- The homepage profile image uses the supplied bird avatar, with a transparent background if needed.
- The homepage order is `About` → `Awards` → `Academic Service & Teaching` → `Experience` → `Selected Publications` → `Projects`.
- Homepage `Experience` no longer includes the ShanghaiTech PhD role.
- `Awards` is visually denser than the current implementation.
- `/publications` contains the complete CV-derived list, including submitted and preprint work, with explicit status cues where needed.
- The Astro dev toolbar no longer appears in preview.
- The existing grouped selected-publications design remains intact after the reorder.
