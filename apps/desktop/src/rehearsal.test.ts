import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  RehearsalManager,
  createBuiltInRehearsals,
  loadRehearsalLibrary,
  normalizeTimeline,
  shouldUpdateLiveHealth,
  type RehearsalAction
} from "./rehearsal.js";

class FakeScheduler {
  time = 0;
  private id = 0;
  private timers = new Map<number, { at: number; callback: () => void }>();

  now = (): number => this.time;
  setTimeout = (callback: () => void, delayMs: number): ReturnType<typeof setTimeout> => {
    const id = ++this.id;
    this.timers.set(id, { at: this.time + delayMs, callback });
    return id as unknown as ReturnType<typeof setTimeout>;
  };
  clearTimeout = (timer: ReturnType<typeof setTimeout>): void => {
    this.timers.delete(timer as unknown as number);
  };

  pendingCount(): number {
    return this.timers.size;
  }

  advance(milliseconds: number): void {
    const target = this.time + milliseconds;
    while (true) {
      const next = [...this.timers.entries()].sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0];
      if (!next || next[1].at > target) {
        break;
      }
      this.time = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
    }
    this.time = target;
  }
}

function action(atMs: number, kind: "burst" | "clear"): RehearsalAction {
  return { atMs, kind };
}

test("rehearsal playback is ordered and completes", () => {
  const scheduler = new FakeScheduler();
  const executed: string[] = [];
  const manager = new RehearsalManager((item) => executed.push(item.kind), () => undefined, scheduler);
  manager.start({ version: 1, id: "test", name: "Test", createdAt: 0, durationMs: 1_000, actions: [action(500, "clear"), action(100, "burst")] });
  scheduler.advance(100);
  assert.deepEqual(executed, ["burst"]);
  scheduler.advance(400);
  assert.deepEqual(executed, ["burst", "clear"]);
  scheduler.advance(500);
  assert.equal(manager.getStatus().state, "idle");
});

test("pause and resume preserve the remaining timeline", () => {
  const scheduler = new FakeScheduler();
  const executed: string[] = [];
  const manager = new RehearsalManager((item) => executed.push(item.kind), () => undefined, scheduler);
  manager.start({ version: 1, id: "test", name: "Test", createdAt: 0, durationMs: 1_000, actions: [action(500, "burst")] });
  scheduler.advance(200);
  manager.pause();
  scheduler.advance(1_000);
  assert.deepEqual(executed, []);
  manager.resume();
  scheduler.advance(299);
  assert.deepEqual(executed, []);
  scheduler.advance(1);
  assert.deepEqual(executed, ["burst"]);
});

test("stop cancels all remaining work", () => {
  const scheduler = new FakeScheduler();
  const executed: string[] = [];
  const manager = new RehearsalManager((item) => executed.push(item.kind), () => undefined, scheduler);
  manager.start({ version: 1, id: "test", name: "Test", createdAt: 0, durationMs: 1_000, actions: [action(300, "burst")] });
  manager.stop();
  scheduler.advance(2_000);
  assert.deepEqual(executed, []);
  assert.equal(manager.getStatus().state, "idle");
});

test("recording captures relative timing and creates a reusable timeline", () => {
  const scheduler = new FakeScheduler();
  const manager = new RehearsalManager(() => undefined, () => undefined, scheduler);
  manager.startRecording();
  scheduler.advance(250);
  manager.record({ kind: "burst" });
  scheduler.advance(500);
  manager.record({ kind: "clear" });
  const saved = manager.saveRecording("saved-test", "  My   Show  ");
  assert.equal(saved?.name, "My Show");
  assert.deepEqual(saved?.actions.map((item) => item.atMs), [250, 750]);
  assert.equal(saved?.durationMs, 1_750);
});

test("timeline validation rejects unknown actions and unsafe identifiers", () => {
  assert.equal(normalizeTimeline({ version: 1, id: "../bad", name: "Bad", createdAt: 0, durationMs: 1_000, actions: [action(0, "burst")] }), null);
  assert.equal(normalizeTimeline({ version: 1, id: "valid", name: "Bad", createdAt: 0, durationMs: 1_000, actions: [{ atMs: 0, kind: "shell" }] }), null);
  assert.equal(createBuiltInRehearsals(1_000).length, 4);
});

test("identical timestamps keep original order", () => {
  const scheduler = new FakeScheduler();
  const executed: string[] = [];
  const manager = new RehearsalManager((item) => executed.push(item.kind), () => undefined, scheduler);
  manager.start({
    version: 1,
    id: "same-time",
    name: "Same Time",
    createdAt: 0,
    durationMs: 200,
    actions: [action(100, "burst"), action(100, "clear")]
  });
  scheduler.advance(100);
  assert.deepEqual(executed, ["burst", "clear"]);
});

test("stress timelines keep a single pending timer", () => {
  const scheduler = new FakeScheduler();
  const executed: string[] = [];
  const manager = new RehearsalManager((item) => executed.push(item.kind), () => undefined, scheduler);
  const stress = createBuiltInRehearsals(0).find((item) => item.id === "stress-test");
  assert.ok(stress);
  manager.start(stress);
  assert.equal(scheduler.pendingCount(), 1);
  scheduler.advance(16_000);
  assert.ok(executed.length > 20);
  assert.equal(scheduler.pendingCount(), 0);
  assert.equal(manager.getStatus().state, "idle");
});

test("rehearsal and demo origins never update live health", () => {
  assert.equal(shouldUpdateLiveHealth("live"), true);
  assert.equal(shouldUpdateLiveHealth("demo"), false);
  assert.equal(shouldUpdateLiveHealth("rehearsal"), false);
});

test("malformed rehearsal files are quarantined", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duck-desk-rehearsal-"));
  const filePath = path.join(directory, "rehearsal-timelines.json");
  fs.writeFileSync(filePath, "{not json");
  const loaded = loadRehearsalLibrary(filePath);
  assert.equal(loaded.quarantined, true);
  assert.deepEqual(loaded.timelines, []);
  assert.equal(fs.existsSync(filePath), false);
  const quarantined = fs.readdirSync(directory).some((name) => name.includes(".invalid-"));
  assert.equal(quarantined, true);
});
