import assert from "node:assert/strict";
import test from "node:test";
import {
  CRYSTAL_CLIPS,
  GARDEN_CLIPS,
  GAME_EDGE,
  GAME_THEME_IDS,
  RACE_CLIPS,
  RACE_PATH,
  STARSHIP_CLIPS,
  STARSHIP_PATH,
  advanceGameTheme,
  createGameThemeProgress,
  crystalPersistentRects,
  edgeOccupancyViolations,
  gardenPersistentRects,
  gameLevelCount,
  gameTargetForLevel,
  lanePoint,
  plantFrame,
  racePersistentRects,
  starshipPersistentRects
} from "../packages/shared/dist/index.js";

test("all five games have 100 strictly harder levels and an easy first round", () => {
  for (const theme of GAME_THEME_IDS) {
    assert.equal(gameLevelCount(theme), 100, theme);
    assert.equal(gameTargetForLevel(theme, 1), 2, theme);
    let previous = gameTargetForLevel(theme, 1);
    for (let level = 2; level <= 100; level += 1) {
      const target = gameTargetForLevel(theme, level);
      assert.ok(target > previous, `${theme} ${level}`);
      previous = target;
    }
    assert.ok(gameTargetForLevel(theme, 100) > 1000, theme);
    const first = advanceGameTheme(createGameThemeProgress(theme), { type: "bid" });
    assert.equal(first.celebration, "level_up", theme);
    assert.equal(first.level, 2, theme);
  }
});

test("Starship and Neon keep the destination on the travel lane", () => {
  for (const point of STARSHIP_PATH) {
    assert.equal(point.y, STARSHIP_PATH[0].y);
  }
  for (const point of RACE_PATH) {
    assert.equal(point.y, RACE_PATH[0].y);
  }
  assert.ok(STARSHIP_PATH.at(-1).x > STARSHIP_PATH[0].x);
  assert.ok(RACE_PATH.at(-1).x > RACE_PATH[0].x);
  assert.ok(STARSHIP_PATH[0].y >= GAME_EDGE.bottomDeck.y);
  assert.ok(RACE_PATH[0].y >= GAME_EDGE.bottomDeck.y);
  const beacon = starshipPersistentRects(1).find((rect) => rect.id === "beacon");
  const finish = racePersistentRects(1).find((rect) => rect.id === "finish");
  assert.ok(Math.abs(beacon.y - STARSHIP_PATH[0].y) <= 16);
  assert.ok(finish.y + finish.height >= RACE_PATH[0].y);
  assert.ok(finish.y <= RACE_PATH[0].y);
});

test("Moon Garden uses every plant stage and finishes tall", () => {
  for (let index = 0; index < 6; index += 1) {
    assert.equal(plantFrame(1, index, 6), 5, `plant ${index} should bloom`);
  }
  assert.equal(plantFrame(0, 0, 6), 0);
  assert.ok(plantFrame(0.2, 0, 6) >= 1);
  assert.equal(plantFrame(0.2, 5, 6), 0);
  const plant = gardenPersistentRects().find((rect) => rect.id === "plant-5");
  assert.ok(plant.height >= 220);
});

test("the four new V2 worlds keep authored clips, a thin HUD, and an open center", () => {
  assert.equal(GAME_EDGE.hud.y, 1688);
  assert.equal(GAME_EDGE.hud.height, 56);
  assert.ok(GAME_EDGE.hud.y + GAME_EDGE.hud.height <= GAME_EDGE.footer.y);

  for (const [name, clips] of Object.entries({ STARSHIP_CLIPS, GARDEN_CLIPS, CRYSTAL_CLIPS, RACE_CLIPS })) {
    const signatures = Object.values(clips).map((clip) => `${clip.heroFrames.join(",")}|${clip.extra}`);
    assert.equal(new Set(signatures).size, signatures.length, name);
  }

  for (const fill of [0, 0.25, 0.5, 0.75, 1]) {
    assert.deepEqual(edgeOccupancyViolations(starshipPersistentRects(fill)), [], `starship ${fill}`);
    assert.deepEqual(edgeOccupancyViolations(crystalPersistentRects(fill)), [], `crystal ${fill}`);
    assert.deepEqual(edgeOccupancyViolations(racePersistentRects(fill)), [], `race ${fill}`);
    const ship = { id: `ship-${fill}`, ...lanePoint(fill, STARSHIP_PATH), width: 120, height: 64 };
    const car = { id: `car-${fill}`, ...lanePoint(fill, RACE_PATH), width: 128, height: 56 };
    assert.deepEqual(edgeOccupancyViolations([ship]), [], `ship path ${fill}`);
    assert.deepEqual(edgeOccupancyViolations([car]), [], `car path ${fill}`);
  }
  assert.deepEqual(edgeOccupancyViolations(gardenPersistentRects(), [GAME_EDGE.plantBed]), []);
});
