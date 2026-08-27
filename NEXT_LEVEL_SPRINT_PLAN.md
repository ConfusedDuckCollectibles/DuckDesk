# Duck Desk Next-Level Sprint Plan

Last updated: August 27, 2026

## Sprint Progress

Active branch: `codex/next-level-sprint`

| Workstream | Status | Verification |
| --- | --- | --- |
| Baseline and shared command contracts | Complete | `npm run typecheck`, `npm test`, and `npm run build` pass on alpha.5 |
| Remote Show Deck | Complete | 4 security tests, desktop visual QA, 390px phone QA, valid/invalid pairing, and live command round trip pass |
| Rehearsal and Event Replay | In progress | Pending |
| Visual Alert Studio | Not started | Pending |
| Community Pack System | Not started | Pending |
| Production Reliability | Not started | Pending |
| Full build, visual QA, and documentation | Not started | Pending |

Update this table as each vertical slice becomes usable. A workstream is only
marked complete after its automated checks and relevant visual or workflow QA
have passed.

### Completed: Remote Show Deck

- Added a professional one-handed phone deck for scenes, safety controls,
  sounds, GIFs, show triggers, and live totals.
- Added a desktop Remote tab with a locally generated QR code, LAN URL, device
  activity, and access-code rotation.
- The OBS overlay remains on `localhost`; remote controls use a private LAN
  address and a per-launch cryptographic token.
- Added private-address enforcement, constant-time token checks, stale-client
  expiry, command validation, and tap-rate limiting.
- Fixed private-LAN browser compatibility by avoiding secure-context-only web
  APIs.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.

## Purpose

This document is the implementation handoff for the next Duck Desk sprint. The
requested scope is product ideas **2 through 6** from the prior discussion. The
rules-engine idea (item 1) is explicitly out of scope.

The five deliverables are:

1. Remote Show Deck
2. Rehearsal and Event Replay
3. Visual Alert Studio
4. Community Pack System
5. Production Reliability

The goal is to move Duck Desk from a capable overlay application toward a
dependable, free, open-source live-show control room without adding AI assistant
functionality.

## Current Repository State

- Monorepo using npm workspaces, TypeScript, Electron, Vue, Vite, Express, and
  WebSockets.
- `apps/desktop/src/main.ts` owns the Electron main process, local HTTP bridge,
  WebSocket bridge, settings, IPC, OBS integration, event stats, and native
  audio playback.
- `apps/desktop/src/renderer.ts` and `apps/desktop/index.html` implement the
  streamer-facing control application.
- `apps/overlay/src/App.vue` implements the viewer-facing overlay.
- `packages/shared/src/index.ts` contains shared event/config contracts and
  validators.
- The local bridge currently listens on `127.0.0.1:8741` and serves the overlay
  at `http://localhost:8741/overlay`.
- Existing event kinds are sale, bid, audience action, tip, and share.
- Existing production tools include OBS auto-add/repair, preflight checks,
  scenes, goals, GIF triggers, sound pads, hype bursts, timers, recap, activity
  feed, local settings, and the Whatnot Chrome extension.
- Top Banner and Theme Effects toggles already exist and must be preserved.
- The GitHub footer is intentionally permanent and must remain visible.
- Demo data must never appear when Demo Mode is off unless an explicit
  rehearsal is running.
- Current branch at the time of this handoff: `main`.
- Current commit: `5786f0a Release v0.1.0-alpha.5`.
- The alpha.5 build, tests, DMG, and commit were completed and pushed. The
  public GitHub Actions release form was staged but was not submitted because
  the final representational action was awaiting user confirmation.

No application implementation for this sprint had been committed when this
plan was written.

## Product Principles

- Keep every show-critical action usable without Terminal.
- Keep all core operation local. No account or cloud service is required.
- Prefer one-handed controls, clear system state, and quick recovery over dense
  configuration during a live show.
- Viewer output must remain phone-first at 1080 x 1920.
- Streamer controls can be richer, but must stay scannable and professional.
- Never expose private paths, OBS passwords, pairing tokens, raw cookies, or
  extension internals in exports or diagnostics.
- Do not permit imported packs to execute JavaScript, load arbitrary CSS, or
  reference files outside their installed pack directory.
- Maintain backward compatibility for existing saved settings and custom audio.
- Do not redesign existing premium themes as part of this sprint.

## Recommended Delivery Order

Work in small, independently testable commits:

1. Shared contracts and storage helpers
2. Remote Show Deck
3. Rehearsal and Event Replay
4. Visual Alert Studio
5. Community Pack System
6. Production Health and Recovery
7. Packaging, documentation, visual QA, and release

