# Research Atlas

The homepage at `/` presents the research landscape, selected publications, experience, awards, and service. `/publications` remains the complete archive; `/projects` and individual publication URLs are unchanged.

## Implementation

- `src/pages/index.astro` renders the existing content collections and the accessible publication reader.
- `src/components/atlas/controller.ts` owns navigation, search, focus, and the reading state.
- `src/components/atlas/world.ts` renders the Three.js landscape and fits it to the available screen space.
- `src/components/atlas/terrain.ts` generates a deterministic landform. Height is illustrative, not a measure of research importance.
- `ManuscriptLayer.astro` provides the original floating formulas on the dark and paper chapters. Reduced-motion preferences and the pause control are respected.

Old section links are mapped to the new chapters. `/atlas` redirects to the homepage.

## Validation

Run `pnpm build` followed by `pnpm test`. The opt-in `?inspect=1` flag exposes camera and GPU pixel diagnostics for browser checks; normal visits do not read back GPU pixels.

GitHub Pages deployment runs from `main` through `.github/workflows/deploy.yml`.
