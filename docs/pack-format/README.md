# Duck Desk community packs

A `.duckpack` file is a ZIP of data only. It can change the show look and bundle
media. It cannot run JavaScript, load CSS, or ship HTML.

## Folder layout

```text
my-show-pack/
  manifest.json
  preview.png
  assets/
    sale.wav
    cheer.gif
```

Zip that folder (not an extra parent folder) and rename the zip to
`my-show-pack.duckpack`.

## What you can include

- A name, author, version like `1.0.0`, description, and an allowed license:
  MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, CC-BY-4.0,
  CC-BY-SA-4.0, or Unlicense.
- Optional `https` project URL.
- `preview.png`, `preview.jpg`, or `preview.webp`.
- Theme `neon`, `arena`, or `duck`, plus any built-in Duck Desk skin.
- Frame preset `theme`, `broadcast`, or `none`.
- Typography `theme`, `modern`, `condensed`, or `editorial`.
- Alert Studio settings, promo banners, goals, and a starting scene.
- WAV, MP3, or M4A replacements for sale, bid, action, tip, or share.
- PNG, JPEG, GIF, or WebP images for the GIF library.

Every file listed under `assets` must include a SHA-256 hash. Duck Desk checks
the hash and the real file signature, not just the extension.

## Limits

- 25 MB compressed, 75 MB extracted, 100 files, 20 MB per file.
- No `..` paths, absolute paths, symlinks, or encrypted zip entries.

## Validate

From the Duck Desk repo:

```sh
npm run duckpack -- validate docs/pack-format/example
npm run duckpack -- validate path/to/my-show-pack.duckpack
```

See `docs/pack-format/example/` for a first-party reference pack.
