import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";
import {
  GAME_ACTION_CLIP_MS,
  TOWER_LAYOUT,
  TOWER_TRESSES_CLIPS,
  UNINTERRUPTIBLE_GAME_ACTIONS,
  createGameAnimationState,
  enqueueGameAction,
  finishGameAction,
  journeyRatioForProgress,
  clipFrameIndex,
  princeRescueBox,
  reducedMotionHoldFrame,
  towerBraidFill,
  towerBraidHeight,
  towerBraidSegments,
  towerOccupancyViolations
} from "../packages/shared/dist/index.js";

const assetDir = path.resolve("apps/overlay/public/game-themes-v2/tower-tresses");
const artifactDir = path.resolve("artifacts/game-themes-v2");

test("each Tower action uses a distinct authored clip", () => {
  const signatures = Object.entries(TOWER_TRESSES_CLIPS).map(([action, clip]) => {
    assert.ok(clip.princessFrames.length >= 4, `${action} needs enough princess frames`);
    assert.equal(clip.durationMs, GAME_ACTION_CLIP_MS[action]);
    assert.ok(clip.holdFrame >= 0 && clip.holdFrame < clip.princessFrames.length);
    return `${clip.princessFrames.join(",")}|${clip.princeFrames.join(",")}|${clip.extra}`;
  });
  assert.equal(new Set(signatures).size, signatures.length);
});

test("character sheets keep a stable frame size and anchor", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(assetDir, "manifest.json"), "utf8"));
  assert.equal(manifest.sheets["princess-window"].frameWidth, 144);
  assert.equal(manifest.sheets["princess-window"].frameHeight, 224);
  assert.equal(manifest.sheets.prince.frameWidth, 128);
  assert.equal(manifest.sheets.prince.frameHeight, 224);
  assert.deepEqual(manifest.anchors.princess, { x: 72, y: 224 });
  assert.deepEqual(manifest.anchors.prince, { x: 64, y: 224 });
  const princess = PNG.sync.read(fs.readFileSync(path.join(assetDir, "princess-window.png")));
  const prince = PNG.sync.read(fs.readFileSync(path.join(assetDir, "prince.png")));
  assert.equal(princess.width, 144 * 7);
  assert.equal(princess.height, 224);
  assert.equal(prince.width, 128 * 8);
  assert.equal(prince.height, 224);
});

test("braid root, tiles, and tassel stay adjacent at key progress values", () => {
  for (const ratio of [0, 0.01, 0.25, 0.5, 0.75, 1]) {
    const segments = towerBraidSegments(ratio);
    assert.ok(segments.length >= 3);
    for (let index = 1; index < segments.length; index += 1) {
      const previous = segments[index - 1];
      const current = segments[index];
      const overlap = previous.y + previous.height - current.y;
      assert.ok(overlap >= 0, `gap at ${ratio} between ${previous.id} and ${current.id}`);
      assert.ok(Math.abs(previous.x - current.x) <= 16);
    }
    const tassel = segments.at(-1);
    assert.ok(tassel.y + tassel.height <= TOWER_LAYOUT.braid.courtyardY + 1);
  }
  const proof = PNG.sync.read(fs.readFileSync(path.join(assetDir, "braid-join-proof.png")));
  let opaqueJoins = 0;
  for (let y = 1; y < proof.height; y += 1) {
    for (let x = 0; x < proof.width; x += 1) {
      const current = proof.data[(((y * proof.width) + x) * 4) + 3];
      const previous = proof.data[((((y - 1) * proof.width) + x) * 4) + 3];
      if (current > 0 && previous > 0) {
        opaqueJoins += 1;
        break;
      }
    }
  }
  assert.ok(opaqueJoins > 40, "braid join proof should have many adjacent opaque rows");
});

test("persistent Tower geometry stays out of the product center and footer", () => {
  for (const ratio of [0, 0.01, 0.25, 0.5, 0.75, 1]) {
    const violations = towerOccupancyViolations(ratio);
    assert.deepEqual(violations, [], `occupancy violations at ${ratio}: ${violations.map((rect) => rect.id).join(", ")}`);
  }
  assert.ok(TOWER_LAYOUT.hud.y + TOWER_LAYOUT.hud.height <= TOWER_LAYOUT.footer.y);
  assert.ok(TOWER_LAYOUT.courtyard.y + TOWER_LAYOUT.courtyard.height <= TOWER_LAYOUT.footer.y);
  assert.ok(TOWER_LAYOUT.leftRail.width <= 150);
  assert.ok(TOWER_LAYOUT.rightRail.x >= 930);
});

