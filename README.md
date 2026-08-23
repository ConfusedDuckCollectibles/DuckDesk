# Duck Desk

Mac-native, local-first live seller companion prototype for Whatnot sellers.

Duck Desk is intended to become a free, open-source alternative for sellers who want professional live stream overlays without subscriptions, cloud lock-in, or closed tooling. The project is MIT licensed and built around visible browser events, localhost communication, and transparent code.

V0 now has a double-clickable Mac app that starts the local event bridge automatically:

```text
Chrome Extension or test sale -> Duck Desk Mac app -> WebSocket -> OBS overlay
```

AI assistant, accounts, subscriptions, cloud services, databases, private Whatnot APIs, and undocumented protocol reverse engineering are intentionally out of scope for V0.

## Open Source

- License: MIT.
- Contributing guide: `CONTRIBUTING.md`.
- Security policy: `SECURITY.md`.
- Roadmap: `ROADMAP.md`.

Duck Desk should only observe visible seller-page content that the seller can already see in their browser. Do not contribute credential scraping, private API usage, stream-key handling, or hidden telemetry.

## Structure

```text
apps/
  desktop/    Electron macOS app that starts the bridge and serves the overlay
  extension/  Chrome MV3 extension and Whatnot DOM observer adapter
  overlay/    Vue 3 transparent OBS overlay
  server/     Local HTTP/WebSocket service
packages/
  shared/     Shared event types and normalization
```

## Use The Mac App

The packaged app lives at:

```text
apps/desktop/release/mac-arm64/Duck Desk.app
```

The DMG lives at:

```text
apps/desktop/release/Duck Desk-0.0.1-arm64.dmg
```

Open `Duck Desk.app`. The app starts the local bridge automatically on:

```text
http://localhost:8741
```

In OBS, add a Browser Source with:

```text
http://localhost:8741/overlay
```

Set the Browser Source size to `1080 x 1920` for a phone-first Whatnot layout. Use the app buttons to copy the overlay URL, open an overlay preview, reveal the Chrome extension folder, send test sale/bid/audience events, and switch overlay themes.

Because this prototype is not code-signed yet, macOS may require right-clicking the app and choosing Open the first time.

Use `Stream Title` in the Mac app to add viewer-facing show text under the Duck Desk banner. `GIF Reactions` supports temporary external `.gif`, `.webp`, and Giphy page URLs that stay available in the app until Duck Desk is restarted. Saved GIFs can be renamed, triggered manually from the app, positioned center/top/bottom/left/right, and sized small/medium/big.

The current add-on set also includes OBS auto-add, a jumbotron stage with optional camera frame, milestone thresholds, a timed Hype Meter, promo banner rotation, and improved local Whatnot page detection for bids, sales, chat, follows, bookmarks, and reactions.

## Full Whatnot Setup Guide

This setup uses one phone-first OBS scene:

```text
Phone camera or Whatnot stream source
        +
Duck Desk Overlay Browser Source
        =
Vertical Whatnot show layout
```

Duck Desk should be one overlay source that sits above your camera/product feed for the whole show. You do not need a separate overlay source for every effect.

### 1. Install OBS Studio

Download OBS Studio from:

```text
https://obsproject.com/download
```

Install it with the default options. If OBS opens an auto-configuration wizard, you can cancel it for now because this project uses a vertical Whatnot-style canvas.

### 2. Set OBS To A Phone-First Canvas

Open OBS, then go to:

```text
Settings -> Video
```

Set both of these to:

```text
1080x1920
```

Use:

```text
Base (Canvas) Resolution: 1080x1920
Output (Scaled) Resolution: 1080x1920
Common FPS Values: 30
```

This makes OBS match a vertical phone stream instead of a normal landscape desktop stream.

### 3. Stream Your Phone Camera To The Mac

Most Whatnot sellers point a phone at the table or product area, then let OBS on the Mac combine that camera with the Duck Desk overlay.

Recommended iPhone route:

1. Put the iPhone on a tripod or overhead mount.
2. Keep the iPhone and Mac near each other, on the same Apple ID when using Continuity Camera.
3. Plug the iPhone into power. USB is best for long shows.
4. In OBS, click `+` under Sources.
5. Choose `Video Capture Device`.
6. Pick your iPhone camera if it appears.
7. Resize the camera to fill the vertical canvas.

