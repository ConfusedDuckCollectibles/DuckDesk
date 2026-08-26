<p align="center">
  <img src="docs/images/duck-desk-neon-duck.png" width="190" alt="Duck Desk neon duck logo">
</p>

<h1 align="center">Duck Desk</h1>

<p align="center">
  A free, open-source Mac and Windows companion for interactive Whatnot streams.
</p>

<p align="center">
  <a href="https://github.com/ConfusedDuckCollectibles/DuckDesk">Project Home</a> ·
  <a href="#download">Download</a> ·
  <a href="#simple-setup-guide">Simple Setup</a> ·
  <a href="#troubleshooting">Troubleshooting</a> ·
  <a href="https://www.whatnot.com/user/confusedduckcollectibles">Follow on Whatnot</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

> **Public alpha:** Duck Desk `v0.1.0-alpha.3` is available from the [Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases/tag/v0.1.0-alpha.3). Download the Mac `.dmg` or Windows `.exe` installer. You do not need Terminal or PowerShell for normal use.

Duck Desk adds a professional, game-like layer to a vertical live-selling stream. It runs locally on your computer, sends its transparent overlay to OBS, and gives you one place to control themes, GIFs, sounds, goals, timers, leaderboards, and stream effects.

No subscription is required. There are no Duck Desk accounts, cloud services, hidden analytics, or AI assistant features.

![Duck Desk dashboard showing OBS setup and live preflight](docs/images/duck-desk-dashboard.png)

## Download

Most people should download a finished installer. You do not need the source code, Node.js, or Terminal. Overlay themes and seller tools are the same on both platforms; only the installer differs.

1. Open [Duck Desk v0.1.0-alpha.3](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases/tag/v0.1.0-alpha.3).
2. Find the `Assets` area near the bottom of the release.
3. Download one installer:
   - **Mac (Apple silicon):** the file ending in `arm64.dmg`
   - **Windows (64-bit):** the file ending in `windows-x64.exe`
4. Do not download the `Source code` files unless you plan to work on Duck Desk as a developer.

**Mac:** This alpha supports Apple-silicon Macs. To check your Mac, open the Apple menu and choose `About This Mac`. It is supported when the `Chip` line says Apple M1, M2, M3, M4, or a newer Apple chip. Intel Macs are not included in this alpha. The app is not yet signed or notarized through Apple's developer program, so macOS may ask you to right-click Duck Desk and choose `Open` the first time.

**Windows:** This alpha supports 64-bit Windows 10 and 11. The installer is unsigned, so SmartScreen may say Windows protected your PC. Choose `More info`, then `Run anyway`. Install for your user account; administrator permission is not required.

The app is built directly from the public source in this repository, and every release includes a matching `.sha256` checksum file for each installer.

Duck Desk does not update itself yet. Check the [Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases) for newer builds and install them over the existing copy. Your creator settings are stored separately and remain available after an update.

## What Duck Desk Includes

- 36 stream themes, including 16 premium themes with distinct border motion and alert choreography.
- A persistent vertical stream frame, live header, ticker, and open-source footer.
- Manual GIF reactions with names, sizes, and screen positions.
- 10 audio themes with 50 individually produced cues for bids, sales, tips, shares, and audience actions, plus a master mute switch.
- Custom sound files for each individual event type, plus a saved master effects-volume control. Duck Desk safely copies files into its private app-data folder.
- Hype bursts, milestones, auction timers, goals, promo banners, and show recaps.
- Bid ladder, activity feed, buyer leaderboard, jumbotron, and show scenes.
- One-click OBS source setup with repair and refresh.
- A Live Preflight strip that checks the desktop app, OBS, Chrome extension, seller page, and real event path.
- Automatic saving for your themes, add-ons, title, GIF library, sounds, goals, banners, and timers.

## What You Need

