import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "design/game-themes-v2/source");
const publicDir = path.join(root, "apps/overlay/public/game-themes-v2");

prepare("starship-rally", (blobs) => {
  const pilots = band(blobs, 16, 40, 2400).slice(0, 8);
  const ships = band(blobs, 205, 230, 5000).slice(0, 6);
  const portals = band(blobs, 400, 430, 3000).slice(0, 5);
  const fuels = band(blobs, 520, 560, 700).slice(0, 6);
  const sats = band(blobs, 945, 980, 2000).slice(0, 5);
  const planet = pick(blobs, 680, 1220, 300);
  const gate = pick(blobs, 360, 210, 160);
  const station = pick(blobs, 10, 1170, 250);
  writeSheet("pilot.png", pilots, 96, 128, "bottom");
  writeSheet("ship.png", ships, 176, 96, "center");
  writeSheet("portal.png", portals, 80, 128, "center");
  writeSheet("fuel.png", fuels, 56, 80, "bottom");
  writeSheet("satellite.png", sats, 64, 96, "center");
  writeFixed("planet.png", planet, 160, 160, "center");
  writeFixed("gate.png", gate, 176, 96, "center");
  writeFixed("station.png", station, 160, 128, "bottom");
  return {
    sheets: {
      pilot: { file: "pilot.png", frameWidth: 96, frameHeight: 128, frames: pilots.length },
      ship: { file: "ship.png", frameWidth: 176, frameHeight: 96, frames: ships.length },
      portal: { file: "portal.png", frameWidth: 80, frameHeight: 128, frames: portals.length },
      fuel: { file: "fuel.png", frameWidth: 56, frameHeight: 80, frames: fuels.length },
      satellite: { file: "satellite.png", frameWidth: 64, frameHeight: 96, frames: sats.length }
    }
  };
});

prepare("moon-garden", (blobs) => {
  const gardeners = band(blobs, 8, 70, 6000).slice(0, 8);
  const fireflies = band(blobs, 345, 400, 900).slice(0, 6);
  const plants = [...band(blobs, 540, 760, 1400).slice(0, 6), ...band(blobs, 790, 920, 1800).slice(0, 2)];
  const planter = pick(blobs, 240, 970, 400);
  const vine = pick(blobs, 10, 1090, 80);
  const arch = pick(blobs, 530, 1110, 350);
  const moonFlower = pick(blobs, 880, 0, 120);
  writeSheet("gardener.png", gardeners, 128, 176, "bottom");
  writeSheet("firefly.png", fireflies, 80, 96, "center");
  writeSheet("plant.png", plants.slice(0, 6), 128, 240, "bottom");
  writeFixed("planter.png", planter, 256, 80, "bottom");
  writeFixed("vine.png", vine, 96, 320, "top");
  writeFixed("arch.png", arch, 256, 160, "top");
  writeFixed("moon-flower.png", moonFlower, 144, 192, "bottom");
  return {
    sheets: {
      gardener: { file: "gardener.png", frameWidth: 128, frameHeight: 176, frames: Math.min(8, gardeners.length) },
      firefly: { file: "firefly.png", frameWidth: 80, frameHeight: 96, frames: Math.min(6, fireflies.length) },
      plant: { file: "plant.png", frameWidth: 128, frameHeight: 240, frames: Math.min(6, plants.length) }
    }
  };
});

prepare("crystal-quest", (blobs) => {
  const explorers = band(blobs, 40, 60, 2800).slice(0, 8);
  const swings = band(blobs, 150, 190, 2800).slice(0, 6);
  const minecarts = band(blobs, 770, 790, 12000).slice(0, 4);
  const chamberDoors = band(blobs, 1245, 1265, 3000).slice(0, 4);
  const bats = band(blobs, 1005, 1045, 600).slice(0, 5);
  const gems = band(blobs, 1100, 1140, 900).slice(0, 5);
  const wall = pick(blobs, 10, 560, 80);
  const track = band(blobs, 400, 420, 900)[0];
  writeSheet("explorer.png", explorers, 96, 128, "bottom");
  writeSheet("swing.png", swings, 96, 128, "bottom");
  writeSheet("cart.png", minecarts, 160, 144, "bottom");
  writeSheet("door.png", chamberDoors, 160, 112, "bottom");
  writeSheet("bat.png", bats, 48, 64, "center");
  writeSheet("gem.png", gems, 64, 64, "center");
  writeFixed("cave-wall.png", wall, 96, 208, "top");
  writeFixed("track.png", track, 48, 48, "center");
  return {
    sheets: {
      explorer: { file: "explorer.png", frameWidth: 96, frameHeight: 128, frames: explorers.length },
      swing: { file: "swing.png", frameWidth: 96, frameHeight: 128, frames: swings.length },
      cart: { file: "cart.png", frameWidth: 160, frameHeight: 144, frames: minecarts.length },
      door: { file: "door.png", frameWidth: 160, frameHeight: 112, frames: chamberDoors.length },
      bat: { file: "bat.png", frameWidth: 48, frameHeight: 64, frames: bats.length },
      gem: { file: "gem.png", frameWidth: 64, frameHeight: 64, frames: gems.length }
    }
  };
});

