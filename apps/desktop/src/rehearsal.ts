import fs from "node:fs";
import path from "node:path";
import {
  isSceneMode,
  isShowEvent,
  isSoundKind,
  type SceneMode,
  type ShowEvent,
  type SoundKind
} from "@duck-desk/shared";

const maxTimelines = 50;
const maxActions = 500;
const maxFileBytes = 2 * 1024 * 1024;

export type RehearsalAction =
  | { atMs: number; kind: "event"; event: ShowEvent }
  | { atMs: number; kind: "gif"; gifId: string }
  | { atMs: number; kind: "sound"; sound: SoundKind }
  | { atMs: number; kind: "scene"; scene: SceneMode }
  | { atMs: number; kind: "burst" }
  | { atMs: number; kind: "hype" }
  | { atMs: number; kind: "timer" }
  | { atMs: number; kind: "recap" }
  | { atMs: number; kind: "clear" };

export type RehearsalActionInput = RehearsalAction extends infer Action
  ? Action extends { atMs: number }
    ? Omit<Action, "atMs">
    : never
  : never;

export interface RehearsalTimeline {
  version: 1;
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  actions: RehearsalAction[];
  builtIn?: boolean;
}

export type RehearsalState = "idle" | "playing" | "paused" | "recording";
export type ShowEventOrigin = "live" | "demo" | "rehearsal";

export interface RehearsalStatus {
  state: RehearsalState;
  activeId?: string;
  activeName?: string;
  elapsedMs: number;
  durationMs: number;
  nextActionAtMs?: number;
  nextActionKind?: RehearsalAction["kind"];
  recordingActions: number;
}

export function shouldUpdateLiveHealth(origin: ShowEventOrigin): boolean {
  return origin === "live";
}

interface Scheduler {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(timer: ReturnType<typeof setTimeout>): void;
}

const defaultScheduler: Scheduler = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (timer) => clearTimeout(timer)
};

export class RehearsalManager {
  private state: RehearsalState = "idle";
  private activeTimeline: RehearsalTimeline | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;
  private pausedElapsedMs = 0;
  private nextActionIndex = 0;
  private recordingStartedAt = 0;
  private recordedActions: RehearsalAction[] = [];

  constructor(
    private readonly execute: (action: RehearsalAction) => void,
    private readonly onChange: () => void,
    private readonly scheduler: Scheduler = defaultScheduler
  ) {}

  start(timeline: RehearsalTimeline): void {
    this.stop(false);
    this.activeTimeline = { ...timeline, actions: sortActions(timeline.actions) };
    this.state = "playing";
    this.startedAt = this.scheduler.now();
    this.pausedElapsedMs = 0;
    this.nextActionIndex = 0;
    this.scheduleNext();
    this.onChange();
  }

  pause(): void {
    if (this.state !== "playing") {
      return;
    }
    this.pausedElapsedMs = this.elapsedMs();
    this.state = "paused";
    this.clearTimer();
    this.onChange();
  }

  resume(): void {
    if (this.state !== "paused" || !this.activeTimeline) {
      return;
    }
    this.state = "playing";
    this.startedAt = this.scheduler.now() - this.pausedElapsedMs;
    this.scheduleNext();
    this.onChange();
  }

  stop(notify = true): void {
    this.clearTimer();
    this.state = "idle";
    this.activeTimeline = null;
    this.startedAt = 0;
    this.pausedElapsedMs = 0;
    this.nextActionIndex = 0;
    this.recordingStartedAt = 0;
    this.recordedActions = [];
    if (notify) {
      this.onChange();
    }
  }

  startRecording(): void {
    this.stop(false);
    this.state = "recording";
    this.recordingStartedAt = this.scheduler.now();
    this.recordedActions = [];
    this.onChange();
  }

  record(action: RehearsalActionInput): void {
    if (this.state !== "recording" || this.recordedActions.length >= maxActions) {
      return;
    }
    const atMs = Math.max(0, this.scheduler.now() - this.recordingStartedAt);
    this.recordedActions.push({ ...action, atMs } as RehearsalAction);
    this.onChange();
  }

  saveRecording(id: string, name: string): RehearsalTimeline | null {
    if (this.state !== "recording" || this.recordedActions.length === 0) {
      return null;
    }
    const actions = sortActions(this.recordedActions);
    const durationMs = Math.max(1_000, (actions.at(-1)?.atMs ?? 0) + 1_000);
    const timeline: RehearsalTimeline = {
      version: 1,
      id,
      name: sanitizeTimelineName(name),
      createdAt: this.scheduler.now(),
      durationMs,
      actions
    };
    this.stop();
    return timeline;
  }