test("rapid bids coalesce and locked clips are never dropped", () => {
  let state = createGameAnimationState();
  state = enqueueGameAction(state, "bid", 1);
  state = enqueueGameAction(state, "bid", 2);
  state = enqueueGameAction(state, "bid", 3);
  assert.equal(state.active?.action, "bid");
  assert.equal(state.active?.intensity, 3);
  assert.equal(state.queue.length, 0);

  state = enqueueGameAction(state, "sale", 4);
  assert.equal(state.active?.action, "sale");
  state = enqueueGameAction(state, "tip", 5);
  state = enqueueGameAction(state, "win", 6);
  state = enqueueGameAction(state, "share", 7);
  assert.equal(state.active?.action, "sale");
  assert.deepEqual(state.queue.map((command) => command.action), ["tip", "win", "share"]);
  for (const action of UNINTERRUPTIBLE_GAME_ACTIONS) {
    assert.ok(["sale", "tip", "win"].includes(action) || action === "level_up");
  }
  state = finishGameAction(state, 8);
  assert.equal(state.active?.action, "tip");
  state = finishGameAction(state, 9);
  assert.equal(state.active?.action, "win");
});

test("reduced motion holds a semantic frame for every action", () => {
  for (const [action, clip] of Object.entries(TOWER_TRESSES_CLIPS)) {
    const hold = reducedMotionHoldFrame(action);
    assert.equal(hold, clip.holdFrame);
    assert.equal(clip.princessFrames[hold], clip.princessFrames[clip.holdFrame]);
  }
});

test("the prince climbs the braid during a rescue", () => {
  const start = princeRescueBox(0);
  const mid = princeRescueBox(0.35);
  const top = princeRescueBox(1);
  assert.ok(mid.y < start.y);
  assert.ok(top.y < mid.y);
  assert.ok(top.y <= TOWER_LAYOUT.princess.y + 20);
  assert.ok(start.x + start.width <= TOWER_LAYOUT.protectedCenter.x);
  assert.ok(top.x + top.width <= TOWER_LAYOUT.protectedCenter.x);
});

test("clip frames advance from elapsed time", () => {
  assert.equal(clipFrameIndex(0, 8, 4000, false), 0);
  assert.ok(clipFrameIndex(2000, 8, 4000, false) >= 3);
  assert.equal(clipFrameIndex(4000, 8, 4000, false), 7);
  assert.notEqual(clipFrameIndex(0, 6, 1200, true), clipFrameIndex(400, 6, 1200, true));
});

test("a bid adds a visible braid segment on the current level", () => {
  const empty = towerBraidHeight(towerBraidFill(0, 19));
  const afterBid = towerBraidHeight(towerBraidFill(2, 19));
  const complete = towerBraidHeight(towerBraidFill(18, 19));
  const rescue = towerBraidHeight(towerBraidFill(0, 34, "level_up"));
  const nextLevel = towerBraidHeight(towerBraidFill(0, 34));
  assert.equal(empty, towerBraidHeight(0));
  assert.ok(afterBid - empty >= 16, "first bid must add at least one braid step");
  assert.ok(complete > afterBid, "more progress must grow the braid farther");
  assert.equal(rescue, towerBraidHeight(1));
  assert.equal(nextLevel, empty, "the next level resets the braid");
  assert.ok(towerBraidSegments(towerBraidFill(2, 19)).length > towerBraidSegments(0).length);
});

test("100-level journey stays available for band markers", () => {
  assert.equal(journeyRatioForProgress(1, 0, 19), 0);
  assert.ok(journeyRatioForProgress(1, 19, 19) > 0);
  assert.equal(journeyRatioForProgress(100, 6109, 6109), 1);
  assert.ok(journeyRatioForProgress(50, 0, 100) > 0.4);
});

test("1080x1920 and 540x960 occupancy screenshots keep the center clear", () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const full = renderOccupancy(1);
  const compact = scaleNearest(full, 540, 960);
  fs.writeFileSync(path.join(artifactDir, "tower-v2-1080x1920.png"), PNG.sync.write(full, { colorType: 6 }));
  fs.writeFileSync(path.join(artifactDir, "tower-v2-540x960.png"), PNG.sync.write(compact, { colorType: 6 }));
  const protectedCenter = TOWER_LAYOUT.protectedCenter;
  let centerHits = 0;
  for (let y = protectedCenter.y; y < protectedCenter.y + protectedCenter.height; y += 1) {
    for (let x = protectedCenter.x; x < protectedCenter.x + protectedCenter.width; x += 1) {
      if (full.data[(((y * full.width) + x) * 4) + 3] > 0) {
        centerHits += 1;
      }
    }
  }
  assert.equal(centerHits, 0);
});

