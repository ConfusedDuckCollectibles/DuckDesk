# Duck Desk v0.1.0-alpha.9

Duck Desk alpha 9 cleans up the streamer control room after live stream testing. Show-facing copy is easier to find, typing into those fields is stable during live status updates, and the Preview tab now keeps the section tabs where creators expect them.

## New In Alpha 9

- Fixed Stream Title and Promo Banners so live status refreshes no longer clear or replace text while you are typing.
- Moved Stream Title and Promo Banners together into Live Controls under **Title & Promo Banners**.
- Kept the OBS setup page focused on connection details by removing show-copy editing from that section.
- Removed the duplicate Promo Banners editor from the lower add-on module area.
- Fixed the Live section tab row so opening Stream Preview no longer shifts the tabs to the top-right.

## Highlights

- Native Mac and Windows desktop apps with no Terminal or PowerShell required after installation.
- One-click authenticated OBS source setup, repair, canvas fitting, and refresh.
- 63 included themes: 20 standard, 36 Premium Animated, 2 Premium Animated With Characters, and 5 Game Themes.
- Independent controls for the top banner and theme frame effects.
- Stable show text controls for stream titles and rotating promo banners.
- GIF reactions with saved names, manual triggers, placement, and sizing.
- 10 audio themes plus custom bid, sale, tip, share, and audience sounds with a master mute control.
- Alert Studio, rehearsal playback, community packs, and a phone Remote Show Deck.
- Hype bursts, goals, milestones, timers, promo banners, leaderboards, scenes, jumbotron, activity feed, and an opt-in show recap.
- Live Preflight and Production Health checks for the local bridge, OBS source, Chrome extension, seller page, and real event path.
- Local automatic saving for creator preferences without saving demo data or OBS passwords.

## Download

Download these files from the Assets section below:

- Mac (Apple silicon): `DuckDesk-0.1.0-alpha.9-arm64.dmg`
- Windows (64-bit): `DuckDesk-0.1.0-alpha.9-windows-x64.exe`

Intel Mac builds are not included in this alpha. The Mac build is ad-hoc signed but not Apple-notarized. The Windows installer is unsigned.

## Install

### Mac

1. Open the downloaded DMG.
2. Drag Duck Desk into Applications.
3. Open Applications.
4. Right-click Duck Desk and choose Open.
5. Choose Open again if macOS displays the unsigned-app warning.

The alpha is not yet signed or notarized with an Apple Developer certificate. Download it only from this official repository and compare its SHA-256 checksum with the included `.sha256` file when possible.

### Windows

1. Open the downloaded `.exe` installer.
2. If SmartScreen appears, choose More info, then Run anyway.
3. Finish the one-click install.
4. Open Duck Desk from the Start menu or desktop shortcut.

The Windows installer is not Authenticode-signed, so SmartScreen may warn on first launch. Download it only from this official repository and compare its SHA-256 checksum with the included `.sha256` file when possible.

## Important Alpha Notes

- Whatnot event recognition reads visible seller-page content and may need updates when Whatnot changes its interface.
- Real bid, sale, tip, and share detection must continue to be validated during rehearsal and live shows.
- Duck Desk should not be treated as the authoritative record for orders, payments, inventory, or buyer information.
- The Chrome extension is loaded manually as an unpacked extension in this alpha.
- Duck Desk can check GitHub for a newer release. It does not download or install updates by itself.
- Duck Desk is not affiliated with or endorsed by Whatnot.

See the [customer setup guide](https://github.com/ConfusedDuckCollectibles/DuckDesk#get-on-stream) for complete OBS, phone-camera, Chrome extension, testing, and troubleshooting instructions.
