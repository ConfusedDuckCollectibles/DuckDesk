# Duck Desk v0.1.0-alpha.2

Duck Desk alpha 2 makes live bid and sale moments faster, smaller, and easier to follow without covering the product area.

## New In Alpha 2

- Removed the permanent Hype and Last/Bid panels below the live header.
- Replaced oversized bottom event cards with compact themed alerts directly below the header.
- Bid alerts now stay briefly, while sale alerts remain slightly longer for recognition.
- Rapid auctions retain the first visible bid and newest pending bid instead of replaying stale intermediate bids.
- Long usernames and item names now fit safely at both 1080x1920 and phone-preview sizes.
- Added compact Tip Received and Show Shared alerts, live dashboard totals, activity-feed entries, ticker messages, and sounds.
- Added Audio Studio with 10 distinct sound worlds, 50 original bundled cues, a saved master volume control with immediate mute, and separate custom-file overrides for bids, sales, audience actions, tips, and shares.
- Custom sound imports are normalized to stream-safe WAV files so Mac and OBS playback stay consistent.
- Added clear dashboard section icons and a substantially larger full-frame stream preview.
- Added Demo Mode buttons for testing tips and shares without changing live totals.
- Added conservative live share-count detection and visible-chat tip detection to the Chrome extension.
- The extension now baselines existing page data instead of replaying old visible events when it starts.
- Improved release asset naming and refreshed the automated GitHub build pipeline.
- Expanded the customer-friendly download, build, and release documentation.
- Added a direct Whatnot follow link for Confused Duck Collectibles.

## Highlights

- Native Mac desktop app with no Terminal required after installation.
- One-click authenticated OBS source setup, repair, canvas fitting, and refresh.
- 30 included themes: 20 standard themes and 10 animated premium-style themes.
- Persistent themed frame, live header, ticker, and open-source footer.
- GIF reactions with saved names, manual triggers, placement, and sizing.
- 10 audio themes plus custom bid, sale, tip, share, and audience sounds with a master mute control.
- Hype bursts, goals, milestones, timers, promo banners, leaderboards, scenes, jumbotron, activity feed, and show recap.
- Live Preflight checks for the local bridge, OBS source, Chrome extension, seller page, and real event path.
- Local automatic saving for creator preferences without saving demo data or OBS passwords.
- Chrome extension health popup and visible-page event bridge.

## Download

Download `DuckDesk-0.1.0-alpha.2-arm64.dmg` from the Assets section below.

This build requires an Apple-silicon Mac. Intel Mac and Windows builds are not included in this alpha.

## Install

1. Open the downloaded DMG.
2. Drag Duck Desk into Applications.
3. Open Applications.
4. Right-click Duck Desk and choose Open.
5. Choose Open again if macOS displays the unsigned-app warning.

The alpha is not yet signed or notarized with an Apple Developer certificate. Download it only from this official repository and compare its SHA-256 checksum with the included `.sha256` file when possible.

## Important Alpha Notes

- Whatnot event recognition reads visible seller-page content and may need updates when Whatnot changes its interface.
- Real bid, sale, tip, and share detection must continue to be validated during rehearsal and live shows.
- Duck Desk should not be treated as the authoritative record for orders, payments, inventory, or buyer information.
- The Chrome extension is loaded manually as an unpacked extension in this alpha.
- Automatic app updates are not included yet.
- Duck Desk is not affiliated with or endorsed by Whatnot.

See the [customer setup guide](https://github.com/ConfusedDuckCollectibles/DuckDesk#simple-setup-guide) for complete OBS, phone-camera, Chrome extension, testing, and troubleshooting instructions.