The Remote Deck and rehearsal scheduler should share the existing action
functions instead of duplicating IPC behavior. Before adding features, extract
small command functions from the current IPC handlers in
`apps/desktop/src/main.ts`, for example `setSceneMode()`, `triggerGif()`,
`triggerSound()`, `triggerAuctionTimer()`, and `clearOverlay()`. IPC and remote
routes should call the same functions.

## 1. Remote Show Deck

### User Experience

Add a `Remote` tab under Live. It should show:

- A locally generated QR code.
- A short pairing code and copyable LAN URL.
- Connection state: unavailable, waiting, connected, or stale.
- The connected device count and last activity.
- A `Rotate Access Code` command that immediately invalidates old links.
- A clear explanation that the phone and Mac must use the same local network.

The phone page should be a real control surface, not a miniature desktop UI.
Use high-contrast, stable, thumb-sized controls arranged in this order:

- On-air status strip: bridge, OBS, event path, current scene.
- Emergency actions: Clear Overlay, Hide Banner, Theme Effects.
- Scene controls: Live, Starting, Auction, Break, Winner, Ending.
- Show triggers: GIFs, sounds, burst, hype meter, auction timer, recap.
- A compact live scoreboard: sales, gross, bids, tips, and shares.

The page must fit common phone widths from 320 to 430 CSS pixels, support safe
areas, and avoid requiring horizontal scrolling.

### Architecture

- Continue serving the OBS overlay at its loopback URL.
- Bind the HTTP server to `0.0.0.0` so phones on the LAN can reach the remote
  page, while retaining `localhost` for OBS.
- Detect a usable private IPv4 address from `os.networkInterfaces()`.
- Generate an in-memory, cryptographically random pairing token at launch.
- Use a human-readable six-character code only for display; authorize requests
  with the full random token embedded in the QR URL.
- Add routes:
  - `GET /remote?token=...`
  - `GET /remote/api/status?token=...`
  - `POST /remote/api/action?token=...`
- Poll status every 1 to 2 seconds for the first version. A dedicated remote
  WebSocket can be added later, but is not required for the first reliable
  release.
- Track recently active remote clients by a random browser client ID and expire
  them after 15 seconds.
- Apply rate limits per client and action. Emergency Clear should remain
  available but should debounce repeated presses.
- Reject non-private network callers and invalid tokens with a generic 404.
- Set `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, a restrictive
  Content Security Policy, and frame denial headers on remote pages.
- Do not log full tokens or URLs.

### Suggested Files

- Add `apps/desktop/src/remote-deck.ts` for the self-contained remote HTML/CSS/JS
  response or add a small dedicated Vite entry if the page grows substantially.
- Add `apps/desktop/src/remote.ts` for token validation, LAN address discovery,
  action validation, rate limits, and remote status types.
- Modify `apps/desktop/src/main.ts`, `preload.ts`, `renderer.ts`,
  `index.html`, and `styles.css`.
- Add a local QR dependency such as `qrcode`. Do not use a remote QR image API.

### Acceptance Criteria

- Scanning the QR code on a phone connected to the same network opens the deck.
- Every visible remote control performs the same action as its desktop
  equivalent.
- Rotating the code invalidates all previously opened decks.
- The deck cannot access the app with no token or a wrong token.
- OBS continues loading `http://localhost:8741/overlay` normally.
- Restarting Duck Desk invalidates the prior session token.
- The phone page remains usable with VoiceOver labels and reduced motion.

## 2. Rehearsal and Event Replay

### User Experience

Add a `Rehearsal` section under Live > Events with:

- Built-in scenarios:
  - Quiet Show: spaced shares, follows, bids, and one sale.
  - Rapid Auction: a short high-frequency bidding sequence.
  - Full Sale Moment: bids, tip, sale, GIF, and recap timing.
  - Stress Test: event bursts that exercise queues, cooldowns, and priorities.
- Start, Pause, Resume, and Stop controls.
- A progress timeline showing elapsed time and the next scheduled action.
- `Record Session` to capture incoming events and manual triggers with relative
  timing.
- Saved rehearsal names, duration, event count, Play, Rename, and Delete.
- A clear `REHEARSAL` indicator in the streamer UI. Do not add a viewer-facing
  watermark unless Demo Mode is also on.

Rehearsal is an explicit production test and may run with Demo Mode off. It must
never update `lastRealEventAt`, never pretend the extension is connected, and
must mark its event-log entries as rehearsal data.

