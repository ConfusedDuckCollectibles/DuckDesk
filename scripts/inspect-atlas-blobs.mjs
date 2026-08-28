import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const name = process.argv[2];
if (!name) {
  throw new Error("usage: node scripts/inspect-atlas-blobs.mjs <atlas-stem>");
}

const sourcePath = path.resolve("design/game-themes-v2/source", `${name}-sprite-atlas-source.png`);
const png = PNG.sync.read(fs.readFileSync(sourcePath));
const opaque = new Uint8Array(png.width * png.height);

for (let i = 0; i < png.width * png.height; i += 1) {
  const red = png.data[i * 4];
  const green = png.data[i * 4 + 1];
  const blue = png.data[i * 4 + 2];
  const alpha = png.data[i * 4 + 3];
  opaque[i] = alpha >= 36 && !(red < 16 && green < 16 && blue < 16) ? 1 : 0;
}

const seen = new Uint8Array(opaque.length);
const blobs = [];

for (let y = 0; y < png.height; y += 1) {
  for (let x = 0; x < png.width; x += 1) {
    const start = y * png.width + x;
    if (!opaque[start] || seen[start]) {
      continue;
    }
    const stack = [start];
    seen[start] = 1;
    let minX = x;
    let minY = y;
    let maxX = x;
    let maxY = y;
    let area = 0;
    while (stack.length > 0) {
      const index = stack.pop();
      const px = index % png.width;
      const py = Math.floor(index / png.width);
      area += 1;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
      const neighbors = [index - 1, index + 1, index - png.width, index + png.width];
      for (const next of neighbors) {
        if (next < 0 || next >= opaque.length || seen[next] || !opaque[next]) {
          continue;
        }
        const nx = next % png.width;
        const ny = Math.floor(next / png.width);
        if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) {
          continue;
        }
        seen[next] = 1;
        stack.push(next);
      }
    }
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    if (area < 80 || width < 8 || height < 8) {
      continue;
    }
    blobs.push({ x: minX, y: minY, w: width, h: height, area });
  }
}

blobs.sort((a, b) => a.y - b.y || a.x - b.x);
console.log(JSON.stringify({ file: name, count: blobs.length, blobs }, null, 2));
