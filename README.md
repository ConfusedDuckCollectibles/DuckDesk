<p align="center">
  <img src="docs/images/duck-desk-neon-duck.png" width="190" alt="Duck Desk neon duck logo">
</p>

<h1 align="center">Duck Desk</h1>

<p align="center">
  A free, open-source Mac companion for interactive Whatnot streams.
</p>

<p align="center">
  <a href="https://github.com/ConfusedDuckCollectibles/DuckDesk">Project Home</a> ·
  <a href="#download-the-mac-app">Download</a> ·
  <a href="#simple-setup-guide">Simple Setup</a> ·
  <a href="#troubleshooting">Troubleshooting</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

> **Public alpha:** Duck Desk `v0.1.0-alpha.1` is available from the [Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases/tag/v0.1.0-alpha.1). Download the Apple-silicon `.dmg` file to install it without Terminal.

Duck Desk adds a professional, game-like layer to a vertical live-selling stream. It runs locally on your Mac, sends its transparent overlay to OBS, and gives you one place to control themes, GIFs, sounds, goals, timers, leaderboards, and stream effects.

No subscription is required. There are no Duck Desk accounts, cloud services, hidden analytics, or AI assistant features.

![Duck Desk dashboard showing OBS setup and live preflight](docs/images/duck-desk-dashboard.png)

## Download The Mac App

Most people should download the finished Mac app. You do not need the source code, Node.js, or Terminal.

1. Open [Duck Desk v0.1.0-alpha.1](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases/tag/v0.1.0-alpha.1).
2. Find the `Assets` area near the bottom of the release.
3. Download the file ending in `arm64.dmg`. This is the Mac installer.
4. Do not download the `Source code` files unless you plan to work on Duck Desk as a developer.

This first build supports Apple-silicon Macs. To check your Mac, open the Apple menu and choose `About This Mac`. It is supported when the `Chip` line says Apple M1, M2, M3, M4, or a newer Apple chip. Intel Macs are not supported by this alpha.

The alpha is not yet signed or notarized through Apple's developer program. macOS may therefore ask you to right-click Duck Desk and choose `Open` the first time. The app is built directly from the public source in this repository, and every release includes a matching `.sha256` checksum file for integrity checking.

Duck Desk does not update itself yet. Check the [Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases) for newer builds and install them over the existing copy in Applications. Your creator settings are stored separately and remain available after an update.

## What Duck Desk Includes

- 30 stream themes, including 10 animated premium-style themes.
- A persistent vertical stream frame, live header, ticker, and open-source footer.
- Manual GIF reactions with names, sizes, and screen positions.
- Bid, sale, and audience sound effects with a master mute switch.
- Hype bursts, milestones, auction timers, goals, promo banners, and show recaps.
- Bid ladder, activity feed, buyer leaderboard, jumbotron, and show scenes.
- One-click OBS source setup with repair and refresh.
- A Live Preflight strip that checks the Mac app, OBS, Chrome extension, seller page, and real event path.
- Automatic saving for your themes, add-ons, title, GIF library, sounds, goals, banners, and timers.

## What You Need

