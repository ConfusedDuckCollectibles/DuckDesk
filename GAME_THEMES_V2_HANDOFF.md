# Game Themes V2 Rebuild Handoff

> Planning and art-source handoff only. This document intentionally does not implement or wire the V2 games into Duck Desk.

## Handoff Status

| Deliverable | Status |
| --- | --- |
| V2 product/technical plan | Complete |
| Five generated source sprite atlases | Complete |
| Tower Tresses V2 vertical slice | **In progress** |
| Remaining four V2 games | Not started |

Implementation began with Tower Tresses only on August 28, 2026. Do not expand this sprint into the other four games.

### Tower Tresses Sprint Log

- [x] Audited the V1 engine, persistence path, viewer component, and streamer status UI.
- [x] Added Tower-only 100-level progression and V1 save migration; focused shared tests pass.
- [x] Slice and normalize Tower sprite assets with stable anchors.
- [x] Build distinct Tower action clips and connected edge-safe world geometry.
- [x] Add focused progression, migration, action, geometry, and rendering tests.
- [x] Verify 1080 x 1920 and 540 x 960 viewer screenshots.

## Mandate

Rebuild all five Game Themes as believable pixel games that live on the edges of the 1080 x 1920 viewer canvas. Preserve the center product/seller region. Replace generic bobbing and CSS-shape animation with authored sprite frames for every event. Expand each game from 5 levels to 100 progressively harder levels.

The existing V1 implementation is in:

- `packages/shared/src/games.ts`
- `apps/overlay/src/components/GameThemeLayer.vue`
- `apps/overlay/src/game-themes.css`
- `apps/overlay/public/game-themes/`

Do not discard unrelated work in the repository. Migrate saved V1 progress safely and work with the current app structure.

## Product Acceptance Criteria

1. At idle, all game art stays inside edge-safe zones: left/right rails no wider than 150 px, top world chrome below the main banner no taller than 100 px, and bottom game deck above the permanent GitHub footer no taller than 220 px. The central rectangle from x=170..910 and y=300..1540 must remain free of persistent game art.
2. Alerts may briefly enter the center using the existing alert system, but ordinary game progression may not cover merchandise or the seller.
3. Every audience event has a distinct, authored sprite sequence. No character animation may be implemented by only translating, rotating, scaling, or bouncing one static image.
4. Bid, audience action, share, tip, sale, level-up, and game-win each have visibly different animation language in every game.
5. Each game has exactly 100 levels. Difficulty increases monotonically, saved overflow carries forward, and level 100 is intentionally unlikely to be completed in one normal stream.
6. World geometry is mechanically coherent. Hair starts at the princess's scalp/window and joins the braid without a gap. Tower windows belong to the tower wall. Roads connect to finish lines. Vines emerge from soil/planters. Mine rails connect to the cart and chamber. Ship paths and gates align.
7. Pixel scale is consistent. Use a 32 px logical grid rendered at integer multiples with `image-rendering: pixelated`. Do not mix smooth CSS gradients with pixel art inside the game world.
8. Progress remains legible at phone size and in OBS, while the permanent GitHub footer remains visible.
9. Reduced Motion uses a meaningful held frame for each action instead of hiding progress. Theme Effects Off hides game visuals but does not suppress normal alerts.
10. Demo buttons exercise the same event-to-animation dispatcher as live events.

## Layout Contract

Treat the portrait overlay as four edge-owned regions, never as a full-screen stage:

| Region | 1080 x 1920 budget | Purpose |
| --- | --- | --- |
| Left rail | x 0-150, y 280-1640 | Character, vertical progress, environmental tiles |
| Right rail | x 930-1080, y 280-1640 | Goal, opponent/destination, secondary effects |
| Bottom deck | x 150-930, y 1510-1745 | Connected terrain and compact game HUD |
| Top accent | x 150-930, y 230-320 | Sparse goal markers only; never a second banner |

Reserve y 1745-1920 for the permanent open-source footer and any required safe spacing. Validate both native 1080 x 1920 and compact 540 x 960 views.

## Animation Architecture

Replace the V1 `lastEventType` plus CSS-bounce model with an explicit animation command:

```ts
type GameAction = "idle" | "bid" | "audience" | "share" | "tip" | "sale" | "level_up" | "win";

interface GameAnimationCommand {
  id: number;
  action: GameAction;
  startedAt: number;
  durationMs: number;
  intensity: 1 | 2 | 3;
}
```

Create a sprite animator that selects a named clip from an atlas manifest. Sprite animation should use background-position or canvas frame extraction with integer pixel coordinates. Do not animate a static `<img>` as the event response.

Recommended clip lengths:

| Action | Frames | Looping | Duration |
| --- | ---: | --- | ---: |
| Idle | 4 | yes | 900-1400 ms |
| Bid | 5-6 | no | 350-550 ms |
| Audience | 5-6 | no | 450-650 ms |
| Share | 6-8 | no | 600-850 ms |
| Tip | 8-10 | no | 800-1100 ms |
| Sale | 10-12 | no | 1100-1500 ms |
| Level up | 10-12 | no | 1300-1800 ms |
| Win | 16-24 | no | 2800-3800 ms |

