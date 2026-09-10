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

The ERNIE organization mark is the unmodified 64px PNG served by the [official ERNIE site](https://ernie.baidu.com/blog/img/favicon.ico), stored locally as `public/ernie-mark.png`.

## Reading Interactions

Each paper has an individual camera target. The desktop reader frames its terrain marker in the remaining space, and previous/next follows the selected paper. Closing the reader restores the pre-reading field, index state, and viewing angle. A resized viewport is reframed instead of restoring obsolete dimensions. Non-selected papers acquire a temporary marker only while open; their positions carry no additional academic meaning.

`LineageLink.astro` derives both navigation directions from existing `lineage.sourceId` records. Hover and keyboard focus highlight the confirmed endpoints and route without moving the camera. Activation traverses that route in 950ms, with a synchronized timeline in the reader. Mobile uses a 280ms timeline transition while its full-width reader covers the scene; reduced motion and unavailable WebGL use ordinary navigation. Closing, changing papers, resizing, changing motion preference, or hiding the page cancels pending traversal. No relationships are inferred from proximity or shared categories.

Old section links are mapped to the new chapters. `/atlas` redirects to the homepage.

## Validation

Run `pnpm build` followed by `pnpm test`. The opt-in `?inspect=1` flag exposes camera and GPU pixel diagnostics for browser checks; normal visits do not read back GPU pixels.

The separate owner-only preview carries a Sites manifest and is validated with `ATLAS_PRIVATE_PREVIEW=1 pnpm run verify:site`. GitHub validation retains its default guard against including that private registration.

GitHub Pages deployment runs from `main` through `.github/workflows/deploy.yml`.