  getStatus(): RehearsalStatus {
    const elapsedMs = this.elapsedMs();
    return {
      state: this.state,
      activeId: this.activeTimeline?.id,
      activeName: this.activeTimeline?.name,
      elapsedMs,
      durationMs: this.activeTimeline?.durationMs ?? (this.state === "recording" ? elapsedMs : 0),
      nextActionAtMs: this.activeTimeline?.actions[this.nextActionIndex]?.atMs,
      nextActionKind: this.activeTimeline?.actions[this.nextActionIndex]?.kind,
      recordingActions: this.recordedActions.length
    };
  }

  private elapsedMs(): number {
    if (this.state === "playing" || this.state === "recording") {
      const origin = this.state === "recording" ? this.recordingStartedAt : this.startedAt;
      return Math.max(0, this.scheduler.now() - origin);
    }
    return this.state === "paused" ? this.pausedElapsedMs : 0;
  }

  private scheduleNext(): void {
    this.clearTimer();
    if (this.state !== "playing" || !this.activeTimeline) {
      return;
    }
    const next = this.activeTimeline.actions[this.nextActionIndex];
    if (!next) {
      const remaining = Math.max(0, this.activeTimeline.durationMs - this.elapsedMs());
      this.timer = this.scheduler.setTimeout(() => this.finish(), remaining);
      return;
    }
    const delayMs = Math.max(0, next.atMs - this.elapsedMs());
    this.timer = this.scheduler.setTimeout(() => {
      if (this.state !== "playing" || !this.activeTimeline) {
        return;
      }
      const elapsed = this.elapsedMs();
      while (this.nextActionIndex < this.activeTimeline.actions.length) {
        const action = this.activeTimeline.actions[this.nextActionIndex];
        if (!action || action.atMs > elapsed + 5) {
          break;
        }
        this.nextActionIndex += 1;
        this.execute(action);
      }
      this.onChange();
      this.scheduleNext();
    }, delayMs);
  }

  private finish(): void {
    this.clearTimer();
    this.state = "idle";
    this.activeTimeline = null;
    this.startedAt = 0;
    this.pausedElapsedMs = 0;
    this.nextActionIndex = 0;
    this.onChange();
  }

