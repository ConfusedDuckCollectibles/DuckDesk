# Premium Character Themes Handoff

Current pause point: user asked to stop because credits are low. Work is partially implemented and saved in the repo.

## User Request

1. Lock the desktop streamer GUI sidebar so its section buttons stay visible while the main page scrolls.
2. Add a theme picker to the Stream Preview page, and make the phone preview stay sticky while scrolling through themes.
3. Add a new theme category named `Premium Animated With Characters`.
4. Add first theme in that category: `Peaceful Village`, with animated clouds, a peaceful village along the bottom, and pixel/Game Boy-style characters that walk or idle.
5. Generate assets first so another agent can continue if needed.

## Asset Generation Complete

Runtime assets were generated and saved here:

- `apps/overlay/public/premium-character-themes/peaceful-village/village-strip.png`
- `apps/overlay/public/premium-character-themes/peaceful-village/clouds-atlas.png`
- `apps/overlay/public/premium-character-themes/peaceful-village/villagers-spritesheet.png`
- `apps/overlay/public/premium-character-themes/peaceful-village/manifest.json`

Source/reference image generations were preserved here:

- `design/premium-character-themes/peaceful-village/source/villagers-concept-01.png`
- `design/premium-character-themes/peaceful-village/source/villagers-concept-02.png`
- `design/premium-character-themes/peaceful-village/source/village-strip-concept.png`
- `design/premium-character-themes/peaceful-village/source/clouds-concept.png`

Notes:

- The generated source images do contain alpha channels, even though the preview display showed a black matte.
- Runtime villager atlas was generated as a clean regular 6-character x 4-frame transparent PNG so CSS step animation can be reliable.
- `manifest.json` documents the runtime asset dimensions and frame grid.

## Code Changes Already Applied

### Shared Type Registry

File: `packages/shared/src/index.ts`

- Added `peaceful_village` to `OverlaySkin`.
- Added `peaceful_village` to `isOverlaySkin`.

### Desktop GUI

File: `apps/desktop/index.html`

- Added a `preview-theme-picker` section in the Stream Preview panel.
- Added an empty `#preview-theme-list` container for runtime-generated preview theme buttons.
- Added new Library category title:
  - `Premium Animated With Characters`
- Added new Library theme card:
  - skin id `peaceful_village`
  - label `Peaceful Village`
  - category label `Premium Characters`

File: `apps/desktop/src/renderer.ts`

- Added `peaceful_village` to the local `OverlaySkin` union.
- Added `peaceful_village: "Peaceful Village"` to `skinName`.
- Added `peaceful_village` to local `isOverlaySkin`.
- Added `previewThemeList`.
- Added `createPreviewThemeButtons()`, which clones the existing Library theme catalog into the Preview panel.
- Added click handling for `[data-preview-theme]` and `[data-preview-skin]`.
- Added active/hidden state updates for preview theme buttons in `renderStatus`.

File: `apps/desktop/src/styles.css`

- Changed `html, body` to `height: 100%; overflow: hidden;`.
- Changed `.shell` to `height: 100vh; overflow: hidden;`.
- Changed `.rail` to `height: 100vh; position: sticky; top: 0; overflow: hidden;`.
- Changed `.dashboard` to `height: 100vh; overflow-y: auto; overscroll-behavior: contain;`.
- Changed `.preview-panel` to `overflow: visible`.
- Made `.phone-frame` sticky with `top: 18px`.
- Removed the internal `.preview-notes` max-height scroller.
- Added `.preview-theme-picker`, `.preview-theme-list`, and `.preview-theme-option` styles.
- Added `.swatch.peaceful-village`.

### Overlay Theme Registration

File: `apps/overlay/src/App.vue`

- Added `peaceful_village` to the overlay premium skin set.

File: `apps/overlay/src/components/BroadcastFrame.vue`

- Added `peaceful_village` to the premium skin set.
- Added `geometry-peaceful-village` SVG paths:
  - tight rectangular frame
  - cloud frame paths
  - path/wave frame paths
  - pixel corner blocks

File: `apps/overlay/src/components/ThemeArt.vue`

- Added `theme-art-peaceful-village` block with:
  - `village-sky`
  - back/front cloud layers
  - meadow layer
  - village strip layer
  - six villager sprite instances

File: `apps/overlay/src/premium-expansion.css`

- Added `.overlay-shell.skin-peaceful_village` theme variables.
- Included Peaceful Village in shared premium geometry selectors.
- Added tight animated border behavior:
  - `.geometry-peaceful-village .village-path-frame`
  - `.geometry-peaceful-village .village-pixel-frame`
  - `.geometry-peaceful-village .village-cloud-frame`
- Added `.skin-peaceful_village .premium-frame-loop .frame-loop-outer`.
- Added Peaceful Village banner/brand styling selectors.
- Added full Peaceful Village scene CSS using generated PNG assets.
- Added keyframes:
  - `village-frame-drift`
  - `village-sky-breathe`
  - `village-clouds`
  - `village-meadow`
  - `village-scene-rest`
  - `village-villager-steps`
  - `village-villager-walk`
  - `village-villager-idle`
  - `alert-village`
- Added reduced-motion handling for `.theme-art-peaceful-village` and `.geometry-peaceful-village`.

## Important Caveats / Next Steps

Work has not yet been built or tested after these changes.

Recommended next steps:

1. Run formatting/type/build checks:
   - `npm test`
   - `npm run build -w @duck-desk/overlay`
   - `npm run build -w @duck-desk/desktop`
2. Fix any TypeScript/CSS issues.
3. Visually QA:
   - desktop sidebar remains fixed while dashboard scrolls
   - Stream Preview phone remains sticky while theme picker scrolls past it
   - Preview theme buttons toggle standard and premium skins
   - `Peaceful Village` appears only when `stream_skins` add-on is enabled
   - `Peaceful Village` border remains tight on all sides
   - clouds/village/characters animate
   - border/art animations continue during bid/sale/action alerts
4. Confirm whether generic premium border freeze is paint jank or a CSS pause. I found only this explicit pause:
   - `apps/overlay/src/craft.css`: `.overlay-shell.is-alert-active .ticker-marquee { animation-play-state: paused; }`
   No explicit premium border pause was found.
5. Rebuild/sync/restart before telling user it is done:
   - `npm run overlay:sync`
   - likely build next release as `0.1.0-alpha.8` if continuing from alpha.7

## Prior Release Context

Previous completed release work was `0.1.0-alpha.7`.

Previously built artifact:

- `apps/desktop/release/DuckDesk-0.1.0-alpha.7-arm64.dmg`

Previous checksum:

- `6d2b900319bd44a8cf26f75c3702a2987012394aaa68aa4cb26eac97145c180b`

For the next release, likely bump to `0.1.0-alpha.8` after completing this feature set.