Queue policy: sale/tip/win cannot be interrupted. Coalesce rapid bids into intensity 2 or 3 rather than queuing dozens of clips. Share and audience actions wait behind sale/tip; idle resumes after the queue drains.

## 100-Level Progression

Replace five hard-coded targets with a deterministic 100-level curve. Recommended target formula:

```ts
target(level) = Math.round(base * Math.pow(level, 1.28) + level * ramp)
```

Suggested parameters:

| Game | Base | Ramp | Level 1 | Approx. level 100 |
| --- | ---: | ---: | ---: | ---: |
| Tower Tresses | 16 | 3.0 | 19 | 6110 |
| Starship Rally | 18 | 3.2 | 21 | 6856 |
| Moon Garden | 15 | 2.8 | 18 | 5716 |
| Crystal Quest | 20 | 3.5 | 24 | 7538 |
| Neon Grand Prix | 17 | 3.1 | 20 | 6489 |

Verify the exact values in tests; the approximate values above are orientation, not snapshots. Keep existing event weights unless product requirements change: bid 2, sale 10, tip 10, share 1-5, follow 2, other audience 1. Carry overflow through multiple levels. At level 100, completing the target increments wins and begins a new 100-level run.

Persist `schemaVersion: 2`, level 1-100, progress, target, totalPoints, wins, animation revision, and last action. Migrate V1 levels 1-5 to levels 1, 21, 41, 61, and 81 while preserving fractional progress. Never reset a user's progress silently.

## Art Source Pack

Generated source atlases live in `design/game-themes-v2/source/`. They are production art direction and sprite material, not wired runtime assets. Preserve these files and create lossless, nearest-neighbor slices under `apps/overlay/public/game-themes-v2/<game>/` during implementation.

| File | Game | Required extraction |
| --- | --- | --- |
| `tower-tresses-sprite-atlas-source.png` | Tower Tresses | Princess clips, hair-root connector, braid straight/corner/end tiles, prince clips, tower/window/courtyard tiles, bid/share/tip/sale effects |
| `starship-rally-sprite-atlas-source.png` | Starship Rally | Pilot/ship clips, thruster frames, orbit gates, fuel cells, satellite/share, cargo/tip, sale jump, level/win effects |
| `moon-garden-sprite-atlas-source.png` | Moon Garden | Gardener clips, soil/planter tiles, seed/sprout/vine/flower stages, firefly/share, moon-drop/tip, bloom/sale effects |
| `crystal-quest-sprite-atlas-source.png` | Crystal Quest | Explorer clips, connected rail/cart, wall/ceiling/floor tiles, pickaxe/bid, bat/share, gem/tip, chamber/sale effects |
| `neon-grand-prix-sprite-atlas-source.png` | Neon Grand Prix | Driver/car clips, connected road/rail/finish tiles, boost/bid, drone/share, pit/tip, overtake/sale, podium/win effects |

Before slicing, visually inspect each atlas and reject any malformed frame. Normalize accepted sprites onto a fixed transparent grid, remove near-transparent halos, and generate a JSON manifest with exact frame rectangles, anchor point, duration, and loop flag. Character anchors must remain identical across all frames so clips do not jitter.

### Generated Asset Verification

All five files were generated on August 28, 2026. Each is a 1024 x 1536 PNG with an alpha channel.

| File | SHA-256 |
| --- | --- |
| `tower-tresses-sprite-atlas-source.png` | `fed3c9fe54d336804bbfb6bdcb8872d307ab43dac8d9b9a2c4fa22fdc1b41dff` |
| `starship-rally-sprite-atlas-source.png` | `a7771352d6c78703f475dfa4da256ff55f8351d41b00244631b8f46813e2ebbe` |
| `moon-garden-sprite-atlas-source.png` | `517576b726224932286cb21aa3089ee5e374c9b12dd184c5a9225f0e609f659f` |
| `crystal-quest-sprite-atlas-source.png` | `f55e01e53736b3b411a0afd87416fc135942a21166daf6bf5cf6040aac096a4f` |
| `neon-grand-prix-sprite-atlas-source.png` | `034987ee097c5515ffafde1ca28f67252fd405ca283bec800ed509df231acee7` |

## Game Specifications

### 1. Tower Tresses

World layout: the tower occupies the left rail. The window is cut into that tower, not floating in the center. The princess is anchored inside the opening. Her hair-root sprite exits from the same scalp coordinate and locks into 16 px braid tiles. The braid follows the left edge down to the bottom courtyard; the prince waits on the bottom deck.

- Bid: princess braids one new segment; hands, hair root, and added segment all animate.
- Audience: a window pennant waves and the princess acknowledges the crowd.
- Share: a messenger bird flies only through the top accent region and drops a ribbon at the tower.
- Tip: golden comb sparkle travels from the tip alert toward the hair root.
- Sale: prince advances several courtyard tiles while the princess performs a distinct cheer clip.
- Level up: tower floor marker lights and a short braid flourish plays.
- Win: the completed braid reaches the prince; he climbs the final segment and both characters celebrate. Full-screen takeover is permitted only for the final 2.8-3.8 seconds.