  private clearTimer(): void {
    if (this.timer) {
      this.scheduler.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export function createBuiltInRehearsals(now = Date.now()): RehearsalTimeline[] {
  return [
    timeline("quiet-show", "Quiet Show", now, 14_000, [
      event(600, { type: "audience_action", actor: "PreviewFollower", action: "follow", timestamp: now + 600 }),
      event(2_600, { type: "share", actor: "PreviewSharer", delta: 1, timestamp: now + 2_600 }),
      event(5_000, { type: "bid", bidder: "FirstBidder", amount: 12, item: "Preview Lot", timestamp: now + 5_000 }),
      event(8_000, { type: "bid", bidder: "SecondBidder", amount: 15, item: "Preview Lot", timestamp: now + 8_000 }),
      event(11_000, { type: "sale", buyer: "PreviewBuyer", amount: 15, item: "Preview Lot", timestamp: now + 11_000 })
    ]),
    timeline("rapid-auction", "Rapid Auction", now, 11_000, [
      { atMs: 0, kind: "scene", scene: "auction" },
      { atMs: 250, kind: "timer" },
      ...Array.from({ length: 10 }, (_, index) => event(800 + index * 650, {
        type: "bid",
        bidder: `Bidder${index % 3 + 1}`,
        amount: 10 + index * 2,
        item: "Rapid Auction",
        timestamp: now + 800 + index * 650
      })),
      event(8_000, { type: "sale", buyer: "Bidder1", amount: 28, item: "Rapid Auction", timestamp: now + 8_000 }),
      { atMs: 8_200, kind: "scene", scene: "winner" },
      { atMs: 10_000, kind: "scene", scene: "none" }
    ]),
    timeline("sale-moment", "Full Sale Moment", now, 12_000, [
      event(500, { type: "bid", bidder: "CollectorOne", amount: 24, item: "Feature Lot", timestamp: now + 500 }),
      event(1_500, { type: "bid", bidder: "CollectorTwo", amount: 30, item: "Feature Lot", timestamp: now + 1_500 }),
      event(2_700, { type: "tip", tipper: "ShowSupporter", amount: 5, message: "Great show", timestamp: now + 2_700 }),
      { atMs: 3_600, kind: "burst" },
      event(4_400, { type: "sale", buyer: "CollectorTwo", amount: 30, item: "Feature Lot", timestamp: now + 4_400 }),
      { atMs: 5_000, kind: "gif", gifId: "featured" },
      { atMs: 7_500, kind: "recap" }
    ]),
    timeline("stress-test", "Stress Test", now, 16_000, [
      ...Array.from({ length: 30 }, (_, index) => event(index * 180, index % 5 === 0
        ? { type: "audience_action", actor: `Viewer${index}`, action: "reaction", message: "Hype", timestamp: now + index * 180 }
        : { type: "bid", bidder: `Bidder${index % 5 + 1}`, amount: 10 + index, item: "Stress Lot", timestamp: now + index * 180 })),
      event(6_200, { type: "tip", tipper: "StressTipper", amount: 10, timestamp: now + 6_200 }),
      event(7_500, { type: "sale", buyer: "StressWinner", amount: 45, item: "Stress Lot", timestamp: now + 7_500 }),
      { atMs: 8_000, kind: "burst" },
      { atMs: 10_000, kind: "hype" },
      { atMs: 14_500, kind: "clear" }
    ])
  ];
}

export function loadRehearsalLibrary(filePath: string): { timelines: RehearsalTimeline[]; quarantined: boolean } {
  try {
    return { timelines: loadRehearsalTimelines(filePath), quarantined: false };
  } catch {
    try {
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, `${filePath}.invalid-${Date.now()}`);
      }
    } catch {
      // Keep starting even if the bad file cannot be moved.
    }
    return { timelines: [], quarantined: true };
  }
}

export function loadRehearsalTimelines(filePath: string): RehearsalTimeline[] {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size > maxFileBytes) {
      throw new Error("Rehearsal library exceeds its size limit.");
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.timelines)) {
      throw new Error("Rehearsal library is malformed.");
    }
    return parsed.timelines.map(normalizeTimeline).filter((value): value is RehearsalTimeline => Boolean(value)).slice(0, maxTimelines);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function saveRehearsalTimelines(filePath: string, timelines: RehearsalTimeline[]): void {
  const normalized = timelines.map(normalizeTimeline).filter((value): value is RehearsalTimeline => Boolean(value)).slice(0, maxTimelines);
  const payload = `${JSON.stringify({ version: 1, timelines: normalized }, null, 2)}\n`;
  if (Buffer.byteLength(payload) > maxFileBytes) {
    throw new Error("Rehearsal library exceeds its size limit.");
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, payload, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

export function normalizeTimeline(value: unknown): RehearsalTimeline | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(value.id)
    || typeof value.name !== "string" || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)
    || typeof value.durationMs !== "number" || !Number.isFinite(value.durationMs) || value.durationMs < 250 || value.durationMs > 30 * 60_000
    || !Array.isArray(value.actions) || value.actions.length === 0 || value.actions.length > maxActions) {
    return null;
  }
  const durationMs = value.durationMs;
  const actions = value.actions.map(normalizeAction).filter((action): action is RehearsalAction => Boolean(action));
  if (actions.length !== value.actions.length || actions.some((action) => action.atMs > durationMs)) {
    return null;
  }
  return {
    version: 1,
    id: value.id,
    name: sanitizeTimelineName(value.name),
    createdAt: value.createdAt,
    durationMs: Math.round(durationMs),
    actions: sortActions(actions)
  };
}

export function sanitizeTimelineName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Recorded Rehearsal";
}

function normalizeAction(value: unknown): RehearsalAction | null {
  if (!isRecord(value) || typeof value.atMs !== "number" || !Number.isFinite(value.atMs) || value.atMs < 0) {
    return null;
  }
  const atMs = Math.round(value.atMs);
  if (value.kind === "event" && isShowEvent(value.event)) {
    return { atMs, kind: "event", event: value.event };
  }
  if (value.kind === "gif" && typeof value.gifId === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value.gifId)) {
    return { atMs, kind: "gif", gifId: value.gifId };
  }
  if (value.kind === "sound" && isSoundKind(value.sound)) {
    return { atMs, kind: "sound", sound: value.sound };
  }
  if (value.kind === "scene" && isSceneMode(value.scene)) {
    return { atMs, kind: "scene", scene: value.scene };
  }
  if (value.kind === "burst" || value.kind === "hype" || value.kind === "timer" || value.kind === "recap" || value.kind === "clear") {
    return { atMs, kind: value.kind };
  }
  return null;
}

function timeline(id: string, name: string, now: number, durationMs: number, actions: RehearsalAction[]): RehearsalTimeline {
  return { version: 1, id, name, createdAt: now, durationMs, actions: sortActions(actions), builtIn: true };
}

function event(atMs: number, value: ShowEvent): RehearsalAction {
  return { atMs, kind: "event", event: value };
}

function sortActions(actions: RehearsalAction[]): RehearsalAction[] {
  return actions.map((action, index) => ({ action, index }))
    .sort((left, right) => left.action.atMs - right.action.atMs || left.index - right.index)
    .map(({ action }) => action);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
