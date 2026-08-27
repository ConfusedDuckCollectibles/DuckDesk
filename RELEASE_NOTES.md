# Duck Desk v0.1.0-alpha.6

Duck Desk alpha 6 adds the show-day tools that sit around a live overlay: a phone remote, rehearsal playback, Alert Studio, community look packs, and a production health check. Overlay alerts stay on the phone canvas, and the product camera stays clear.

## New In Alpha 6

- Added a **Remote Show Deck** for one-handed phone control of scenes, safety buttons, sounds, GIFs, show triggers, and live totals. Pair it from the desktop Remote tab with a QR code. The OBS overlay stays on this computer; the phone deck uses your private network and a new access code each launch.
- Added **Rehearsal** on Live → Preview and Live → Events. Play Quiet Show, Rapid Auction, Full Sale Moment, or Stress Test, record a session, then replay it. Rehearsal never pretends the Chrome extension or seller page is connected.
- Added **Alert Studio** in Library so you can place, size, and time bid, sale, tip, share, and audience alerts without leaving Duck Desk.
- Added community **`.duckpack`** looks. Import, apply, export, and undo from Library → Packs. Packs cannot run scripts or load files from outside the pack.
- Added a **Production Health** check and a redacted diagnostics export. Duck Desk can also check GitHub for a newer release. It does not download or install updates by itself, and it will not interrupt a live show.
- Kept the product camera clear: scene status and milestones sit under the LIVE header, the lot timer sits in the lower-right, and the hype meter is a thin bar under the header.
- Made **Show Recap** opt-in from Library → Add-Ons. Recap numbers come from what actually played on the overlay, including rehearsal.
- Kept alerts, GIFs, and recap cards inside the phone canvas instead of sliding off-screen.

## Highlights

- Native Mac and Windows desktop apps with no Terminal or PowerShell required after installation.
- One-click authenticated OBS source setup, repair, canvas fitting, and refresh.
- 56 included themes: 20 standard themes and 36 animated premium-style themes.
- Independent controls for the top banner and theme frame effects.
- GIF reactions with saved names, manual triggers, placement, and sizing.
- 10 audio themes plus custom bid, sale, tip, share, and audience sounds with a master mute control.
- Alert Studio, rehearsal playback, community packs, and a phone Remote Show Deck.
- Hype bursts, goals, milestones, timers, promo banners, leaderboards, scenes, jumbotron, activity feed, and an opt-in show recap.
- Live Preflight and Production Health checks for the local bridge, OBS source, Chrome extension, seller page, and real event path.
- Local automatic saving for creator preferences without saving demo data or OBS passwords.

## Download

Download these files from the Assets section below:

- Mac (Apple silicon): `DuckDesk-0.1.0-alpha.6-arm64.dmg`
- Windows (64-bit): `DuckDesk-0.1.0-alpha.6-windows-x64.exe`

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
- Duck Desk can check GitHub for a newer release. It does not download or install updates by itself.
- Duck Desk is not affiliated with or endorsed by Whatnot.

See the [customer setup guide](https://github.com/ConfusedDuckCollectibles/DuckDesk#get-on-stream) for complete OBS, phone-camera, Chrome extension, testing, and troubleshooting instructions.
