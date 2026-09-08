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

Old section links are mapped to the new chapters. `/atlas` redirects to the homepage.

## Validation

Run `pnpm build` followed by `pnpm test`. The opt-in `?inspect=1` flag exposes camera and GPU pixel diagnostics for browser checks; normal visits do not read back GPU pixels.

The separate owner-only preview carries a Sites manifest and is validated with `ATLAS_PRIVATE_PREVIEW=1 pnpm run verify:site`. GitHub validation retains its default guard against including that private registration.

GitHub Pages deployment runs from `main` through `.github/workflows/deploy.yml`.
