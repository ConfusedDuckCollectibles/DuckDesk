# Duck Desk v0.1.0-alpha.4

Duck Desk alpha 4 is the show-ready control room: a clearer desktop, a much larger theme pack, Mac and Windows installers, and a denser live sound library.

## New In Alpha 4

- Rebuilt the desktop into **Live**, **Setup**, and **Library**, with compact square rail buttons and section tabs (Show, Controls, Preview, Events, Connection, Preflight, Themes, Add-ons, Studio).
- Added a first-run ready path, Live Preflight as its own Setup tab, and a phone-canvas Preview that matches the OBS overlay.
- Overhauled the overlay: themed frames, Theme Art for premium looks, an animated ticker, safer widget placement, and calmer motion during alerts.
- Expanded the included pack to **56 themes**: 20 standard looks and **36** animated premium themes (20 new animated looks in this release).
- Shipped native **Mac (Apple silicon)** and **Windows (64-bit)** installers from the same app. No Terminal or PowerShell after install.
- Rebuilt live audio to **90 cues** across the 10 sound themes, with three bid variants and three audience-action variants per theme, plus cooldowns so rapid bids stay restrained while sales and tips are never dropped.
- Rewrote the README as a seller setup guide, with current screenshots and a get-on-stream path.
- Fixed GitHub publishing so a prerelease is not marked as Latest.

## Highlights

- Native Mac and Windows desktop apps with no Terminal or PowerShell required after installation.
- One-click authenticated OBS source setup, repair, canvas fitting, and refresh.
- 56 included themes: 20 standard themes and 36 animated premium-style themes.
- Persistent themed frame, live header, ticker, and optional GitHub footer.
- GIF reactions with saved names, manual triggers, placement, and sizing.
- 10 audio themes plus custom bid, sale, tip, share, and audience sounds with a master mute control.
- Hype bursts, goals, milestones, timers, promo banners, leaderboards, scenes, jumbotron, activity feed, and show recap.
- Live Preflight checks for the local bridge, OBS source, Chrome extension, seller page, and real event path.
- Local automatic saving for creator preferences without saving demo data or OBS passwords.

## Download

Download these files from the Assets section below:

- Mac (Apple silicon): `DuckDesk-0.1.0-alpha.4-arm64.dmg`
- Windows (64-bit): `DuckDesk-0.1.0-alpha.4-windows-x64.exe`

Intel Mac builds are not included in this alpha. Both installers are unsigned.

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
- Automatic app updates are not included yet.
- Duck Desk is not affiliated with or endorsed by Whatnot.

See the [customer setup guide](https://github.com/ConfusedDuckCollectibles/DuckDesk#get-on-stream) for complete OBS, phone-camera, Chrome extension, testing, and troubleshooting instructions.
