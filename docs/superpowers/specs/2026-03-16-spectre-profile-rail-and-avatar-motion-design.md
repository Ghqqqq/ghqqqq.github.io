# Spectre Profile Rail And Avatar Motion Design

## Summary

Polish the academic homepage profile area so it feels more personal and compact: restore the user's original bird avatar instead of the generated substitute, remove the avatar background to transparency, add a subtle mouse-follow motion effect, move `Experience` directly under `About me`, and simplify the left column into a tighter identity rail with inline links and a separate `Research Interests` section.

This is a refinement pass on the merged Spectre academic homepage, not a structural rewrite.

## Goals

- Replace the current generated bird asset with the user's original uploaded bird image.
- Remove the dark background from the original avatar while preserving the bird artwork itself.
- Add a subtle hover-follow effect to the avatar that gives a light Live2D-like feel without rebuilding the image into separate animated parts.
- Reorganize the left profile column so identity and links are tighter and easier to scan.
- Move `Experience` directly below `About me`.
- Make `Awards` visually lighter by removing per-item boxes.
- Remove `GitHub` and `CV` from the visible profile links.

## Non-Goals

- Building a full Live2D rig, skeletal animation, eye tracking, or blinking system.
- Changing publication grouping, publication data, or theme behavior.
- Adding new social profiles or a downloadable CV file.

## Confirmed User Decisions

### Avatar Source

- Use the original uploaded image at [00c8c994-feb5-41ef-ab83-f397dcd6d169.png](/Users/ghq/Documents/homepage/00c8c994-feb5-41ef-ab83-f397dcd6d169.png).
- Do not generate a replacement illustration.
- Only remove the gray/black background and preserve the bird content.

### Avatar Motion

- Use the lighter interaction option:
  a small mouse-follow/parallax effect on the avatar.
- The effect should feel alive, but remain subtle and stable.
- It should reset smoothly when the pointer leaves.

### Profile Rail Layout

The left column should become:

1. Avatar
2. `Hengquan Guo`
3. `ShanghaiTech University`
4. Inline links
5. Separate `Research Interests` block

The `Links` card should be removed.

### Visible Links

Keep:

- `Google Scholar`
- `guohq (at) shanghaitech.edu.cn`

Remove:

- `GitHub`
- `CV`

### Right Column Order

The top-right content order should become:

1. `About me`
2. `Experience`
3. `Awards`
4. `Academic Service & Teaching`
5. `Selected Publications`
6. `Projects`

### Awards Rendering

- `Awards` should no longer render each item inside a bordered box.
- Use a simple single-column text list.
- Wrapping text is acceptable and preferred over visually heavy containers.

## Design Direction

### Identity Rail

The left rail should feel like a compact academic identity block rather than two stacked utility cards. The name, institution, and links should be close together so the reader can understand who the page belongs to at a glance. Research interests still deserve their own section, but they should inherit the denser visual language of the rail.

### Avatar Treatment

The avatar should remain square and visually anchored in the same general place, but the transparent cutout should let the ivory/dark backgrounds show through naturally. The motion effect should operate through CSS transforms driven by pointer position rather than heavy animation libraries.

### Awards

Awards should read more like a CV list than a stack of cards. This means:

- no bordered item containers
- tighter vertical rhythm
- title-first formatting
- year and metadata as secondary text

## Implementation Notes

### Avatar Pipeline

- Read the original PNG from the repo root.
- Produce a transparent homepage-ready asset under `src/assets/`.
- Key out the neutral background conservatively so the bird edges stay soft.

### Motion Strategy

- Implement avatar motion as a small pointer-driven translate effect.
- The movement should be clamped to a small range.
- Prefer desktop-pointer interaction only; mobile should remain static.

### Content Placement

- Move the link rendering into the primary identity card.
- Reuse `quickInfo` content as `Research Interests`, except the institution line should stay near the name rather than inside that list.
- Keep the institution text immediately under the name.

## Acceptance Criteria

- The homepage uses the original bird image content rather than the generated substitute.
- The avatar background is transparent.
- The avatar shifts subtly with mouse movement and eases back when idle.
- The left rail shows `Hengquan Guo`, `ShanghaiTech University`, and only the approved inline links.
- `Research Interests` occupies the previous secondary-card area.
- `About me` is immediately followed by `Experience`.
- `Awards` is rendered as a simple single-column text list without bordered item cards.
- `GitHub` and `CV` no longer appear in the homepage profile area.