Other phone camera routes also work:

- Camo
- EpocCam
- DroidCam
- NDI camera apps
- any USB webcam or capture card that OBS can see

For those apps, install the phone app and the matching Mac app or OBS plugin, then add it in OBS as a camera/video source.

Audio tips:

1. Use a Mac mic, USB mic, or the phone camera app's audio if it is reliable.
2. Watch the OBS audio meters before going live.
3. Keep the audio source below clipping, usually in the yellow but not pinned red.

In OBS:

1. Click `+` under Sources.
2. Add your camera source.
3. Put the camera below the overlay source.
4. Resize it to fill the vertical canvas.

The product/camera source is the bottom layer.

### 4. Open Duck Desk

Open:

```text
apps/desktop/release/mac-arm64/Duck Desk.app
```

Duck Desk starts the local overlay bridge automatically:

```text
http://localhost:8741
```

Keep Duck Desk open while streaming.

### 5. Add The Duck Desk Overlay To OBS

In OBS:

1. Click `+` under Sources.
2. Choose `Browser`.
3. Name it `Duck Desk Overlay`.
4. Set URL to:

```text
http://localhost:8741/overlay
```

5. Set Width to:

```text
1080
```

6. Set Height to:

```text
1920
```

7. Click OK.
8. Put this Browser Source above your camera/product source.
9. Right-click the source and choose `Transform -> Fit to Screen` if it does not fill the canvas.

The overlay should show a persistent top HUD/ticker even when no sale is happening.

### 6. Test The Overlay

In Duck Desk, click:

- `Test Sale`
- `Test Bid`
- `Audience Action`

These buttons are disabled unless `Demo Mode` is on. Demo Mode is for local overlay testing only; turning it off clears test events from the OBS overlay. You can also switch themes in Duck Desk and see the top HUD/ticker change immediately.

### 7. Load The Chrome Extension

Duck Desk includes a button named:

```text
Chrome Extension
```

Click it to reveal the built extension folder.

Then in Chrome:

1. Open `chrome://extensions`.
2. Turn on Developer Mode.
3. Click `Load unpacked`.
4. Select the extension folder that Duck Desk revealed.

The extension is the piece that watches the Whatnot seller page and sends local events into Duck Desk.

### 8. Connect OBS To Whatnot And Start The Show

Use the official Whatnot OBS flow from Chrome on the Mac.

Typical flow:

1. Log into Whatnot.
2. Open the show tools for the show you are about to run.
3. Connect Whatnot to OBS from the show tools page.
4. Let Whatnot apply the stream settings to OBS.
5. Start the show from the show tools page.
6. Keep Chrome, OBS, and Duck Desk open while streaming.

Important details:

- Use Chrome for the Whatnot-to-OBS connection.
- If a Chrome extension blocks the connection, try an Incognito window with only the needed extensions enabled.
- Do not start the OBS show from the regular livestream page when using the show tools flow.
- If Whatnot reports `1920x1080`, the canvas is wrong for this phone-first layout. Reopen OBS and confirm both video resolutions are `1080x1920`.
- On first setup after updating the OBS profile, you may need to close OBS, reopen it, reconnect from Whatnot show tools, and then start the show.

Official Whatnot references:

- `https://help.whatnot.com/hc/en-us/articles/5497980244749-Using-OBS-with-your-Livestream`
- `https://selleracademy.whatnot.com/productionguide`

For V0, the Whatnot detection is intentionally DOM-based and conservative. If a real auction/sale state is not detected yet, use the Duck Desk test buttons while we tune the Whatnot adapter against the actual seller page.

### 9. Practice Bids Before A Public Show

Whatnot has two useful practice paths:

- `Rehearsal Mode` is the best path for simulated buyers and practice bids, when your seller account has access to it.
- `Private Show` is useful for testing camera, OBS, audio, overlays, and seller tools, but purchases in a private show are real if someone joins and buys.

Duck Desk can prove the OBS overlay, sound, and event animation path with its built-in test buttons. Real Whatnot bid/win detection still needs to be validated against the actual seller page DOM during Rehearsal Mode or a real/private show with bidding activity.

### 10. Layer Order In OBS

Your OBS sources should look roughly like this:

```text
Duck Desk Overlay        top
Phone/Product Camera     below it
Background/Other         bottom
```

