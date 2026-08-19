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