function renderOccupancy(journeyRatio) {
  const canvas = new PNG({ width: 1080, height: 1920 });
  const wall = readPng("tower-wall-tile.png");
  const roof = readPng("tower-roof.png");
  const princess = readPng("princess-window.png");
  const prince = readPng("prince.png");
  const root = readPng("braid-root.png");
  const tile = readPng("braid-tile.png");
  const tassel = readPng("braid-tassel.png");
  const stone = readPng("courtyard-stone-tile.png");
  tileRect(canvas, TOWER_LAYOUT.wall, wall);
  blitScaled(roof, canvas, TOWER_LAYOUT.roof);
  blitFrame(princess, canvas, TOWER_LAYOUT.princess, 0, 7);
  for (const segment of towerBraidSegments(journeyRatio)) {
    const sprite = segment.id === "braid-root" ? root : segment.id === "braid-tassel" ? tassel : tile;
    blitScaled(sprite, canvas, segment);
  }
  tileRect(canvas, TOWER_LAYOUT.courtyard, stone);
  blitFrame(prince, canvas, TOWER_LAYOUT.prince, 0, 8);
  fillRect(canvas, TOWER_LAYOUT.hud, [17, 21, 44, 255]);
  fillRect(canvas, TOWER_LAYOUT.goal, [17, 21, 44, 255]);
  return canvas;
}

function readPng(name) {
  return PNG.sync.read(fs.readFileSync(path.join(assetDir, name)));
}

function tileRect(dest, rect, tile) {
  for (let y = rect.y; y < rect.y + rect.height; y += tile.height) {
    for (let x = rect.x; x < rect.x + rect.width; x += tile.width) {
      blitScaled(tile, dest, {
        x,
        y,
        width: Math.min(tile.width, rect.x + rect.width - x),
        height: Math.min(tile.height, rect.y + rect.height - y)
      });
    }
  }
}

function blitFrame(sheet, dest, rect, frame, frames) {
  const frameWidth = sheet.width / frames;
  const source = new PNG({ width: frameWidth, height: sheet.height });
  PNG.bitblt(sheet, source, frame * frameWidth, 0, frameWidth, sheet.height, 0, 0);
  blitScaled(source, dest, rect);
}

function blitScaled(sprite, dest, rect) {
  for (let y = 0; y < rect.height; y += 1) {
    const srcY = Math.min(sprite.height - 1, Math.floor((y * sprite.height) / rect.height));
    for (let x = 0; x < rect.width; x += 1) {
      const destX = rect.x + x;
      const destY = rect.y + y;
      if (destX < 0 || destY < 0 || destX >= dest.width || destY >= dest.height) {
        continue;
      }
      const srcX = Math.min(sprite.width - 1, Math.floor((x * sprite.width) / rect.width));
      const src = ((srcY * sprite.width) + srcX) * 4;
      if (sprite.data[src + 3] === 0) {
        continue;
      }
      const destIndex = ((destY * dest.width) + destX) * 4;
      dest.data[destIndex] = sprite.data[src];
      dest.data[destIndex + 1] = sprite.data[src + 1];
      dest.data[destIndex + 2] = sprite.data[src + 2];
      dest.data[destIndex + 3] = sprite.data[src + 3];
    }
  }
}

function fillRect(dest, rect, rgba) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const destIndex = ((y * dest.width) + x) * 4;
      dest.data.set(rgba, destIndex);
    }
  }
}

function scaleNearest(source, width, height) {
  const output = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    const srcY = Math.floor((y * source.height) / height);
    for (let x = 0; x < width; x += 1) {
      const srcX = Math.floor((x * source.width) / width);
      const src = ((srcY * source.width) + srcX) * 4;
      const dest = ((y * width) + x) * 4;
      output.data[dest] = source.data[src];
      output.data[dest + 1] = source.data[src + 1];
      output.data[dest + 2] = source.data[src + 2];
      output.data[dest + 3] = source.data[src + 3];
    }
  }
  return output;
}
