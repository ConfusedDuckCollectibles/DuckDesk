import assert from "node:assert/strict";
import test from "node:test";
import {
  AudioPlaybackScheduler,
  bundledAudioFileName,
  isAudioPlaybackEnabled,
  normalizeAudioVolume,
  selectAudioCueSource
} from "../packages/shared/dist/index.js";

test("frequent cues respect cooldowns", () => {
  const scheduler = new AudioPlaybackScheduler();
  assert.equal(scheduler.request("bid", 1000, "a").action, "play");
  assert.deepEqual(scheduler.request("bid", 1100, "b"), { action: "drop", reason: "cooldown" });
  assert.equal(scheduler.request("bid", 1250, "c").action, "play");
  assert.equal(scheduler.request("action", 2000, "d").action, "play");
  assert.deepEqual(scheduler.request("action", 2500, "e"), { action: "drop", reason: "cooldown" });
});

test("sale and tip cues are protected and never discarded", () => {
  const scheduler = new AudioPlaybackScheduler();
  assert.equal(scheduler.request("sale", 1000, "sale-1").action, "play");
  assert.deepEqual(scheduler.request("bid", 1100, "bid-1"), { action: "drop", reason: "protected" });
  const tip = scheduler.request("tip", 1200, "tip-1");
  assert.equal(tip.action, "queue");
  assert.equal(tip.action === "queue" ? tip.delayMs : -1, 640);
  const sale = scheduler.request("sale", 1250, "sale-2");
  assert.equal(sale.action, "queue");
});

test("higher priority cues interrupt lower priority cues", () => {
  const scheduler = new AudioPlaybackScheduler();
  assert.equal(scheduler.request("share", 1000, "share").action, "play");
  assert.deepEqual(scheduler.request("action", 1050, "action"), { action: "drop", reason: "priority" });
  const sale = scheduler.request("sale", 1100, "sale");
  assert.deepEqual(sale, { action: "play", variant: 1, interrupt: true });
});

test("variants are deterministic and never repeat immediately", () => {
  const first = new AudioPlaybackScheduler();
  const second = new AudioPlaybackScheduler();
  const times = [1000, 1250, 1500, 1750, 2000, 2250];
  const firstVariants = times.map((time, index) => first.request("bid", time, `bid-${index}`)).map((decision) => decision.action === "play" ? decision.variant : 0);
  const secondVariants = times.map((time, index) => second.request("bid", time, `bid-${index}`)).map((decision) => decision.action === "play" ? decision.variant : 0);
  assert.deepEqual(firstVariants, secondVariants);
  for (let index = 1; index < firstVariants.length; index += 1) assert.notEqual(firstVariants[index], firstVariants[index - 1]);
});

test("thirty-repeat fatigue sequence stays varied", () => {
  const scheduler = new AudioPlaybackScheduler();
  const variants = Array.from({ length: 30 }, (_, index) => {
    const decision = scheduler.request("bid", 1000 + index * 250, `fatigue-${index}`);
    assert.equal(decision.action, "play");
    return decision.action === "play" ? decision.variant : 0;
  });
  for (let index = 1; index < variants.length; index += 1) assert.notEqual(variants[index], variants[index - 1]);
  for (const variant of [1, 2, 3]) assert(variants.filter((value) => value === variant).length >= 7);
});

test("mute, volume normalization, reset, and custom overrides are stable", () => {
  assert.equal(isAudioPlaybackEnabled(false, 1), false);
  assert.equal(isAudioPlaybackEnabled(true, 0), false);
  assert.equal(isAudioPlaybackEnabled(true, 0.4), true);
  assert.equal(normalizeAudioVolume(2), 1);
  assert.equal(normalizeAudioVolume(-1), 0);
  assert.equal(selectAudioCueSource("sale", 1, "/custom/sale.wav"), "/custom/sale.wav");
  const scheduler = new AudioPlaybackScheduler();
  scheduler.request("sale", 1000, "sale");
  scheduler.reset();
  assert.equal(scheduler.request("bid", 1010, "bid").action, "play");
});

test("bundled file names preserve primary paths", () => {
  assert.equal(bundledAudioFileName("bid", 1), "bid.wav");
  assert.equal(bundledAudioFileName("bid", 2), "bid-02.wav");
  assert.equal(bundledAudioFileName("action", 3), "action-03.wav");
  assert.equal(bundledAudioFileName("sale", 1), "sale.wav");
});