### Data Contract

Add shared or desktop-local types similar to:

```ts
type RehearsalAction =
  | { atMs: number; kind: "event"; event: ShowEvent }
  | { atMs: number; kind: "gif"; gifId: string }
  | { atMs: number; kind: "sound"; sound: SoundKind }
  | { atMs: number; kind: "scene"; scene: SceneMode }
  | { atMs: number; kind: "burst" }
  | { atMs: number; kind: "timer"; durationSeconds: number }
  | { atMs: number; kind: "clear" };

interface RehearsalTimeline {
  version: 1;
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  actions: RehearsalAction[];
}
```

### Storage and Scheduler

- Store user timelines in a separate versioned JSON file under Electron
  `userData`, not inside the general settings object.
- Use atomic writes through a temporary file followed by rename.
- Cap timelines at 50, actions per timeline at 500, and total file size at 2 MB.
- Normalize and validate every loaded timeline before use.
- Use one scheduler abstraction with a tracked set of timers.
- Stop and clear all rehearsal timers on app quit, bridge restart, or explicit
  stop.
- Pause should preserve remaining offsets rather than restarting the timeline.
- Recording should use the same central command/event path as playback.

### Tests

- Deterministic ordering for actions with identical timestamps.
- Pause/resume accuracy.
- Stop cancels every pending action.
- Rehearsal events do not affect real-event health state.
- Malformed saved timelines are quarantined rather than crashing the app.
- Stress Test does not produce an unbounded event or audio queue.

## 3. Visual Alert Studio

### User Experience

Add `Alert Studio` within Library > Studio. Keep the existing audio controls and
add a clearly separated visual editor.

Use tabs for Sale, Bid, Audience, Tip, and Share. Each event has independent:

- Enabled toggle.
- Position: below banner, upper, center, or lower.
- Size: compact, standard, or large.
- Duration with event-appropriate min/max values.
- Entrance: rise, slide, pop, broadcast, or none.
- Accent color swatch.
- Typography: theme, modern, condensed, or editorial.
- Media toggle and selected local GIF/image from an installed pack or GIF
  library.
- Sound assignment remains owned by the existing Audio Studio.
- `Preview This Alert` and `Reset Event` commands.

Show changes in the existing phone preview immediately. Provide safe-zone
guides in the desktop preview only, never in OBS.

### Shared Contract

Add a versioned visual-alert configuration to `OverlayConfigMessage`:

```ts
type AlertKind = "sale" | "bid" | "action" | "tip" | "share";
type AlertPlacement = "below_banner" | "upper" | "center" | "lower";
type AlertSize = "compact" | "standard" | "large";
type AlertEntrance = "rise" | "slide" | "pop" | "broadcast" | "none";
type AlertTypography = "theme" | "modern" | "condensed" | "editorial";

interface AlertVisualConfig {
  enabled: boolean;
  placement: AlertPlacement;
  size: AlertSize;
  durationMs: number;
  entrance: AlertEntrance;
  accent: string;
  typography: AlertTypography;
  mediaUrl?: string;
}
```

Use a complete `Record<AlertKind, AlertVisualConfig>` in persisted settings and
the overlay config message. Supply defaults during migration from version 1
settings so current users see the exact existing behavior until they edit it.

### Overlay Implementation

- Pass the active event config into `EventAlert.vue`.
- Use semantic CSS classes and CSS custom properties instead of inline style
  sprawl.
- Preserve premium-theme event art unless the user selects a non-theme
  typography or explicit accent.
- Viewer alerts must remain above the permanent GitHub footer.
- If the top banner is hidden, `below_banner` should collapse into the upper
  safe position without leaving dead space.
- Disabling Theme Effects must not disable alert entrance motion.
- Respect `prefers-reduced-motion` by replacing motion with a short fade.
- Reset the active alert timer safely if settings change during an alert.

### Acceptance Criteria

- Editing one event does not change another event.
- Preview uses the same Vue component and config as OBS output.
- Long buyer names, item names, and amounts do not overflow at any size.
- Alerts do not overlap the footer, auction timer, recap, or phone safe zones.
- Existing installs retain the pre-sprint appearance by default.

## 4. Community Pack System

### Scope

Implement a constrained, data-only `.duckpack` format. Packs can bundle a show
look and reusable media without running code.

Version 1 pack contents:

- Pack name, author, version, description, license, and optional project URL.
- Base theme or premium skin selection.
- Allowed visual tokens: colors, frame preset, texture image, typography preset,
  alert visual settings, and reduced-motion behavior.