The overlay is transparent except for its HUD, ticker, alerts, and effects.

### 11. Troubleshooting

If nothing appears in OBS:

1. Make sure Duck Desk is open.
2. Open `http://localhost:8741/overlay` in a browser.
3. Confirm OBS Browser Source URL is exactly `http://localhost:8741/overlay`.
4. Confirm Browser Source Width is `1080`.
5. Confirm Browser Source Height is `1920`.
6. Click `Refresh` on the OBS Browser Source.
7. Click `Test Sale` in Duck Desk.

If the overlay looks tiny or sideways:

1. Go to `OBS -> Settings -> Video`.
2. Set Base Canvas to `1080x1920`.
3. Set Output Resolution to `1080x1920`.
4. Right-click the overlay source.
5. Choose `Transform -> Fit to Screen`.

If Whatnot events do not trigger yet:

1. Confirm the Chrome extension is loaded.
2. Keep the Whatnot seller page open in Chrome.
3. Use Duck Desk test buttons to verify OBS is working.
4. Update `apps/extension/src/content/adapters/whatnot.ts` once you can inspect the real seller page DOM.

## Add-On Library

The Mac app includes a Library section with add-ons that update the live overlay immediately:

- `30 Total Themes` includes 20 standard looks and 10 Premium Animated themes in the main Overlay Theme area, all included free with the open-source app.
- Premium Animated themes include Thunderstorm Arena, Cyber Duck City, Treasure Vault, Arcade Boss Battle, Cosmic Auction, Haunted Drop, Sports Broadcast, Anime Power-Up, Candy Rush, and Luxury Nightclub.
- Event sounds are built into the Mac app with an always-visible Sound On/Off toggle.
- `Noise Machines` adds extra sound-pad controls for previewing sale, bid, and audience cues.
- `Bid Ladder` adds a live bid panel showing the latest bidder and next bid target.
- `Hype Bursts` adds screen-edge flashes and animated sticker-style loops when audience or auction events hit.
- `GIF Reactions` adds named animated GIF stickers that are triggered manually from the Mac app.
- `Leaderboard Deck` adds a visible stream panel immediately, then fills with top buyers from detected sales.

Click `Add` in the Library, then watch the `Active Add-Ons` section in the Mac app and the OBS overlay. The app loads add-on controls immediately, theme packs add new choices to the top theme picker, and the overlay changes without restarting OBS or re-adding the Browser Source. Click `Added` again to turn an add-on off.

## Install

```bash
npm install
```

## Build The Mac App

```bash
npm run mac:app
```

Build a DMG:

```bash
npm run mac:dmg
```

## Run The Local Service

```bash
npm run dev:server
```

The service listens on:

```text
http://localhost:8741
ws://localhost:8741/ws
```

Health check:

```bash
curl http://localhost:8741/health
```

## Run The Overlay

In another terminal:

```bash
npm run dev:overlay
```

Open:

```text
http://localhost:5173
```

For development OBS testing without the Mac app, add a Browser Source pointed at `http://localhost:5173`. Set the browser source size to `1080 x 1920` and keep the background transparent.

## Trigger A Fake Sale

With the server and overlay running:

```bash
npm run mock:sale
```

Or:

```bash
curl -X POST http://localhost:8741/events \
  -H "Content-Type: application/json" \
  -d '{
    "type":"sale",
    "buyer":"TestBuyer",
    "amount":28,
    "item":"Test Wheel Spin",
    "timestamp":123456789
  }'
```

The overlay should queue the sale and show an animated `SOLD!` alert.

## Build And Load The Chrome Extension

Build the extension:

```bash
npm run build -w @duck-desk/extension
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.

The extension popup includes a `Send Fake Sale` debug button. The content script also starts a defensive `MutationObserver` on `https://www.whatnot.com/*` and sends detected sale events to the local service through the background service worker.

The Mac app also packages the built extension and includes a `Reveal Chrome Extension` button.

## Development Notes

- Whatnot-specific DOM parsing lives in `apps/extension/src/content/adapters/whatnot.ts`.
- The rest of the app only understands normalized `ShowEvent` objects from `packages/shared`.
- The first parser is intentionally conservative and text-driven. It should be updated against the real seller page DOM after the mock pipeline and debug extension path are verified.
