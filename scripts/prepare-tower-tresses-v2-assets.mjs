import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "design/game-themes-v2/source/tower-tresses-sprite-atlas-source.png");
const outputDir = path.join(root, "apps/overlay/public/game-themes-v2/tower-tresses");
const source = PNG.sync.read(fs.readFileSync(sourcePath));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const princessWindow = [
  [16, 11, 128, 198],
  [154, 11, 128, 198],
  [292, 11, 128, 215],
  [432, 11, 130, 215],
  [571, 11, 131, 198],
  [715, 11, 131, 198],
  [862, 11, 138, 194]
];

const princessCelebrate = [
  [573, 228, 121, 184],
  [710, 229, 113, 185],
  [849, 213, 158, 199]
];

const princeFrames = [
  [107, 666, 77, 191],
  [194, 669, 72, 183],
  [283, 673, 114, 182],
  [415, 653, 114, 202],
  [539, 641, 87, 214],
  [646, 641, 69, 211],
  [793, 641, 96, 216],
  [900, 641, 100, 216]
];

const birdFrames = [
  [8, 1205, 67, 82],
  [111, 1203, 62, 85],
  [178, 1204, 139, 96],
  [322, 1206, 122, 87],
  [450, 1212, 78, 89]
];

const combFrames = [
  [14, 1301, 83, 79],
  [102, 1302, 76, 87],
  [191, 1311, 67, 73]
];

writeSheet("princess-window.png", princessWindow, 144, 224, "bottom");
writeSheet("princess-celebrate.png", princessCelebrate, 160, 208, "bottom");
writeSheet("prince.png", princeFrames, 128, 224, "bottom");
writeSheet("bird.png", birdFrames, 160, 112, "center");
writeSheet("comb.png", combFrames, 96, 96, "center");

writeFixed("tower-roof.png", [5, 617, 91, 110], 128, 96, "top");
writeFixed("tower-wall-tile.png", [10, 880, 78, 48], 72, 48, "top");
writeFixed("courtyard-stone-tile.png", [8, 1089, 91, 99], 96, 96, "center");
writeFixed("courtyard-rail.png", [431, 1109, 135, 68], 136, 64, "bottom");
writeFixed("braid-root.png", [134, 432, 37, 56], 32, 48, "top");
writeFixed("braid-tassel.png", [925, 432, 64, 189], 64, 64, "bottom");
writeFixed("band-gem.png", [16, 18, 28, 24], 32, 32, "center");
writeFixed("pennant.png", [72, 617, 24, 42], 32, 48, "top");

const braidTile = extractBraidTile();
write("braid-tile.png", braidTile);

const manifest = {
  grid: 32,
  sheets: {
    "princess-window": { file: "princess-window.png", frameWidth: 144, frameHeight: 224, frames: princessWindow.length },
    "princess-celebrate": { file: "princess-celebrate.png", frameWidth: 160, frameHeight: 208, frames: princessCelebrate.length },
    prince: { file: "prince.png", frameWidth: 128, frameHeight: 224, frames: princeFrames.length },
    bird: { file: "bird.png", frameWidth: 160, frameHeight: 112, frames: birdFrames.length },
    comb: { file: "comb.png", frameWidth: 96, frameHeight: 96, frames: combFrames.length }
  },
  tiles: {
    "braid-root": { file: "braid-root.png", width: 32, height: 48 },
    "braid-tile": { file: "braid-tile.png", width: braidTile.width, height: braidTile.height },
    "braid-tassel": { file: "braid-tassel.png", width: 64, height: 64 },
    "tower-roof": { file: "tower-roof.png", width: 128, height: 96 },
    "tower-wall-tile": { file: "tower-wall-tile.png", width: 72, height: 48 },
    "courtyard-stone-tile": { file: "courtyard-stone-tile.png", width: 96, height: 96 }
  },
  anchors: {
    princess: { x: 72, y: 224 },
    prince: { x: 64, y: 224 },
    scalp: { x: 96, y: 200 }
  }
};

fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
verifyBraidJoin();
console.log(`sliced ${fs.readdirSync(outputDir).length} tower tresses v2 files`);