Required geometry test: render scalp anchor, hair-root connector, every braid segment, bend, and final tassel with debug outlines. There must be zero transparent pixels between adjoining anchor masks at all progress values.

### 2. Starship Rally

World layout: ship and pilot occupy the left rail, destination planet and gate occupy the right rail, and a thin connected star lane runs across the bottom deck.

- Bid: thruster ignition sequence and one fuel-cell fill.
- Audience: pilot console acknowledgement with antenna pulse.
- Share: satellite launches, transmits across the top accent, and docks at the right gate.
- Tip: cargo capsule locks into the ship with a two-stage docking clip.
- Sale: ship performs an authored hyperspace jump across the bottom lane.
- Level up: orbit gate opens and closes around the ship.
- Win: ship lands at the destination platform; pilot exits and plants a victory beacon.

### 3. Moon Garden

World layout: soil and connected planter occupy the bottom deck. Gardener stays in the right rail. Climbing vines use the left/right rails only. No central field of tall plants.

- Bid: seed lands, soil dents, and a sprout appears.
- Audience: gardener waters one plant with an authored pour sequence.
- Share: firefly swarm crosses the top accent and settles on side vines.
- Tip: moon droplet descends along a side rail and opens a bud.
- Sale: several plants advance to a bloom stage and gardener celebrates.
- Level up: a new plant species unlocks on the bottom deck.
- Win: both border vines meet in a top-edge arch and the moon flower blooms briefly behind the win title.

### 4. Crystal Quest

World layout: cave wall tiles hug both rails. A continuous mine track runs along the bottom deck into a right-rail chamber. Explorer and cart remain on the bottom/left edge.

- Bid: explorer swings pickaxe through anticipation, strike, spark, and recovery frames.
- Audience: lantern raise and cave glyph response.
- Share: bat courier carries a map through the top accent.
- Tip: rare gem drops into the connected mine cart and visibly increases its load.
- Sale: cart rolls several track ties toward the chamber with turning wheels, not translation of a static cart.
- Level up: chamber lock loses one authored layer and crystal light propagates along the wall.
- Win: cart reaches the door, lock opens, and explorer enters the chamber.

### 5. Neon Grand Prix

World layout: a narrow connected circuit begins on the left rail, crosses the bottom deck, and rises to the finish marker in the right rail. Driver portrait is replaced by an in-car sprite so the character and vehicle are one coherent unit.

- Bid: wheel-spin and exhaust boost clip advances the car a small distance.
- Audience: pit board flips to an acknowledgement frame.
- Share: camera drone flies across the top accent and flashes once.
- Tip: pit crew performs a rapid tire/fuel service sequence.
- Sale: car executes a multi-frame overtake with opponent sprites and speed streak frames.
- Level up: checkpoint gantry lights in sequence.
- Win: car crosses the connected finish line, brakes, and driver climbs onto the podium.

## Implementation Work Order

1. Add V2 progression types, the 100-level target function, V1 migration, and tests in shared code.
2. Slice/clean the five source atlases, create per-game PNG/WebP sprite sheets and atlas manifests, and verify all anchors.
3. Build a reusable `PixelSprite` renderer and a priority-aware game animation queue.
4. Rebuild one vertical slice, Tower Tresses, including scalp-to-braid geometry tests and all eight action clips.
5. Validate center-safe occupancy with automated bounding-box screenshots at 1080 x 1920 and 540 x 960.
6. Port Starship Rally, Moon Garden, Crystal Quest, and Neon Grand Prix using the same renderer but unique world state machines.
7. Add level bands so visual progression changes across 1-20, 21-40, 41-60, 61-80, and 81-100 without adding central clutter.
8. Add demo/live parity tests, event coalescing tests, persistence migration tests, reduced-motion snapshots, and OBS capture checks.
9. Run a 20-minute stress rehearsal with rapid bids, overlapping tips/sales, theme switching, and app restart.

## Required Tests

- Levels 1 through 100 have strictly increasing targets.
- Overflow can cross multiple levels and level 100 rolls to a win correctly.
- V1 progress migrates without loss of fractional completion.
- Each `GameAction` resolves to a distinct named clip for each of the five games.
- Character/world anchor coordinates do not change between frames.
- Tower hair-root, braid, bends, and tassel pass pixel-mask adjacency tests at 0%, 1%, 25%, 50%, 75%, and 100%.
- Persistent nontransparent game pixels stay outside the protected center rectangle.
- The GitHub footer never overlaps the bottom deck or compact HUD.
- Rapid bids coalesce; sale, tip, level-up, and win are never dropped.
- Reduced Motion presents a stable semantic frame for every action.
- Screenshots pass at 1080 x 1920 and 540 x 960 for idle, every action, levels 1/20/40/60/80/100, and win.

## Definition Of Done

The rebuild is complete only when all five themes look like working pixel games rather than themed overlays: connected environments, frame-authored actions, 100-level persistence, clear event feedback, a consistently open center, correct phone-scale rendering, and no regression to alerts, themes, OBS, settings, or the permanent footer.