- A Mac with Apple silicon, or a 64-bit Windows 10/11 PC.
- [OBS Studio](https://obsproject.com/download) for your operating system.
- Google Chrome.
- A Whatnot seller account.
- A phone, webcam, or capture card for your product camera.
- Duck Desk open on the same computer as OBS while you stream.

You do **not** need Terminal or PowerShell for normal use.

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

1. Download [OBS Studio](https://obsproject.com/download) for Mac or Windows.
2. Open the downloaded installer.
3. On Mac, move OBS into your Applications folder when asked. On Windows, finish the OBS installer.
4. Open OBS.

If OBS shows an automatic setup wizard, it is okay to close the wizard. The next step sets the correct vertical size.

### 2. Make OBS Vertical

1. Open OBS Settings: on Mac, click `OBS` in the menu bar, then `Settings`. On Windows, click `File`, then `Settings`.
2. Click `Video` on the left.
3. Set `Base (Canvas) Resolution` to `1080x1920`.
4. Set `Output (Scaled) Resolution` to `1080x1920`.
5. Set `Common FPS Values` to `30`.
6. Click `OK`.

The OBS canvas should now be tall like a phone screen, not wide like a television.

### 3. Install Duck Desk

1. Open the [Duck Desk Releases page](https://github.com/ConfusedDuckCollectibles/DuckDesk/releases).
2. Open the newest release marked `Pre-release` or `Latest`.
3. Under `Assets`, download the installer for your computer.

**Mac**

1. Download the file ending in `arm64.dmg`.
2. Double-click the downloaded DMG.
3. Drag `Duck Desk` into `Applications`.
4. Open `Applications`, then open Duck Desk.

The current alpha is not Apple-notarized. If macOS refuses the first launch, right-click Duck Desk, choose `Open`, then choose `Open` again. You only need to do that once.

**Windows**

1. Download the file ending in `windows-x64.exe`.
2. Double-click the installer.
3. If SmartScreen appears, choose `More info`, then `Run anyway`.
4. Finish the one-click install, then open Duck Desk from the Start menu or desktop shortcut.

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

Apple provides additional Continuity Camera help in the [macOS User Guide](https://support.apple.com/guide/mac-help/use-iphone-as-a-webcam-mchl77879b8a/mac). Continuity Camera is a Mac feature. On Windows, use a USB webcam, a capture card, or a phone-camera app such as DroidCam.

#### Android, older iPhone, webcam, or capture card

You can use any camera source that appears in OBS, including Camo, DroidCam, NDI camera apps, a USB webcam, or a capture card. Install the camera maker's software for your operating system if it requires one, then add it through `Sources` → `Video Capture Device`.

In the OBS Sources list, keep this order:

```text
Duck Desk Overlay       top
Phone/Product Camera    underneath
Background              bottom
```

### 6. Install The Duck Desk Chrome Extension

The extension watches only the visible Whatnot seller page and sends recognized events to Duck Desk on your computer. Keep that seller page open while you stream.

1. In Duck Desk, click `Chrome Extension`.
2. Finder (Mac) or File Explorer (Windows) opens the correct extension folder for you.
3. In Chrome, enter `chrome://extensions` in the address bar.
4. Turn on `Developer mode` in the upper-right corner.
5. Click `Load unpacked`.
6. Select the folder Duck Desk opened.
7. Pin Duck Desk from Chrome's Extensions menu so its status is easy to check.

After installing a newer Duck Desk build, return to `chrome://extensions`, click the reload icon on Duck Desk, and refresh the Whatnot seller page once.

For tip alerts, leave Whatnot's buyer tip message visible in live chat. Whatnot normally announces live tips in chat, but sellers can disable that message; Duck Desk needs the visible announcement to read the tipper and amount. See Whatnot's official [Receive tips as a seller](https://help.whatnot.com/hc/en-us/articles/15296059461005-Receive-tips-as-a-seller) guide.

For share alerts, Duck Desk establishes the visible show share count as its starting point and alerts only when that count increases. When Whatnot displays a sharer's name, the alert includes it. When only the count is available, the alert says `Community Boost` instead of making up a username.

### 7. Test Before Going Live

1. In Duck Desk, turn `Demo Mode` on.
2. Click `Test Sale`.
3. Click `Test Bid`.
4. Click `Audience Action`.
5. Click `Test Tip`.
6. Click `Test Share`.
7. Watch the Duck Desk preview and the OBS canvas.
8. Confirm that animations and sounds work.
9. Turn `Demo Mode` off.

Demo events do not change the live totals in the dashboard. Turning Demo Mode off clears test alerts from the overlay, and the overlay will not show invented names, bids, tips, sales, or shares while Demo Mode is off.

Whatnot Rehearsal Mode, when available for your seller account, is the best place to practice realistic show activity. A private show is useful for checking camera, audio, OBS, and overlays, but any actual purchases made there are still real purchases.

#### Test A Real Share In A Private Show

This is the easiest free test of the complete Whatnot-to-Duck-Desk connection.

1. Start your private show and keep its seller page visible in Chrome on the same computer as Duck Desk.
2. Confirm Duck Desk's Live Preflight says `Seller page connected`.
3. Send the private-show link to a second Whatnot account.
4. From that account, open the show and use Whatnot's Share button.
5. Watch for the compact `Show Shared` alert under the Duck Desk header in both the preview and OBS.
6. If it does not appear, refresh the seller page once, reload the Duck Desk extension at `chrome://extensions`, and try one more share.

Whatnot allows people with a private-show link to share it, and its visible share count updates live. See Whatnot's [private show](https://help.whatnot.com/hc/en-us/articles/6218017419021-Schedule-a-private-show) and [show sharing](https://help.whatnot.com/hc/en-us/articles/48071443244557-Share-your-show-as-a-seller) guides.

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
- Add `Audio Studio` from the library, then choose any of the 10 sound themes. Each theme uses its own instrument and texture set, not a stock sound with a different pitch.
- Press the play icon beside Bid, Sale, Audience, Tip, or Share to preview that exact cue.
- Use `Effects Volume` to set every sound from subtle to full volume. The percentage is saved automatically.
- Press `Choose` beside an event to use your own MP3, WAV, M4A, AAC, AIFF, or CAF file. Files must be under 20 MB and 12 seconds or shorter. On Mac, Duck Desk converts the file to a stream-safe WAV so the preview and OBS use the same cue. On Windows, WAV and MP3 files are the most reliable choices.
- Press the reset icon to return one event to the selected theme without changing the other event sounds.
- Keep `Event Sound On` enabled for automatic live cues, or mute every event sound at any time.
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

### Tests work but real events do not

The overlay and OBS connection are working if Demo Mode tests appear. Real event detection is separate and intentionally conservative. Keep the seller page visible, keep tip announcements enabled in chat, and reload the extension plus seller page after upgrading Duck Desk. Whatnot can change its visible seller-page layout. Please report the show-page state and Duck Desk version through [GitHub Issues](https://github.com/ConfusedDuckCollectibles/DuckDesk/issues) without sharing passwords, stream keys, addresses, or customer payment information.

### Sounds are silent

1. Confirm `Event Sound On` is enabled.
2. Turn up the computer's output volume.
3. Add `Audio Studio` and press the play icon beside an event sound.
4. Check that OBS and the Whatnot stream are using the intended audio source.

## Privacy And Safety

Duck Desk is local-first:

- The overlay service listens only on this computer at `127.0.0.1`.
- Duck Desk does not require an account.
- Duck Desk does not send analytics or telemetry to a Duck Desk server.
- OBS passwords are used only for the local connection and are not added to saved creator settings.
- The extension is designed to observe visible seller-page content, not passwords, cookies, private APIs, or hidden account data.

Do not share logs or screenshots containing stream keys, passwords, addresses, order details, or customer payment information.

Duck Desk is not affiliated with or endorsed by Whatnot. Sellers remain responsible for following Whatnot rules, giveaway requirements, and applicable laws.

## Open Source

Duck Desk is released under the [MIT License](LICENSE). The goal is to give live sellers a capable stream toolkit without subscriptions or closed ownership.

Duck Desk is created by Confused Duck Collectibles. [Follow Confused Duck Collectibles on Whatnot](https://www.whatnot.com/user/confusedduckcollectibles) to see upcoming shows and Duck Desk in action.

- [Third-party audio credits and CC0 source licenses](THIRD_PARTY_NOTICES.md)
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
- macOS to build the Apple-silicon DMG locally
- Windows to build the NSIS installer locally (or use GitHub Actions)

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

### Build installers

One Electron app is packaged for both platforms. Overlay, themes, and seller tools are not rewritten per OS.

```bash
npm run mac:dmg
npm run win:nsis
```

`mac:dmg` must run on a Mac. `win:nsis` must run on Windows. Official GitHub releases build both in parallel so you do not have to produce installers on your own machines.

The local artifacts are created under `apps/desktop/release/` and are intentionally excluded from Git.

### Publish an official GitHub build

Official downloads are created by the [Publish desktop release workflow](https://github.com/ConfusedDuckCollectibles/DuckDesk/actions/workflows/release.yml). GitHub starts a Mac runner and a Windows runner, installs the locked dependencies, typechecks every workspace, builds the Apple-silicon DMG and the Windows installer, creates SHA-256 checksums, and publishes all four files to a tagged release.

Before running the workflow, commit the new version in the package files and update `RELEASE_NOTES.md`. Then open `Actions` → `Publish desktop release` → `Run workflow`, enter that exact version without a leading `v`, choose whether it is a prerelease, and run it. A successful workflow creates the tag and Releases page automatically; no manual installer upload is needed.

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
  desktop/    Electron desktop app, local bridge, and OBS integration
  extension/  Chrome extension and visible-page event adapter
  overlay/    Vue transparent OBS overlay
  server/     Standalone local development server
packages/
  shared/     Shared event types and validation
```

Whatnot-specific visible-page parsing lives in `apps/extension/src/content/adapters/whatnot.ts`. The rest of Duck Desk consumes normalized events from `packages/shared`.

</details>