function writeSheet(name, rects, frameWidth, frameHeight, align) {
  const sheet = new PNG({ width: frameWidth * rects.length, height: frameHeight });
  rects.forEach((rect, index) => {
    blitAligned(cleanCrop(rect), sheet, index * frameWidth, 0, frameWidth, frameHeight, align);
  });
  write(name, sheet);
}

function writeFixed(name, rect, width, height, align) {
  const output = new PNG({ width, height });
  blitAligned(cleanCrop(rect), output, 0, 0, width, height, align);
  write(name, output);
}

function blitAligned(sprite, dest, destX, destY, frameWidth, frameHeight, align) {
  const trimmed = trimAlpha(sprite);
  const width = Math.min(trimmed.width, frameWidth);
  const height = Math.min(trimmed.height, frameHeight);
  const left = destX + Math.max(0, Math.floor((frameWidth - width) / 2));
  const top = destY + (align === "bottom"
    ? frameHeight - height
    : align === "top"
      ? 0
      : Math.max(0, Math.floor((frameHeight - height) / 2)));
  PNG.bitblt(trimmed, dest, 0, 0, width, height, left, top);
}

function cleanCrop([left, top, width, height]) {
  const cropLeft = Math.max(0, left);
  const cropTop = Math.max(0, top);
  const cropWidth = Math.min(width, source.width - cropLeft);
  const cropHeight = Math.min(height, source.height - cropTop);
  const output = new PNG({ width: cropWidth, height: cropHeight });
  PNG.bitblt(source, output, cropLeft, cropTop, cropWidth, cropHeight, 0, 0);
  for (let index = 0; index < output.data.length; index += 4) {
    const red = output.data[index];
    const green = output.data[index + 1];
    const blue = output.data[index + 2];
    const alpha = output.data[index + 3];
    if (alpha < 36 || (red < 16 && green < 16 && blue < 16)) {
      output.data[index + 3] = 0;
    }
  }
  return output;
}

function trimAlpha(input) {
  let minX = input.width;
  let minY = input.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      if (input.data[((y * input.width + x) * 4) + 3] === 0) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    return new PNG({ width: 1, height: 1 });
  }
  const output = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(input, output, minX, minY, output.width, output.height, 0, 0);
  return output;
}

function extractBraidTile() {
  const column = cleanCrop([136, 452, 33, 96]);
  const tile = new PNG({ width: 32, height: 32 });
  const srcY = Math.max(0, Math.floor((column.height - 32) / 3));
  PNG.bitblt(column, tile, 0, srcY, 32, 32, 0, 0);
  return tile;
}

function verifyBraidJoin() {
  const tile = PNG.sync.read(fs.readFileSync(path.join(outputDir, "braid-tile.png")));
  const root = PNG.sync.read(fs.readFileSync(path.join(outputDir, "braid-root.png")));
  const tassel = PNG.sync.read(fs.readFileSync(path.join(outputDir, "braid-tassel.png")));
  const joined = new PNG({ width: 64, height: root.height + (tile.height * 4) + tassel.height - 24 });
  blit(root, joined, 16, 0);
  let y = root.height - 8;
  for (let index = 0; index < 4; index += 1) {
    blit(tile, joined, 16, y);
    y += tile.height - 8;
  }
  blit(tassel, joined, 0, y);
  write("braid-join-proof.png", joined);
}

function blit(sprite, dest, x, y) {
  const width = Math.min(sprite.width, dest.width - x);
  const height = Math.min(sprite.height, dest.height - y);
  if (width <= 0 || height <= 0) {
    return;
  }
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const src = ((row * sprite.width) + col) * 4;
      if (sprite.data[src + 3] === 0) {
        continue;
      }
      const destIndex = (((y + row) * dest.width) + (x + col)) * 4;
      dest.data[destIndex] = sprite.data[src];
      dest.data[destIndex + 1] = sprite.data[src + 1];
      dest.data[destIndex + 2] = sprite.data[src + 2];
      dest.data[destIndex + 3] = sprite.data[src + 3];
    }
  }
}

function write(name, png) {
  fs.writeFileSync(path.join(outputDir, name), PNG.sync.write(png, { colorType: 6 }));
}
