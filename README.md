# Duck Desk

Mac-native, local-first live seller companion prototype for Whatnot sellers.

V0 now has a double-clickable Mac app that starts the local event bridge automatically:

```text
Chrome Extension or test sale -> Duck Desk Mac app -> WebSocket -> OBS overlay
```

AI assistant, accounts, subscriptions, cloud services, databases, private Whatnot APIs, and undocumented protocol reverse engineering are intentionally out of scope for V0.

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

### 3. Add Your Phone Camera Or Product Camera

Most Whatnot sellers point a phone at the table or product area.

You can use any camera workflow OBS supports. Common options:

- iPhone Continuity Camera on macOS
- DroidCam or another phone-camera OBS plugin
- A USB webcam
- A capture source already provided by your Whatnot setup

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

You should see effects appear in OBS. You can also switch themes in Duck Desk and see the top HUD/ticker change immediately.

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

### 8. Start Your Whatnot Show

Use your normal Whatnot seller flow.

Typical flow:

1. Log into Whatnot.
2. Open your seller/show page.
3. Open the live show tools.
4. Connect Whatnot to OBS if your show flow requires it.
5. Start or open the show.
6. Keep the Whatnot seller page open while Duck Desk is running.

For V0, the Whatnot detection is intentionally DOM-based and conservative. If a real auction/sale state is not detected yet, use the Duck Desk test buttons while we tune the Whatnot adapter against the actual seller page.

### 9. Layer Order In OBS

Your OBS sources should look roughly like this:

```text
Duck Desk Overlay        top
Phone/Product Camera     below it
Background/Other         bottom
```

The overlay is transparent except for its HUD, ticker, alerts, and effects.

### 10. Troubleshooting

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

The Mac app includes a Library section for future show add-ons:

- noise machines and sound packs
- theme packs with many more overlay skins
- bid ladders and auction widgets
- hype bursts and screen-edge effects
- buyer leaderboards and milestone panels

The current Library UI is a prototype surface. Clicking `Add` marks a pack as added inside the app, but the add-ons do not yet download assets or alter the overlay automatically. The next implementation step is to connect Library selections to overlay configuration messages.

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
