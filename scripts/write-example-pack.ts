import fs from "node:fs";
import path from "node:path";
import { assemblePackFiles, PACK_PREVIEW_FALLBACK_PNG } from "../apps/desktop/src/packs.ts";
import type { PackManifest } from "../apps/desktop/src/packs.ts";

const projectUrl = "https://github.com/ConfusedDuckCollectibles/DuckDesk";
const packs: Array<{ directory: string; identity: Omit<PackManifest, "version" | "format" | "assets"> }> = [
  {
    directory: "docs/pack-format/example",
    identity: {
      name: "Night Market",
      author: "Duck Desk",
      packVersion: "1.0.0",
      description: "Neon cyber market look with a broadcast frame and a starting scene.",
      license: "MIT",
      projectUrl,
      preview: "preview.png",
      setup: {
        theme: "neon",
        skin: "cyber_market",
        framePreset: "broadcast",
        typographyPreset: "modern",
        sceneMode: "starting",
        promoBanners: ["Duck Desk Night Market", "Follow for the next drop"]
      }
    }
  },
  {
    directory: "docs/pack-format/floor-open",
    identity: {
      name: "Floor Open",
      author: "Duck Desk",
      packVersion: "1.0.0",
      description: "Auction-floor look for live bidding: sports desk skin, auction scene, and bid-forward banners.",
      license: "MIT",
      projectUrl,
      preview: "preview.png",
      setup: {
        theme: "arena",
        skin: "sports_desk",
        framePreset: "broadcast",
        typographyPreset: "condensed",
        sceneMode: "auction",
        promoBanners: ["Bids are open", "Call your number"],
        goals: [{ kind: "sales", target: 500, label: "Floor goal" }]
      }
    }
  },
  {
    directory: "docs/pack-format/quiet-close",
    identity: {
      name: "Quiet Close",
      author: "Duck Desk",
      packVersion: "1.0.0",
      description: "Low-motion wrap-up look. Luxury black skin, ending scene, and calmer banners.",
      license: "MIT",
      projectUrl,
      preview: "preview.png",
      setup: {
        theme: "duck",
        skin: "luxury_black",
        framePreset: "theme",
        typographyPreset: "editorial",
        reducedMotion: true,
        sceneMode: "ending",
        promoBanners: ["Thanks for watching", "See you next show"]
      }
    }
  }
];

for (const pack of packs) {
  const directory = path.resolve(pack.directory);
  fs.mkdirSync(directory, { recursive: true });
  const assembled = assemblePackFiles(pack.identity, [
    { path: "preview.png", data: PACK_PREVIEW_FALLBACK_PNG, kind: "image" }
  ]);
  for (const file of assembled.files) {
    const destination = path.join(directory, ...file.name.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file.data);
  }
  console.log(`Wrote ${assembled.manifest.name} to ${directory}`);
}
