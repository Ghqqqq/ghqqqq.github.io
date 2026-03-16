# Spectre Awards and Selected Publications Tightening Design

## Summary

This refresh tightens the homepage information density without changing the overall academic landing-page structure that is already in place. The update focuses on three small but visible improvements: a corrected Tencent internship end date, denser one-line award rows, and broader `Selected Publications` coverage for the `Agent / LLM Alignment` and `Recommendation & Bidding` groups.

## Goals

- change the Tencent internship period to `2025.06 - 2026.02`
- render each award as a compact single-row entry with:
  - title first
  - optional gray metadata inline with the title
  - year label pushed to the far right
- keep the awards section visually lighter than boxed cards
- expand homepage-selected publications so the groups read as:
  - `Agent / LLM Alignment`: existing RLHF paper plus `BLOCK`
  - `Recommendation & Bidding`: existing ICLR bidding paper plus the submitted ICML recommendation paper and the submitted KDD bidding paper

## Non-Goals

- no change to the full publications page structure
- no new homepage section ordering changes
- no new theme or avatar behavior changes

## Design

### Experience

Update the Tencent research internship entry in the content JSON only. No layout changes are needed for the experience card.

### Awards

The awards list should stay unboxed and become even denser:

- each item becomes a single horizontal row on desktop
- the title remains the highest-contrast text
- gray helper text sits on the same row as the title instead of wrapping below
- the year stays aligned at the far right edge
- on small screens, the row may wrap, but the DOM structure should still express a single compact line-oriented entry

To support the `ShanghaiTech University Scholarship, 2021 - 2025` entry cleanly, the renderer may treat entries without a numeric `year` as text-only rows unless a dedicated year label is introduced later.

### Selected Publications

No new grouping model is needed. The homepage should keep the three existing groups and simply mark the additional publications as homepage-selected in their frontmatter:

- `BLOCK: An Open-Source Bi-Stage MLLM Character-to-Skin Pipeline for Minecraft`
  - `selected: true`
  - `homepageCategory: "agent-llm-alignment"`
- `Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning`
  - `selected: true`
  - `homepageCategory: "recommendation-bidding"`
- `GRB: A Generative Reinforcement Bidding Framework for Multi-Channel Online Advertising`
  - `selected: true`
  - `homepageCategory: "recommendation-bidding"`

The homepage already derives groups from `selected` plus `homepageCategory`, so this remains a data-first change.

## Verification

- update the homepage test to assert:
  - `2025.06 - 2026.02`
  - the new awards inline-row structure markers
  - presence of `BLOCK`
  - presence of the submitted ICML recommendation paper
  - presence of the submitted KDD bidding paper
- run `pnpm verify:site`