- Optional audio replacements for known SoundKind values.
- Optional GIF/image library entries.
- Optional default promo banners, goals, and scene settings.
- A preview image.

Do not import arbitrary JavaScript, HTML, Vue, SVG with scripts/external links,
or CSS. Frame and motion values must come from app-owned allowlists.

### Package Layout

```text
example.duckpack
  manifest.json
  preview.png
  assets/
    texture.png
    sale.gif
    sale.wav
```

The manifest should include SHA-256 hashes for every declared asset. Add a JSON
Schema to `docs/pack-format/duckpack.schema.json` and an example pack under
`docs/pack-format/example/`.

### Import Security

- Treat `.duckpack` as a ZIP container using a maintained ZIP library.
- Reject absolute paths, `..` traversal, symlinks, undeclared files, duplicate
  paths, encrypted entries, and decompression bombs.
- Suggested limits: 25 MB compressed, 75 MB extracted, 100 files, 20 MB per
  asset.
- Verify file signatures, not only file extensions.
- Accept only PNG, JPEG, GIF, WebP, WAV, MP3, M4A, and safe plain JSON.
- Sanitize names and generated local paths.
- Verify all declared hashes before installation.
- Install into an app-owned directory using a generated ID.
- Never overwrite a different installed pack in place without confirmation.
- Render remote media only after copying it locally; installed packs must work
  offline.

### User Experience

Add `Packs` to Library with:

- Import Pack.
- Export Current Setup.
- Installed pack grid with preview, author, version, license, Apply, Export, and
  Remove.
- A review sheet before installation listing exactly what the pack changes.
- Clear errors for invalid licenses, hashes, assets, or unsupported versions.

Applying a pack should be transactional. If any required asset is invalid,
leave the current setup unchanged. Store the previously active setup so Undo is
available until the app closes.

### Open-Source Ecosystem

- Document how creators build packs without developer tools.
- Include one first-party sample pack as the reference implementation.
- Add a `duckpack validate <path>` npm script for contributors.
- Later releases can add a community index hosted as plain signed JSON. Do not
  build remote marketplace accounts or payments in this sprint.

## 5. Production Reliability

### Production Health Center

Expand Setup > Preflight into a dedicated health center while preserving the
fast summary. Add checks for:

- Local bridge state and port ownership.
- Overlay client count and last heartbeat.
- OBS WebSocket authentication, source presence, source dimensions, visibility,
  and current scene.
- Extension heartbeat and seller-page state.
- Last real event and duplicate/rejection counters.
- Audio output readiness and missing custom files.
- Remote Deck availability and connected devices.
- Rehearsal scheduler state.
- Settings and pack storage write access.
- Application version and update availability.

Every failed check should have one clear recovery action where possible:

- Restart Local Bridge.
- Repair + Refresh OBS.
- Reopen Extension Folder.
- Clear Overlay Queue.
- Reset Audio Output.
- Rotate Remote Access Code.
- Open Log Folder.

### Diagnostics

- Replace the single append-only log with daily rotating local logs.
- Keep a small structured ring buffer of bridge events and state transitions.
- Add `Export Diagnostics` using an Electron save dialog.
- Export a ZIP containing app version, platform, health snapshot, redacted
  settings summary, recent logs, OBS source metadata, extension heartbeat
  metadata, and validation results.
- Never include event message text, buyer names, GIF URLs containing query
  tokens, custom audio content, OBS passwords, pairing tokens, or full home
  directory paths.
- Add an explicit privacy summary before saving the diagnostic bundle.

### Crash and Recovery Behavior

- Write a startup marker and clean-shutdown marker.
- On an unclean prior shutdown, show a non-blocking recovery notice.
- Restore settings from the last valid atomic backup if the primary settings
  file is malformed.
- Quarantine invalid pack/timeline files and continue starting.
- Add a single-instance lock so two copies do not compete for port 8741.
- When the port is occupied, detect whether it is another Duck Desk instance
  and focus that instance. Otherwise show a useful recovery message.

### Updates, Signing, and Release Engineering

- Add update checking against the project GitHub Releases feed. Prefer a manual
  `Check for Updates` plus unobtrusive startup check before enabling unattended
  downloads.
- Never interrupt a live show for an update.
- Display release version, notes link, installer type, and verification status.
- Configure Electron Builder publishing metadata for GitHub releases.
- Add macOS hardened runtime, entitlements, Developer ID signing, and
  notarization support in CI using repository secrets.
- Keep unsigned local development builds available, but label them clearly.
- Preserve Windows packaging and add signing hooks without requiring signing
  secrets for local builds.
