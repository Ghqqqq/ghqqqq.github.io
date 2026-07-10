# Homepage Research Atlas Redesign

**Date:** 2026-07-10

**Status:** Approved visual direction; ready for implementation planning

## Summary

Redesign the homepage around a single visual system: a cobalt-blue Research Atlas hero that hands off to a compact sticky section relay as the visitor scrolls. The reading surface alternates between restrained editorial sections and selected full-width blue chapters. Dark and light themes retain the same cobalt identity while switching the long-form reading surface between near-black and warm paper.

The redesign prioritizes visual impact. Existing biography, experience, awards, service, and publication content remain substantially unchanged.

## Confirmed Decisions

The visual companion produced and validated the following choices:

1. **Structure:** Research Atlas
2. **Color identity:** Blue Signal
3. **Color deployment:** Blue Chapters
4. **Scroll behavior:** Atlas Relay
5. **Theme strategy:** Dual Surface

## Goals

- Create a memorable first viewport that reads as a deliberately authored academic identity.
- Give the homepage one coherent visual narrative instead of many unrelated flourishes.
- Make the research map the organizing visual motif for the page.
- Preserve editorial readability across a long academic homepage.
- Keep the interaction responsive, accessible, and dependency-free.
- Preserve a visible hint of the next section in every supported viewport.

## Non-Goals

- Rewriting biography, experience, awards, service, or publication copy.
- Rebuilding Full Publications or Projects as scrollytelling pages.
- Adding a 3D scene, canvas particle system, scroll hijacking, or a new animation library.
- Adding filters, search, dashboards, or other product-style controls to the homepage.
- Performing an unrelated content-model or site-wide architecture refactor.

## Visual System

### Palette

Core tokens:

| Token | Value | Role |
| --- | --- | --- |
| Cobalt | `#1735D6` | Hero and blue chapters |
| Bright cobalt | `#3151FF` | Active nodes, rails, focus details |
| Signal yellow | `#F5FF65` | Sparse high-energy accents on cobalt/dark surfaces |
| Ink | `#111116` | Dark reading surface |
| Warm paper | `#F1ECE2` | Light reading surface |
| Dark-theme text | `#F4F0E8` | Primary text on ink |
| Light-theme text | `#15151B` | Primary text on warm paper |

Signal yellow is reserved for the active atlas node, the avatar orbit marker, and one or two hero details. On warm paper, bright cobalt replaces signal yellow as the interaction accent so small text and focus states maintain sufficient contrast.

### Typography

- **Fraunces:** display headings, the name, section titles, and publication titles.
- **Geist:** prose, navigation, metadata, and interface labels.
- **Geist Mono:** coordinates, section progress, years, and atlas annotations.

Italic display type is limited to the hero's supporting statement and publication group names. Body metadata, research nodes, experience titles, and awards remain upright.

### Texture and Lines

- Keep a very light paper grain on reading surfaces.
- Use a subtle orthogonal grid only inside cobalt fields.
- Remove the ambient floating manuscript/formula layer from the homepage.
- Remove the current combination of ghost numerals, repeated divider ticks, animated hairlines, and background formulas.
- Use borders only where they define the atlas, relay, or publication grouping. Spacing provides most section separation.

## Page Structure

### Layout Width

Introduce a homepage layout variant with a maximum canvas width of `1280px`, wider than the current `960px` single-page layout. Long-form text remains constrained inside readable inner columns.

Other single pages retain their existing width.

### Navigation

- Navigation overlays the cobalt hero with white text and a transparent background.
- Once the hero sentinel leaves the viewport, navigation adopts the active reading-surface background with blur and a single bottom hairline.
- Keep Full Publications, Projects, and the theme control.
- The mobile menu keeps the existing blurred overlay behavior, recolored for the new tokens.

### Hero

The hero is the primary visual event.

- The semantic `h1` and dominant personal signal is **Hengquan Guo**.
- `Research as a living atlas.` is a large supporting display statement rather than the page `h1`.
- The bird portrait becomes a larger orbital portrait with one dashed ring and one signal marker that advances briefly on entry and then settles.
- A compact academic summary and profile links remain visible without a card.
- The Research Atlas occupies the lower/right portion of the hero on desktop.
- The hero height uses viewport-aware constraints and leaves `24-64px` of the next section visible, depending on viewport height.

