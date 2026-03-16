# Spectre Full Publications Compact List Design

## Summary

This refresh makes the `/publications` page denser and more bibliography-like. The homepage `Selected Publications` cards should stay unchanged; only the dedicated `Full Publications` page moves away from the cover-block layout.

## Goals

- remove the left-side publication cover block from the full publications page
- present each publication in a compact, highly scannable text-first row/card
- preserve title, authors, venue, year, and status visibility
- keep each item clickable
- avoid affecting the homepage publication teasers

## Non-Goals

- no changes to homepage `Selected Publications`
- no changes to publication detail pages
- no changes to publication ordering or filtering

## Design

### Full Publications Page

The page should keep its existing route and surrounding shell, including the stats card, but the main list becomes a compact academic list:

- no cover column
- title remains the strongest text
- authors stay on the next line
- venue and status remain visible but lighter
- year stays right-aligned in the header row
- status may remain as a compact inline pill or label if it does not increase row height too much

### Component Strategy

The existing `PublicationTeaser` component already supports multiple visual variants. The cleanest path is to add one more dedicated variant for the full publications page, rather than rewriting the page with ad-hoc markup.

Recommended variant:

- `variant="list"`

This variant should:

- render a single-column text layout
- omit the `.publication-cover` block entirely
- keep hover/focus affordances
- reuse existing metadata logic where possible

The `/publications` page can then switch from `variant="full"` to `variant="list"`.

## Verification

- update tests to assert that:
  - the publications page still contains the known publications and status labels
  - the publications page includes the new compact-list marker
  - the publications page no longer includes the cover block marker for full-page entries
- run `pnpm verify:site`
