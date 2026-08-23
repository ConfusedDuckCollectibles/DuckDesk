# Duck Desk v0.1.0-alpha.3

Duck Desk alpha 3 replaces the complete bundled sound library with richer,
better-balanced cues designed for long live shows.

## New In Alpha 3

- Rebuilt all 50 bid, sale, tip, share, and audience-action cues across the 10 sound themes.
- Replaced pitch-shifted synthesizer variations with individually layered digital, broadcast, glass, tabletop, mechanical, crowd, weather, and organic recordings.
- Redesigned Thunder Strike with distant thunder, filtered wind, and restrained accents instead of the previous harsh synthetic crack.
- Gave every sound theme a distinct identity while keeping each event recognizable during a busy show.
- Shortened bid cues and allowed sales and tips slightly more room without drowning out the seller.
- Trimmed dead air from source-pack effects so alerts react promptly.
- Applied consistent loudness targets, gentle peak control, and quieter mastering for Storm and Soft Focus.
- Added a deterministic audio build pipeline so all 50 mastered WAV files can be reproduced from a clean checkout.
- Added curated CC0 source recordings, original pack licenses, and detailed third-party audio credits.
- Kept custom per-event sound files, the master effects-volume control, and immediate mute behavior unchanged.

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

Download `DuckDesk-0.1.0-alpha.3-arm64.dmg` from the Assets section below.

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