The hero must not use gradients, glow, blurred color blobs, or a decorative card container. Its depth comes from solid cobalt, a faint grid, typography, the portrait, and the atlas geometry.

### Research Atlas

The atlas contains:

- Core: Reinforcement Learning & Bandits
- Foundations: Bandits & Online Learning; Safe / Constrained Learning
- Applications: Recommendation & Bidding; LLM Alignment; Agentic LLMs; Multimodal LLMs

The visual graph uses HTML elements and CSS lines. The semantic structure is a labeled navigation list; decorative edges are `aria-hidden`.

Atlas nodes link to the relevant homepage publication group or section where a useful destination exists. Nodes without a distinct destination remain static labels and do not imitate controls.

### Atlas Relay

The relay appears after the full hero atlas scrolls away.

- It is a sticky, compact horizontal track under the main navigation.
- Its five stops represent homepage sections: About, Experience, Awards, Service & Teaching, and Selected Publications.
- The current stop uses signal yellow on dark/cobalt surfaces and bright cobalt on warm paper.
- A small contextual label names the current chapter or research branch.
- Within Selected Publications, the contextual label updates to the active publication group.

The handoff is an implied transformation: the full atlas scrolls away while the relay fades and draws into place. It does not use a fragile pixel-perfect FLIP morph.

### Editorial Reading Sections

About, Experience, Service & Teaching, and Selected Publications use the theme's reading surface.

- Desktop sections use a restrained label/content grid.
- Section labels may remain sticky but lose oversized ghost numerals.
- Section hierarchy comes from type scale and spacing.
- Experience keeps organization marks, dates, and descriptions.
- Service & Teaching stays compact but receives more vertical breathing room.

### Blue Chapter

Awards becomes the main full-width cobalt chapter between reading sections.

- It uses one large editorial heading and a controlled four-column award layout on desktop.
- Awards collapse to two columns and then one column at smaller widths.
- Signal yellow is limited to years or ranking metadata such as `Top 25%`.
- No card shadows or floating panels are used.

### Publications

- Keep category grouping and the existing idea-lineage relationship.
- Use an editorial index layout with year, title, author/venue metadata, and a sparse active-branch marker.
- Remove whole-row translation.
- Hover and focus affect the title, year, and a thin branch marker only.
- The relay contextual label follows the active publication group.

## Theme Strategy

The cobalt identity is invariant across themes.

### Dark Theme

- Hero and blue chapters: cobalt.
- Reading surface: ink.
- Primary reading text: warm off-white.
- Atlas/relay inactive geometry: translucent white or cobalt.

### Light Theme

- Hero and blue chapters: the same cobalt.
- Reading surface: warm paper.
- Primary reading text: near-black.
- Active rail and focus details: bright cobalt.

The theme toggle changes the reading surface, navigation state after the hero, and related text tokens. It does not recolor the cobalt hero into a pale variant.

## Responsive Design

### Desktop (`> 860px`)

- Wide hero composition with name and statement on the left, portrait and atlas on the right/lower area.
- Horizontal sticky relay.
- Label/content section grid.
- Four-column award chapter.

### Tablet (`641-860px`)

- Hero content stacks with the portrait above or beside a simplified atlas.
- Relay remains horizontal but drops its contextual label when space is tight.
- Sections become a single content column with inline section labels.
- Awards use two columns.

### Mobile (`<= 640px`)

- Preserve a first-viewport hint of the next section.
- Put the name and supporting statement above the portrait.
- Reduce the hero graph to core plus two visible branch anchors; preserve all labels in the accessible list.
- Replace the large atlas with a five-stop horizontal relay near the hero/body transition.
- Use a single-column reading surface and one-column awards.
- Prevent labels, dates, and publication years from forcing horizontal overflow.

## Motion System

Use three timing tiers:

- Fast interaction: `180-220ms`
- Content/state transition: `380-440ms`
- Signature atlas transition: `600-680ms`

Use `cubic-bezier(0.22, 1, 0.36, 1)` for spatial transitions.

Allowed motion:

- Hero atlas edges draw once on entry.
- Active nodes pulse twice when state changes, then settle.
- The portrait signal marker advances along a short arc during hero entry, then settles.
- The relay fades/draws in when the hero atlas leaves the viewport.
- Publication and navigation focus states use local color/line transitions.

Disallowed motion:

