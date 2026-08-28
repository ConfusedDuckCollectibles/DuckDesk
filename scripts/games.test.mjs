import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_THEME_DEFINITIONS,
  GAME_ACTION_CLIP_MS,
  advanceGameTheme,
  celebrationActiveUntil,
  createGameThemeProgress,
  gameLevelCount,
  gameTargetForLevel,
  isGameThemeProgressPayload,
  normalizeGameProgressMap,
  pointsForGameEvent
} from "../packages/shared/dist/index.js";

test("audience game actions use the published weights", () => {
  assert.equal(pointsForGameEvent({ type: "bid" }), 2);
  assert.equal(pointsForGameEvent({ type: "sale" }), 10);
  assert.equal(pointsForGameEvent({ type: "tip" }), 10);
  assert.equal(pointsForGameEvent({ type: "share", delta: 1 }), 1);
  assert.equal(pointsForGameEvent({ type: "share", delta: 99 }), 5);
  assert.equal(pointsForGameEvent({ type: "audience_action", action: "follow" }), 2);
  assert.equal(pointsForGameEvent({ type: "audience_action", action: "reaction" }), 1);
});

test("progress carries into the next, harder level", () => {
  const target = gameTargetForLevel("game_tower_tresses", 1);
  const current = {
    ...createGameThemeProgress("game_tower_tresses"),
    progress: target - 2
  };
  const next = advanceGameTheme(current, { type: "sale" }, 1234);
  assert.equal(next.level, 2);
  assert.equal(next.progress, 8);
  assert.equal(next.target, gameTargetForLevel("game_tower_tresses", 2));
  assert.equal(next.lastAction, "sale");
  assert.equal(next.celebration, "level_up");
  assert.equal(next.celebrationAt, 1234);
});

test("Tower Tresses has 100 strictly harder levels", () => {
  assert.equal(gameLevelCount("game_tower_tresses"), 100);
  const targets = GAME_THEME_DEFINITIONS.game_tower_tresses.targets;
  for (let index = 1; index < targets.length; index += 1) {
    assert.ok(targets[index] > targets[index - 1]);
  }
  assert.equal(gameTargetForLevel("game_tower_tresses", 1), 2);
  assert.ok(gameTargetForLevel("game_tower_tresses", 2) >= 8);
  assert.ok(gameTargetForLevel("game_tower_tresses", 2) <= 14);
  assert.ok(gameTargetForLevel("game_tower_tresses", 100) > 1000);
});

test("one bid completes the first Tower Tresses level", () => {
  const next = advanceGameTheme(createGameThemeProgress("game_tower_tresses"), { type: "bid" });
  assert.equal(next.celebration, "level_up");
  assert.equal(next.level, 2);
  assert.equal(next.progress, 0);
  assert.equal(next.lastAction, "bid");
});

test("one sale completes only the current Tower Tresses level", () => {
  const next = advanceGameTheme(createGameThemeProgress("game_tower_tresses"), { type: "sale" });
  assert.equal(next.celebration, "level_up");
  assert.equal(next.level, 2);
  assert.equal(next.progress, 8);
  assert.equal(next.lastAction, "sale");
  assert.ok(next.progress < next.target);
});

test("Tower Tresses resets older saves onto the easy first tower", () => {
  const normalized = normalizeGameProgressMap({
    game_tower_tresses: {
      schemaVersion: 2,
      level: 41,
      progress: 24,
      target: 48,
      totalPoints: 200,
      wins: 1,
      lastGain: 2,
      revision: 8,
      celebration: "none"
    }
  });
  const tower = normalized.game_tower_tresses;
  assert.equal(tower.schemaVersion, 3);
  assert.equal(tower.level, 1);
  assert.equal(tower.progress, 0);
  assert.equal(tower.target, 2);
  assert.equal(tower.totalPoints, 200);
  assert.equal(tower.wins, 1);
});

test("Tower Tresses level 100 completion records a win", () => {
  const target = gameTargetForLevel("game_tower_tresses", 100);
  const current = {
    ...createGameThemeProgress("game_tower_tresses"),
    level: 100,
    progress: target - 2,
    target,
    wins: 4
  };
  const next = advanceGameTheme(current, { type: "bid" }, 9876);
  assert.equal(next.level, 1);
  assert.equal(next.progress, 0);
  assert.equal(next.wins, 5);
  assert.equal(next.lastAction, "bid");
  assert.equal(next.celebration, "win");
});

test("finishing the last Neon lap records a win and starts a fresh run", () => {
  const target = gameTargetForLevel("game_neon_grand_prix", 100);
  const current = {
    ...createGameThemeProgress("game_neon_grand_prix"),
    level: 100,
    progress: target - 5,
    target,
    wins: 2
  };
  const next = advanceGameTheme(current, { type: "tip" }, 5678);
  assert.equal(next.level, 1);
  assert.equal(next.progress, 5);
  assert.equal(next.wins, 3);
  assert.equal(next.celebration, "win");
  assert.equal(next.celebrationAt, 5678);
});

test("invalid saved game data normalizes without affecting other themes", () => {
  const normalized = normalizeGameProgressMap({
    game_moon_garden: {
      schemaVersion: 2,
      level: 99,
      progress: -20,
      wins: -4,
      revision: 7,
      celebration: "invalid"
    }
  });
  assert.equal(normalized.game_moon_garden.level, 99);
  assert.equal(normalized.game_moon_garden.progress, 0);
  assert.equal(normalized.game_moon_garden.wins, 0);
  assert.equal(normalized.game_moon_garden.celebration, "none");
  assert.equal(normalized.game_crystal_quest.level, 1);
});

test("legacy five-level saves map onto the 100-level curve", () => {
  const normalized = normalizeGameProgressMap({
    game_moon_garden: {
      level: 3,
      progress: 22,
      target: 44,
      totalPoints: 80
    }
  });
  const garden = normalized.game_moon_garden;
  assert.equal(garden.schemaVersion, 2);
  assert.equal(garden.level, 41);
  assert.ok(garden.progress < garden.target);
});

test("rescue celebration stays visible for the clip duration", () => {
  const next = advanceGameTheme(createGameThemeProgress("game_tower_tresses"), { type: "bid" }, 1000);
  assert.equal(next.celebration, "level_up");
  assert.ok(celebrationActiveUntil(next, 1000) > 3000);
  assert.equal(celebrationActiveUntil(next, 1000 + GAME_ACTION_CLIP_MS.level_up), 0);
});

test("overlay accepts a tower payload even if the target curve changed", () => {
  assert.equal(isGameThemeProgressPayload({
    theme: "game_tower_tresses",
    level: 1,
    target: 999,
    progress: 0
  }), true);
});