prepare("neon-grand-prix", (blobs) => {
  const cars = band(blobs, 20, 40, 3500).slice(0, 7);
  const boosts = band(blobs, 95, 120, 3700).slice(0, 6);
  const crew = band(blobs, 300, 335, 5000).slice(0, 4);
  const drones = band(blobs, 820, 840, 1400).slice(0, 4);
  const podium = pick(blobs, 444, 1246, 200);
  const driver = pick(blobs, 20, 1180, 120);
  const finish = pick(blobs, 840, 520, 140);
  const road = pick(blobs, 20, 1455, 250);
  writeSheet("car.png", cars, 144, 64, "center");
  writeSheet("boost.png", boosts, 160, 80, "center");
  writeSheet("crew.png", crew, 96, 128, "bottom");
  writeSheet("drone.png", drones, 80, 80, "center");
  writeFixed("podium.png", podium, 160, 176, "bottom");
  writeFixed("driver.png", driver, 144, 192, "bottom");
  writeFixed("finish.png", finish, 176, 112, "center");
  writeFixed("road.png", road, 256, 64, "center");
  return {
    sheets: {
      car: { file: "car.png", frameWidth: 144, frameHeight: 64, frames: cars.length },
      boost: { file: "boost.png", frameWidth: 160, frameHeight: 80, frames: boosts.length },
      crew: { file: "crew.png", frameWidth: 96, frameHeight: 128, frames: crew.length },
      drone: { file: "drone.png", frameWidth: 80, frameHeight: 80, frames: drones.length }
    }
  };
});

function prepare(name, build) {
  const sourcePath = path.join(sourceDir, `${name}-sprite-atlas-source.png`);
  globalThis.__atlas = PNG.sync.read(fs.readFileSync(sourcePath));
  globalThis.__out = path.join(publicDir, name);
  fs.rmSync(globalThis.__out, { recursive: true, force: true });
  fs.mkdirSync(globalThis.__out, { recursive: true });
  const blobs = detectBlobs(globalThis.__atlas);
  const sheets = build(blobs);
  const manifest = { grid: 32, ...sheets };
  fs.writeFileSync(path.join(globalThis.__out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`sliced ${name}: ${fs.readdirSync(globalThis.__out).length} files`);
}

function detectBlobs(png) {
  const opaque = new Uint8Array(png.width * png.height);
  for (let i = 0; i < opaque.length; i += 1) {
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
        for (const next of [index - 1, index + 1, index - png.width, index + png.width]) {
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
      blobs.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
    }
  }
  return blobs.filter((blob) => blob.area >= 80).sort((a, b) => a.y - b.y || a.x - b.x);
}

function band(blobs, y0, y1, minArea) {
  return blobs.filter((blob) => blob.y >= y0 && blob.y <= y1 && blob.area >= minArea).sort((a, b) => a.x - b.x);
}

function pick(blobs, x, y, minSize) {
  return blobs
    .filter((blob) => blob.w >= minSize || blob.h >= minSize)
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
}

function writeSheet(name, rects, frameWidth, frameHeight, align) {
  const sheet = new PNG({ width: frameWidth * Math.max(1, rects.length), height: frameHeight });
  rects.forEach((rect, index) => {
    blitAligned(cleanCrop(rect), sheet, index * frameWidth, 0, frameWidth, frameHeight, align);
  });
  write(name, sheet);
}

function writeFixed(name, rect, width, height, align) {
  const output = new PNG({ width, height });
  if (rect) {
    blitAligned(cleanCrop(rect), output, 0, 0, width, height, align);
  }
  write(name, output);
}

function blitAligned(sprite, dest, destX, destY, frameWidth, frameHeight, align) {
  const trimmed = trimAlpha(sprite);
  const width = Math.min(trimmed.width, frameWidth);
  const height = Math.min(trimmed.height, frameHeight);
  const left = destX + Math.max(0, Math.floor((frameWidth - width) / 2));
  const top = destY + (align === "bottom" ? frameHeight - height : align === "top" ? 0 : Math.max(0, Math.floor((frameHeight - height) / 2)));
  PNG.bitblt(trimmed, dest, 0, 0, width, height, left, top);
}

function cleanCrop(rect) {
  const source = globalThis.__atlas;
  const left = Math.max(0, rect.x);
  const top = Math.max(0, rect.y);
  const width = Math.min(rect.w, source.width - left);
  const height = Math.min(rect.h, source.height - top);
  const output = new PNG({ width, height });
  PNG.bitblt(source, output, left, top, width, height, 0, 0);
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
  if (maxX < minX) {
    return new PNG({ width: 1, height: 1 });
  }
  const output = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(input, output, minX, minY, output.width, output.height, 0, 0);
  return output;
}

function write(name, png) {
  fs.writeFileSync(path.join(globalThis.__out, name), PNG.sync.write(png, { colorType: 6 }));
}
