# Research Atlas

The homepage at `/` presents the research landscape, selected publications, experience, awards, and service. `/publications` remains the complete archive; `/projects` and individual publication URLs are unchanged.

## Implementation

- `src/pages/index.astro` renders the existing content collections and the accessible publication reader.
- `src/components/atlas/controller.ts` owns navigation, search, focus, and the reading state.
- `src/components/atlas/world.ts` renders the Three.js landscape and fits it to the available screen space.
- `src/components/atlas/terrain.ts` generates a deterministic landform. Height is illustrative, not a measure of research importance.
- `terrain-lighting.ts` bakes occlusion and soft sunlight from that unchanged height grid. View-dependent satin highlights are evaluated by the material shader.
- `AtlasPoster.astro` displays small, responsive snapshots of the same scene while WebGL loads or when it is unavailable. The fallback does not reserve any extra layout space.
- `ManuscriptLayer.astro` provides the original floating formulas on the dark and paper chapters. Reduced-motion preferences and the pause control are respected.

Reading offsets are retained per paper for the current page visit. New papers start at the title. Ambient terrain drawing targets 30 frames per second while idle; camera interaction is unthrottled. Covered chapters stop drawing after the camera settles without pausing the independent manuscript animation.

The ERNIE organization mark uses the unmodified 64px PNG served by the [official ERNIE site](https://ernie.baidu.com/blog/img/favicon.ico), stored locally as `public/ernie-mark.png`. `ErnieMark.astro` removes its white matte at render time and colors the original silhouette with `currentColor`, matching the other organization marks without redrawing the logo. The alpha filter uses `clamp(1.15 * (alpha - red), 0, 1)` in sRGB: white and transparent pixels disappear while the blue mark remains opaque.

## Reading Interactions

The September 2026 detail studies were approved as a combined design: mineral lighting and optional contours, a year-led selected-publication catalog, and a journal-style reading folio. The prototype route flags, comparison bar, DOM relocation, and global arrow-key handlers have been removed.

`SurfaceControls.astro` renders synchronized controls in the overview and research sections. The controller owns the shared surface state, encoded in the optional `surface=contours` query parameter. Changes redraw the existing scene without moving its camera. Controls are unavailable during loading or WebGL fallback.

`SelectedPublications.astro` renders the selected catalog directly into the research section. Its filters use the same field metadata as the map and reader. Filtering preserves the page position; closing a paper restores catalog scrolling along with the prior camera and field. The reader follows the originating catalog or search scope, with a direction-specific fallback when a lineage jump leaves that scope.

The reading folio tracks its own scroll position and responds to content resizing. It does not add page-level scroll UI. Surface mode, formula animation, reduced-motion preferences, and the existing pause policy remain coordinated by the normal controller.

Opening a paper carries its visible catalog title or map annotation into the folio with a same-document View Transition. The sheet and its content appear separately, so metadata does not intersect the traveling title. Closing returns to the matching visible title after restoring the original list and camera. Offscreen headings are omitted from the shared element; direct links and browsers without the API retain ordinary navigation. Paused or reduced motion skips the transition. Resize, visibility changes, and newer navigation settle or cancel pending work without committing stale callbacks. The scene canvas is excluded from transition snapshots.

Each paper has an individual camera target. The desktop reader frames its terrain marker in the remaining space, and previous/next follows the selected paper. Closing the reader restores the pre-reading field, index state, and viewing angle. A resized viewport is reframed instead of restoring obsolete dimensions. Non-selected papers acquire a temporary marker only while open; their positions carry no additional academic meaning.

`LineageLink.astro` derives both navigation directions from existing `lineage.sourceId` records. Hover and keyboard focus highlight the confirmed endpoints and route without moving the camera. Activation traverses that route in 950ms, with a synchronized timeline in the reader. Mobile uses a 280ms timeline transition while its full-width reader covers the scene; reduced motion and unavailable WebGL use ordinary navigation. Closing, changing papers, resizing, changing motion preference, or hiding the page cancels pending traversal. No relationships are inferred from proximity or shared categories.

Old section links are mapped to the new chapters. `/atlas` redirects to the homepage.

## Surface Finish

The September finish pass keeps the landform, chapter order, and content unchanged. Ridge curvature is derived from the existing height samples and drives restrained, tangent-oriented highlights. No new geometry or texture downloads are introduced.

Relief / Contours changes use a 680ms height-ordered reveal. Reversals sample the in-flight value; pause, reduced motion, hidden pages, WebGL loss, and covered scene states settle immediately to the selected mode. Only the bounded transition requests additional animation frames.

The homepage manuscript retains all 132 existing entries. Far, middle, and near bands vary in scale, contrast, travel, and duration. Near entries stay at the edges; mobile removes far-band blur. Blue chapters remain formula-free, and the existing pause policy applies to every band.

Selecting a research direction now preserves that region's full finish while lowering contrast and contour ink on the other peaks. A smooth three-way partition is baked into the unchanged mesh; only three shader weights interpolate during selection. Overview, All, and the publication index retain neutral lighting. Reading inherits the selected direction, and confirmed cross-field lineage keeps both endpoints clear. No camera, label, geometry, render pass, or asset changes are involved. Paused and reduced motion apply the new lighting immediately.

The approved finishing treatments are enabled for all visits. The temporary comparison interface and its query switches are excluded from the production source.

## Validation

Run `pnpm build` followed by `pnpm test`. The opt-in `?inspect=1` flag exposes camera and GPU pixel diagnostics for browser checks; normal visits do not read back GPU pixels.

The separate owner-only preview carries a Sites manifest and is validated with `ATLAS_PRIVATE_PREVIEW=1 pnpm run verify:site`. GitHub validation retains its default guard against including that private registration.

GitHub Pages deployment runs from `main` through `.github/workflows/deploy.yml`.