- A Mac with Apple silicon.
- [OBS Studio](https://obsproject.com/download).
- Google Chrome.
- A Whatnot seller account.
- A phone, webcam, or capture card for your product camera.
- Duck Desk open on the Mac while you stream.

You do **not** need Terminal for normal use.

## How The Pieces Fit Together

```text
Your phone or camera
        +
Duck Desk transparent overlay
        ↓
       OBS
        ↓
Your vertical Whatnot stream
```

Your camera stays underneath. Duck Desk stays above it as one transparent OBS Browser Source. You do not add a separate OBS source for every effect.

<p align="center">
  <img src="docs/images/duck-desk-overlay.jpg" width="360" alt="Vertical Duck Desk overlay with live header, themed frame, and open-source footer">
</p>

<p align="center"><em>The open center is where your phone or product camera remains visible.</em></p>

## Simple Setup Guide

### 1. Install OBS

1. Download [OBS Studio for macOS](https://obsproject.com/download).
2. Open the downloaded installer.
3. Move OBS into your Applications folder when asked.
4. Open OBS.

If OBS shows an automatic setup wizard, it is okay to close the wizard. The next step sets the correct vertical size.

### 2. Make OBS Vertical

1. In OBS, click `OBS` in the Mac menu bar.
2. Click `Settings`.
3. Click `Video` on the left.
4. Set `Base (Canvas) Resolution` to `1080x1920`.
5. Set `Output (Scaled) Resolution` to `1080x1920`.
6. Set `Common FPS Values` to `30`.
7. Click `OK`.

The OBS canvas should now be tall like a phone screen, not wide like a television.

### 3. Install Duck Desk

1. Open the [Duck Desk Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases).
2. Open the newest release marked `Pre-release` or `Latest`.
3. Under `Assets`, download the file ending in `arm64.dmg`.
4. Double-click the downloaded DMG.
5. Drag `Duck Desk` into `Applications`.
6. Open `Applications`, then open Duck Desk.

The current alpha is not Apple-notarized. If macOS refuses the first launch, right-click Duck Desk, choose `Open`, then choose `Open` again. You only need to do that once.

### 4. Add Duck Desk To OBS

1. Open OBS first.
2. Open Duck Desk.
3. In the `OBS Connection` section, click `Connect + Add`.
4. Wait for the message to turn green.
5. Confirm that Live Preflight says `OBS Source: Ready`.

Duck Desk automatically authenticates with the OBS WebSocket server, adds `Duck Desk Overlay` to the current scene, fits it to the canvas, and refreshes old overlay files. It reads the standard local OBS password when available but does not save or log that password.

If Duck Desk cannot detect the password:

1. In OBS, click `Tools`.
2. Click `WebSocket Server Settings`.
3. Make sure `Enable WebSocket server` is checked.
4. Copy the password shown there.
5. Enter it in Duck Desk and click `Connect + Add` again.

After the first setup, the button becomes `Repair + Refresh`. Use it whenever OBS appears to show an older version of the overlay. It repairs the existing source instead of creating duplicates.

### 5. Add Your Phone Camera

#### Easiest iPhone option: Continuity Camera

1. Put the iPhone on a tripod, stand, or overhead mount.
2. Connect the iPhone to power. A USB cable is recommended for long streams.
3. Make sure the iPhone and Mac use the same Apple Account and have Wi-Fi and Bluetooth enabled.
4. In OBS, click `+` under `Sources`.
5. Choose `Video Capture Device`.
6. Choose the iPhone camera.
7. Resize the camera until it fills the vertical canvas.

Apple provides additional Continuity Camera help in the [macOS User Guide](https://support.apple.com/guide/mac-help/use-iphone-as-a-webcam-mchl77879b8a/mac).

#### Android, older iPhone, webcam, or capture card

You can use any camera source that appears in OBS, including Camo, DroidCam, NDI camera apps, a USB webcam, or a capture card. Install the camera maker's Mac software if it requires one, then add it through `Sources` → `Video Capture Device`.

In the OBS Sources list, keep this order:

```text
Duck Desk Overlay       top
Phone/Product Camera    underneath
Background              bottom
```

### 6. Install The Duck Desk Chrome Extension

The extension watches only the visible Whatnot seller page and sends recognized events to Duck Desk on your Mac.

1. In Duck Desk, click `Chrome Extension`.
2. Finder opens the correct extension folder for you.
3. In Chrome, enter `chrome://extensions` in the address bar.
4. Turn on `Developer mode` in the upper-right corner.
5. Click `Load unpacked`.
6. Select the folder Duck Desk opened in Finder.
7. Pin Duck Desk from Chrome's Extensions menu so its status is easy to check.

After installing a newer Duck Desk build, return to `chrome://extensions`, click the reload icon on Duck Desk, and refresh the Whatnot seller page once.

### 7. Test Before Going Live

1. In Duck Desk, turn `Demo Mode` on.
2. Click `Test Sale`.
3. Click `Test Bid`.
4. Click `Audience Action`.
5. Watch the Duck Desk preview and the OBS canvas.
6. Confirm that animations and sounds work.
7. Turn `Demo Mode` off.

Turning Demo Mode off clears test events and test counters. The overlay will not show invented names, bids, or sales while Demo Mode is off.

Whatnot Rehearsal Mode, when available for your seller account, is the best place to practice realistic show activity. A private show is useful for checking camera, audio, OBS, and overlays, but any actual purchases made there are still real purchases.

### 8. Connect OBS To Your Whatnot Show

1. Keep Duck Desk, OBS, and Chrome open.
2. In Chrome, sign in to Whatnot.
3. Open the seller tools for the show you are about to run.
4. Use Whatnot's OBS connection flow.
5. Confirm the outgoing layout is vertical.
6. Start the show from the Whatnot show tools.

See Whatnot's official [Using OBS with your Livestream](https://help.whatnot.com/hc/en-us/articles/5497980244749-Using-OBS-with-your-Livestream) guide for the current Whatnot-side connection steps.

## Understanding Live Preflight

| Check | Ready message | What it means |
| --- | --- | --- |
| Local Bridge | `Online` | Duck Desk's private local service is running. |
| OBS Source | `Ready` | OBS accepted and refreshed the Duck Desk overlay. |
| Seller Page | `Seller page connected` | The Chrome extension can see an open Whatnot page. |
| Real Data | `Received just now` | A real page event reached Duck Desk. |

`No real events yet` is normal before a show begins. It does not generate filler data for the stream.

## Using Duck Desk During A Show

- Pick a theme from the top theme area. Installed theme packs appear there automatically.
- Enter your show name under `Stream Title`, then click `Apply`.
- Use `GIF Reactions` for manual animated reactions at any time.
- Use GIF position and size controls to keep media away from the product.
- Use `Noise Machines` for manual sound buttons.
- Keep `Event Sound On` enabled for automatic bid, sale, and audience cues, or mute it at any time.
- Use scenes for Starting, Auction, Break, Winner, and Ending screens.
- Click `Repair + Refresh` if OBS ever looks one update behind.

Your choices are saved automatically. Demo Mode, live sales totals, test counters, and OBS passwords are intentionally not restored when the app restarts.

## Troubleshooting

### OBS says setup is needed

1. Make sure OBS is open.
2. In OBS, open `Tools` → `WebSocket Server Settings`.
3. Enable the WebSocket server.
4. Return to Duck Desk and click `Connect + Add`.
5. If needed, enter the OBS WebSocket password shown in that settings window.

### OBS shows an old Duck Desk design

1. Keep OBS and Duck Desk open.
2. Click `Repair + Refresh` in Duck Desk.
3. Wait for the green confirmation message.

### The overlay is tiny, sideways, or cropped

1. In OBS, open `Settings` → `Video`.
2. Confirm both resolutions are `1080x1920`.
3. In Sources, right-click `Duck Desk Overlay`.
4. Choose `Transform` → `Fit to Screen`.

### The seller page is not connected

1. Open Chrome.
2. Open the Whatnot seller page for the show.
3. Confirm Duck Desk is enabled at `chrome://extensions`.
4. Click the extension reload icon.
5. Refresh the Whatnot seller page.
6. Open the Duck Desk extension popup and check both status rows.

### Tests work but real bids or sales do not

The overlay and OBS connection are working if Demo Mode tests appear. Real event detection is separate and intentionally conservative. Whatnot can change its visible seller-page layout, and its public seller webhooks do not currently provide every individual live bid. Please report the show-page state and Duck Desk version through [GitHub Issues](https://github.com/ConfusedDuckCollectibles/DuckDesk/issues) without sharing passwords, stream keys, addresses, or customer payment information.

### Sounds are silent

1. Confirm `Event Sound On` is enabled.
2. Turn up the Mac output volume.
3. Add `Noise Machines` and press one of its manual sound buttons.
4. Check that OBS and the Whatnot stream are using the intended audio source.

## Privacy And Safety

Duck Desk is local-first:

- The overlay service listens only on your Mac at `127.0.0.1`.
- Duck Desk does not require an account.
- Duck Desk does not send analytics or telemetry to a Duck Desk server.
- OBS passwords are used only for the local connection and are not added to saved creator settings.
- The extension is designed to observe visible seller-page content, not passwords, cookies, private APIs, or hidden account data.

Do not share logs or screenshots containing stream keys, passwords, addresses, order details, or customer payment information.

Duck Desk is not affiliated with or endorsed by Whatnot. Sellers remain responsible for following Whatnot rules, giveaway requirements, and applicable laws.

## Open Source

Duck Desk is released under the [MIT License](LICENSE). The goal is to give live sellers a capable stream toolkit without subscriptions or closed ownership.

- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Community standards](CODE_OF_CONDUCT.md)
- [Product roadmap](ROADMAP.md)
- [Report a bug or request a feature](https://github.com/ConfusedDuckCollectibles/DuckDesk/issues)

<details>
<summary><strong>Developer setup and project structure</strong></summary>

### Requirements

- Node.js 20 or newer
- npm
- macOS for the packaged desktop build

### Install dependencies

```bash
npm install
```

### Typecheck everything

```bash
npm run typecheck
```

### Build everything

```bash
npm run build
```

### Build the Mac app and DMG

```bash
npm run mac:dmg
```

The local artifacts are created under `apps/desktop/release/` and are intentionally excluded from Git.

### Publish an official GitHub build

Official downloads are created by the [Publish Mac release workflow](https://github.com/ConfusedDuckCollectibles/DuckDesk/actions/workflows/release.yml). GitHub starts with a clean Mac runner, installs the locked dependencies, typechecks every workspace, builds the Chrome extension and Apple-silicon app, creates the DMG and SHA-256 checksum, and publishes both files to a tagged release.

Before running the workflow, commit the new version in the package files and update `RELEASE_NOTES.md`. Then open `Actions` → `Publish Mac release` → `Run workflow`, enter that exact version without a leading `v`, choose whether it is a prerelease, and run it. A successful workflow creates the tag and Releases page automatically; no manual DMG upload is needed.

### Run development services

```bash
npm run dev:server
npm run dev:overlay
```

The development overlay is available at `http://localhost:5173`. The packaged app serves the production overlay at `http://localhost:8741/overlay` and the WebSocket bridge at `ws://localhost:8741/ws`.

### Build the Chrome extension

```bash
npm run build -w @duck-desk/extension
```

Load `apps/extension/dist` as an unpacked Chrome extension.

### Project structure

```text
apps/
  desktop/    Electron Mac app, local bridge, and OBS integration
  extension/  Chrome extension and visible-page event adapter
  overlay/    Vue transparent OBS overlay
  server/     Standalone local development server
packages/
  shared/     Shared event types and validation
```

Whatnot-specific visible-page parsing lives in `apps/extension/src/content/adapters/whatnot.ts`. The rest of Duck Desk consumes normalized events from `packages/shared`.

</details>
