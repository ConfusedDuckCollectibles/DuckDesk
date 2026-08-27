import fs from "node:fs";
import path from "node:path";
import { assemblePackFiles, PACK_PREVIEW_FALLBACK_PNG } from "../apps/desktop/src/packs.ts";

const directory = path.resolve("docs/pack-format/example");
fs.mkdirSync(directory, { recursive: true });
const assembled = assemblePackFiles({
  name: "Night Market",
  author: "Duck Desk",
  packVersion: "1.0.0",
  description: "First-party reference pack: neon theme, cyber market skin, broadcast frame, and a starting scene.",
  license: "MIT",
  projectUrl: "https://github.com/ConfusedDuckCollectibles/DuckDesk",
  preview: "preview.png",
  setup: {
    theme: "neon",
    skin: "cyber_market",
    framePreset: "broadcast",
    typographyPreset: "modern",
    sceneMode: "starting",
    promoBanners: ["Duck Desk Night Market", "Follow for the next drop"]
  }
}, [
  { path: "preview.png", data: PACK_PREVIEW_FALLBACK_PNG, kind: "image" }
]);

for (const file of assembled.files) {
  const destination = path.join(directory, ...file.name.split("/"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, file.data);
}

console.log(`Wrote ${assembled.manifest.name} to ${directory}`);