- Persistent formula drift.
- Global parallax.
- Whole-row list translation.
- Spring physics, glow, particles, or scroll snapping.
- Continuous node pulsing.

Under `prefers-reduced-motion: reduce`, all content is visible immediately, the orbit marker is static, lines render complete, and active states change without spatial animation.

## Component Boundaries

### New Modules

- `src/data/research-atlas.ts`
  - Typed atlas nodes, labels, groups, and target anchors.
- `src/components/ResearchAtlas.astro`
  - Full semantic atlas plus decorative geometry.
- `src/components/ResearchRelay.astro`
  - Sticky section-progress track and contextual label.

### Existing Modules to Change

- `src/pages/index.astro`
  - Homepage composition and section metadata.
- `src/styles/index.css`
  - Homepage tokens, layouts, responsive rules, and state transitions.
- `src/layouts/Layout.astro`
  - Add a homepage layout variant and an ambient-layer option.
- `src/components/Navbar.astro`
  - Support hero and reading-surface visual states.
- `tests/site.test.mjs`
  - Structural, accessibility, content-preservation, and fallback assertions.

No new runtime dependency is required.

## State and Data Flow

One small homepage controller coordinates visual state:

1. A hero sentinel controls `data-hero-state="visible|passed"`.
2. Section observers control `data-active-section` on the homepage root.
3. Publication-group observers control `data-active-research-group` while the publications section is active.
4. CSS reads these attributes to style navigation, relay stops, contextual labels, and atlas nodes.

The controller does not own content and does not duplicate atlas labels. Both atlas components receive the same typed configuration at build time.

## Progressive Enhancement and Failure Modes

- Without JavaScript, the full atlas, all content, and anchor navigation remain visible and usable.
- The relay renders as a static section index when observers are unavailable.
- Navigation defaults to a solid readable surface if hero-state detection is unavailable.
- Unsupported scroll-timeline features are irrelevant because the design relies on Intersection Observer and CSS transitions.
- Missing optional node destinations render as text, not broken links.
- The portrait retains fixed responsive dimensions so image loading cannot cause layout shift.

## Accessibility

- Maintain at least WCAG AA contrast for essential text and controls.
- Preserve visible keyboard focus on navigation, atlas links, publication links, and theme controls.
- Use real headings and landmarks; visual numbering does not replace semantic hierarchy.
- Hide decorative edges, coordinates, and orbit geometry from assistive technology.
- Keep all research labels available on mobile even when the visible graph is simplified.
- Respect reduced motion and avoid auto-moving content that cannot be paused.

## Verification

### Automated

- Astro production build succeeds.
- Existing site tests remain green after intentional expectation updates.
- Tests assert the homepage no longer renders the manuscript layer.
- Tests assert atlas and relay landmarks, anchors, and reduced-motion hooks.
- Tests assert existing biography links, experience text, awards, service entries, and selected publications remain present.

### Browser QA

Verify at minimum:

- Desktop: `1440x1000` and `1280x800`
- Mobile: `390x844` and `360x800`
- Dark and light themes
- Reduced-motion emulation
- Hero viewport framing and visible next-section cue
- Sticky navigation and relay before/after the hero threshold
- Active relay state through all five sections
- Publication-group contextual state
- No horizontal overflow, text overlap, or layout shift
- Browser console has no errors

### Performance

- Add no new animation dependency.
- Avoid continuous per-frame JavaScript.
- Keep layout shift at or near zero by reserving portrait and atlas dimensions.
- Confirm the simplified homepage background materially reduces the work currently spent on the manuscript field.

## Rollout Boundary

Phase one implements the homepage redesign and the shared navigation/theme tokens required for visual continuity. Full Publications and Projects retain their existing information architecture and only receive compatibility styling where necessary.

Further page-specific redesigns require separate review after the homepage is visually stable.

## Acceptance Criteria

- The first viewport is recognizably cobalt, atlas-led, and centered on Hengquan Guo.
- The next section remains visibly hinted on supported desktop and mobile viewports.
- The full atlas hands off to a sticky five-stop relay without scroll hijacking.
- Dark and light reading surfaces both retain the same cobalt hero identity.
- Homepage formulas, manuscript drift, ghost numerals, and repeated divider ticks are gone.
- All existing homepage content and important links remain available.
- Motion is coherent, finite, and safely reduced when requested.
- Production build, automated tests, and browser QA pass.
