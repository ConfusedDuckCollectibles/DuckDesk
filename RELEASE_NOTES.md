# Duck Desk v0.1.0-alpha.5

Duck Desk alpha 5 gives sellers more control over how much of the overlay viewers see. Keep the full themed broadcast package, simplify it during quieter moments, or run notifications by themselves.

## New In Alpha 5

- Reduced the Duck Desk viewer branding so the seller's custom stream title carries more visual weight.
- Added a **Top Banner** switch in Live Controls. It updates the preview and OBS overlay immediately and persists after restart.
- Added a **Theme Effects** switch that removes frame borders, theme artwork, vignettes, ambient particles, sparkles, and background motion without disabling alerts, GIFs, or sounds.
- Added a practical notification-only setup: turn off Top Banner and Theme Effects while bid, sale, tip, share, and audience alerts continue to appear.
- Kept notification entrance motion intact when Theme Effects are off so alerts remain clear and readable.
- Made the open-source GitHub footer permanent and removed its former hide control.
- Refined the Live Controls grid so the new viewer controls remain wide, clear, and usable during a show.

## Highlights

- Native Mac and Windows desktop apps with no Terminal or PowerShell required after installation.
- One-click authenticated OBS source setup, repair, canvas fitting, and refresh.
- 56 included themes: 20 standard themes and 36 animated premium-style themes.
- Independent controls for the top banner and theme frame effects.
- GIF reactions with saved names, manual triggers, placement, and sizing.
- 10 audio themes plus custom bid, sale, tip, share, and audience sounds with a master mute control.
- Hype bursts, goals, milestones, timers, promo banners, leaderboards, scenes, jumbotron, activity feed, and show recap.
- Live Preflight checks for the local bridge, OBS source, Chrome extension, seller page, and real event path.
- Local automatic saving for creator preferences without saving demo data or OBS passwords.

## Download

Download these files from the Assets section below:

- Mac (Apple silicon): `DuckDesk-0.1.0-alpha.5-arm64.dmg`
- Windows (64-bit): `DuckDesk-0.1.0-alpha.5-windows-x64.exe`

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