- Generate SHA-256 checksums and attach them to each release.
- Do not claim that builds are signed or notarized until CI verification proves
  it.

External credentials needed to finish signing/notarization:

- Apple Developer Program membership and Developer ID Application certificate.
- App Store Connect API issuer ID, key ID, and private key, or supported Apple
  notarization credentials.
- Optional Windows code-signing certificate for signed Windows installers.

The agent can implement all code and workflow hooks without these credentials,
but cannot produce a genuinely notarized public build without them.

## Cross-Cutting Refactor Boundaries

The current Electron main process is more than 2,200 lines. Split only the new
domains and code touched by this sprint. Avoid an unrelated rewrite.

Suggested modules:

- `apps/desktop/src/commands.ts`: shared, validated show commands.
- `apps/desktop/src/remote.ts`: LAN pairing and remote routes.
- `apps/desktop/src/remote-deck.ts`: phone UI response.
- `apps/desktop/src/rehearsal.ts`: scheduler, recording, and timeline storage.
- `apps/desktop/src/packs.ts`: pack schema, validation, import/export, storage.
- `apps/desktop/src/diagnostics.ts`: health snapshot, redaction, and export.
- `packages/shared/src/alerts.ts`: alert configuration types/defaults/validators.

Keep OS- and Electron-dependent behavior in the desktop app. Keep pure types,
normalizers, and validators in the shared package so they can be unit tested.

## Testing Strategy

### Automated

- Keep `npm run typecheck`, `npm test`, and `npm run build` green after each
  commit.
- Add Node tests for:
  - Remote token validation, private-address checks, rate limits, and action
    allowlists.
  - Rehearsal ordering, pause/resume, cancellation, persistence, and limits.
  - Alert default migration, validation, clamping, and per-event isolation.
  - Pack ZIP traversal, hash mismatch, type spoofing, size limits, and rollback.
  - Diagnostic redaction and malformed-settings recovery.
- Add parser fixtures for every new stored/config format.

### Browser and Visual QA

- Capture desktop screenshots at 1440 x 960 and the minimum supported desktop
  size.
- Capture remote screenshots at 320 x 568, 375 x 812, and 430 x 932.
- Capture the overlay at 1080 x 1920 with:
  - Banner on/off.
  - Theme Effects on/off.
  - Every alert placement and size.
  - Long names and high amounts.
  - Timer, goal, GIF, alert, and footer collision combinations.
- Confirm no horizontal overflow, clipped labels, layout shifts, blank iframes,
  or inaccessible controls.

### Real Workflow QA

- Test Remote Deck over a real LAN with macOS firewall enabled.
- Confirm OBS receives all controls while the desktop app is backgrounded.
- Record a full rehearsal in OBS and verify audio priority and alert duration.
- Disconnect/reconnect Wi-Fi, OBS, extension, and the phone independently.
- Force-close Duck Desk during a rehearsal and verify clean recovery.
- Import a valid pack, several malicious fixtures, and a corrupted archive.
- Install the DMG on a clean macOS user account before release.

## Definition of Done

This sprint is complete only when:

- All five deliverables are implemented as working features, not disabled cards
  or placeholders.
- Existing overlay themes, sounds, GIFs, scenes, OBS setup, and extension event
  handling still work.
- Existing users' settings migrate without visible regressions.
- Remote access is token-protected and LAN-only.
- Rehearsal data is always distinguishable from real show data.
- Alert changes are visible in the embedded preview and OBS.
- Imported packs are data-only, validated, and reversible.
- Diagnostics are demonstrably redacted.
- Typecheck, tests, builds, DMG verification, and visual QA pass.
- README, release notes, screenshots, pack documentation, and privacy/security
  notes match the shipped behavior.
- A new prerelease is built only after the user approves the final public
  GitHub release action.

## First Actions for the Next Agent

1. Read this file, `ROADMAP.md`, `README.md`, and `git log -12 --oneline`.
2. Run `git status --short --branch` and preserve every change not made by that
   agent.
3. Run the existing baseline: `npm run typecheck`, `npm test`, and `npm run
   build`.
4. Create a `codex/next-level-sprint` branch unless the user asks to work on
   `main`.
5. Add pure shared alert and rehearsal contracts with unit tests first.
6. Extract common show-command functions without changing behavior.
7. Implement and visually verify the Remote Show Deck before moving to the next
   deliverable.
8. Commit each deliverable independently with its tests and documentation.

Do not resume the skipped rules-engine feature during this sprint.
