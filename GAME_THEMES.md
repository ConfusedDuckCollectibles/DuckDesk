# Duck Desk Game Themes

## Status

Implemented and verified on August 28, 2026.

| Workstream | Status | Verification |
| --- | --- | --- |
| Shared scoring and persistence | Complete | Shared build and `npm run test:games` pass |
| Five pixel character assets | Complete | Transparent PNG assets included in overlay build |
| Five interactive viewer worlds | Complete | Portrait screenshots at 540 x 960 checked |
| Streamer theme cards and controls | Complete | Desktop typecheck and production renderer build pass |
| Viewer integration and win states | Complete | Overlay typecheck and production build pass |

## Games

| Game | Progression | Win moment |
| --- | --- | --- |
| Tower Tresses | The golden braid grows down the tower | The rescue reaches the courtyard |
| Starship Rally | The ship climbs through five orbits | The final orbit is cleared |
| Moon Garden | Plants and border vines grow upward | The moon garden blooms |
| Crystal Quest | Crystals illuminate the cave chamber | The hidden chamber opens |
| Neon Grand Prix | The racer advances through five laps | The driver reaches the podium |

## Scoring

| Audience event | Points |
| --- | ---: |
| Bid | 2 |
| Sale | 10 |
| Tip | 10 |
| Share | 1 per new share, capped at 5 per event |
| Follow | 2 |
| Bookmark, chat, or reaction | 1 |

Each game has five increasingly difficult point targets. Extra points carry into the next level. Finishing level five increments the saved win count, briefly displays a full-screen celebration, and begins another run at level one.

Progress is saved separately for every Game Theme. Switching themes does not erase a run. **Start New Show** resets every game after confirmation. The manual **Preview +2** control advances only the active game and never sends a fake show event.

## Product Constraints

- Game activity stays on the edges and bottom so the seller's product remains visible.
- The permanent open-source footer stays visible.
- Turning off Theme Effects hides game art and animation while normal notifications continue.
- Reduced Motion disables game animation and transitions.
- Game progress never changes connection health or real show totals.
- No AI assistant functionality is present.
