export const GAME_THEME_IDS = [
  "game_tower_tresses",
  "game_starship_rally",
  "game_moon_garden",
  "game_crystal_quest",
  "game_neon_grand_prix"
] as const;

export type GameThemeId = (typeof GAME_THEME_IDS)[number];
export type GameCelebration = "none" | "level_up" | "win";
export type GameEventType = "sale" | "bid" | "audience_action" | "tip" | "share";
export type GameAction = "idle" | "bid" | "audience" | "share" | "tip" | "sale" | "level_up" | "win";
export type GameAnimationIntensity = 1 | 2 | 3;

export interface GameAnimationCommand {
  id: number;
  action: GameAction;
  startedAt: number;
  durationMs: number;
  intensity: GameAnimationIntensity;
}

export interface GameAnimationState {
  active: GameAnimationCommand | null;
  queue: GameAnimationCommand[];
  nextId: number;
}

export interface GameThemeDefinition {
  id: GameThemeId;
  name: string;
  objective: string;
  levelNoun: string;
  targets: readonly number[];
}

export interface GameThemeProgress {
  schemaVersion: number;
  theme: GameThemeId;
  level: number;
  progress: number;
  target: number;
  totalPoints: number;
  wins: number;
  lastGain: number;
  lastEventType?: GameEventType;
  revision: number;
  lastAction: GameAction;
  actionAt?: number;
  celebration: GameCelebration;
  celebrationAt?: number;
}

export type GameProgressMap = Record<GameThemeId, GameThemeProgress>;

export type GameScoringEvent = {
  type: GameEventType;
  action?: "follow" | "bookmark" | "chat" | "reaction";
  delta?: number;
};

const V1_TARGETS: Record<GameThemeId, readonly number[]> = {
  game_tower_tresses: [18, 30, 48, 72, 105],
  game_starship_rally: [20, 34, 52, 78, 112],
  game_moon_garden: [16, 28, 44, 68, 100],
  game_crystal_quest: [22, 36, 56, 82, 120],
  game_neon_grand_prix: [18, 32, 50, 76, 110]
};

function createHundredTargets(steepness: number): readonly number[] {
  return Array.from({ length: 100 }, (_, index) => {
    const level = index + 1;
    if (level === 1) {
      return 2;
    }
    return Math.round(8 + (level - 2) * (5 + steepness) + (1 + steepness * 0.12) * Math.pow(level - 1, 1.42));
  });
}

export const GAME_THEME_DEFINITIONS: Record<GameThemeId, GameThemeDefinition> = {
  game_tower_tresses: {
    id: "game_tower_tresses",
    name: "Tower Tresses",
    objective: "Grow the braid to the courtyard for a rescue",
    levelNoun: "Tower",
    targets: createHundredTargets(1.15)
  },
  game_starship_rally: {
    id: "game_starship_rally",
    name: "Starship Rally",
    objective: "Fuel the ship and jump to the next orbit",
    levelNoun: "Orbit",
    targets: createHundredTargets(1.3)
  },
  game_moon_garden: {
    id: "game_moon_garden",
    name: "Moon Garden",
    objective: "Grow the moon garden to full bloom",
    levelNoun: "Moon",
    targets: createHundredTargets(0.9)
  },
  game_crystal_quest: {
    id: "game_crystal_quest",
    name: "Crystal Quest",
    objective: "Fill the cart and open the crystal chamber",
    levelNoun: "Depth",
    targets: createHundredTargets(1.5)
  },
  game_neon_grand_prix: {
    id: "game_neon_grand_prix",
    name: "Neon Grand Prix",
    objective: "Race the circuit to the finish gantry",
    levelNoun: "Lap",
    targets: createHundredTargets(1.2)
  }
};

export function isGameThemeId(value: unknown): value is GameThemeId {
  return typeof value === "string" && (GAME_THEME_IDS as readonly string[]).includes(value);
}

export function gameThemeFromSkin(value: unknown): GameThemeId | null {
  return isGameThemeId(value) ? value : null;
}

export function pointsForGameEvent(event: GameScoringEvent): number {
  if (event.type === "sale" || event.type === "tip") {
    return 10;
  }
  if (event.type === "bid") {
    return 2;
  }
  if (event.type === "share") {
    return Math.max(1, Math.min(5, Math.floor(event.delta ?? 1)));
  }
  return event.action === "follow" ? 2 : 1;
}

export function gameActionForEvent(event: GameScoringEvent): GameAction {
  if (event.type === "audience_action") {
    return "audience";
  }
  return event.type;
}

export const GAME_ACTION_CLIP_MS: Record<GameAction, number> = {
  idle: 1200,
  bid: 480,
  audience: 560,
  share: 720,
  tip: 960,
  sale: 1280,
  level_up: 4000,
  win: 5200
};

export const UNINTERRUPTIBLE_GAME_ACTIONS: ReadonlySet<GameAction> = new Set([
  "sale",
  "tip",
  "level_up",
  "win"
]);

export function createGameAnimationState(): GameAnimationState {
  return { active: null, queue: [], nextId: 1 };
}

export function enqueueGameAction(
  state: GameAnimationState,
  action: GameAction,
  now = Date.now()
): GameAnimationState {
  const next: GameAnimationState = {
    active: state.active ? { ...state.active } : null,
    queue: state.queue.map((command) => ({ ...command })),
    nextId: state.nextId
  };

  if (action === "idle") {
    return next;
  }

  if (action === "bid") {
    if (next.active?.action === "bid") {
      next.active.intensity = Math.min(3, next.active.intensity + 1) as GameAnimationIntensity;
      return next;
    }
    const pending = next.queue.find((command) => command.action === "bid");
    if (pending) {
      pending.intensity = Math.min(3, pending.intensity + 1) as GameAnimationIntensity;
      return next;
    }
  }

  const command: GameAnimationCommand = {
    id: next.nextId,
    action,
    startedAt: now,
    durationMs: GAME_ACTION_CLIP_MS[action],
    intensity: 1
  };
  next.nextId += 1;

  if (!next.active || next.active.action === "idle") {
    next.active = command;
    return next;
  }

  const activeLocked = UNINTERRUPTIBLE_GAME_ACTIONS.has(next.active.action);
  const incomingLocked = UNINTERRUPTIBLE_GAME_ACTIONS.has(action);

  if (!activeLocked && incomingLocked) {
    next.active = command;
    return next;
  }

  if (activeLocked) {
    if (incomingLocked) {
      if (next.queue.at(-1)?.action !== action) {
        next.queue.push(command);
      }
      return next;
    }
    if (action === "bid") {
      next.queue.push(command);
      return next;
    }
    if (!next.queue.some((queued) => queued.action === action)) {
      next.queue.push(command);
    }
    return next;
  }

  if (action === next.active.action) {
    return next;
  }
  if (!next.queue.some((queued) => queued.action === action)) {
    next.queue.push(command);
  }
  return next;
}

export function finishGameAction(state: GameAnimationState, now = Date.now()): GameAnimationState {
  const next: GameAnimationState = {
    active: null,
    queue: state.queue.map((command) => ({ ...command })),
    nextId: state.nextId
  };
  const queued = next.queue.shift();
  next.active = queued
    ? { ...queued, startedAt: now }
    : {
        id: next.nextId,
        action: "idle",
        startedAt: now,
        durationMs: GAME_ACTION_CLIP_MS.idle,
        intensity: 1
      };
  if (!queued) {
    next.nextId += 1;
  }
  return next;
}

export function gameLevelCount(theme: GameThemeId): number {
  return GAME_THEME_DEFINITIONS[theme].targets.length;
}

export function gameTargetForLevel(theme: GameThemeId, level: number): number {
  const definition = GAME_THEME_DEFINITIONS[theme];
  const normalizedLevel = clampInteger(level, 1, definition.targets.length);
  return definition.targets[normalizedLevel - 1] ?? definition.targets[0] ?? 1;
}

export const TOWER_TRESSES_SCHEMA_VERSION = 3;
export const GAME_V2_SCHEMA_VERSION = 2;

export function gameSchemaVersion(theme: GameThemeId): number {
  return theme === "game_tower_tresses" ? TOWER_TRESSES_SCHEMA_VERSION : GAME_V2_SCHEMA_VERSION;
}

export function createGameThemeProgress(theme: GameThemeId): GameThemeProgress {
  return {
    schemaVersion: gameSchemaVersion(theme),
    theme,
    level: 1,
    progress: 0,
    target: gameTargetForLevel(theme, 1),
    totalPoints: 0,
    wins: 0,
    lastGain: 0,
    revision: 0,
    lastAction: "idle",
    celebration: "none"
  };
}

export function createGameProgressMap(): GameProgressMap {
  return Object.fromEntries(
    GAME_THEME_IDS.map((theme) => [theme, createGameThemeProgress(theme)])
  ) as GameProgressMap;
}

export function advanceGameTheme(
  current: GameThemeProgress,
  event: GameScoringEvent,
  now = Date.now()
): GameThemeProgress {
  const theme = current.theme;
  const definition = GAME_THEME_DEFINITIONS[theme];
  const maxLevel = definition.targets.length;
  const gain = pointsForGameEvent(event);
  let level = clampInteger(current.level, 1, maxLevel);
  let progress = Math.max(0, finiteNumber(current.progress, 0)) + gain;
  let wins = Math.max(0, clampInteger(current.wins, 0, Number.MAX_SAFE_INTEGER));
  let celebration: GameCelebration = "none";
  let target = gameTargetForLevel(theme, level);

  if (progress >= target) {
    progress -= target;
    if (level === maxLevel) {
      wins += 1;
      level = 1;
      celebration = "win";
    } else {
      level += 1;
      celebration = "level_up";
    }
    target = gameTargetForLevel(theme, level);
  }

  const lastAction = gameActionForEvent(event);

  return {
    schemaVersion: gameSchemaVersion(theme),
    theme,
    level,
    progress,
    target,
    totalPoints: Math.max(0, finiteNumber(current.totalPoints, 0)) + gain,
    wins,
    lastGain: gain,
    lastEventType: event.type,
    revision: Math.max(0, clampInteger(current.revision, 0, Number.MAX_SAFE_INTEGER)) + 1,
    lastAction,
    actionAt: now,
    celebration,
    celebrationAt: celebration === "none" ? undefined : now
  };
}

export function normalizeGameThemeProgress(theme: GameThemeId, value: unknown): GameThemeProgress {
  const fallback = createGameThemeProgress(theme);
  if (!isRecord(value)) {
    return fallback;
  }

  const savedSchema = finiteNumber(value.schemaVersion, 1);
  const resetTowerCurve = theme === "game_tower_tresses" && savedSchema < TOWER_TRESSES_SCHEMA_VERSION;
  if (resetTowerCurve) {
    return {
      ...fallback,
      totalPoints: Math.max(0, finiteNumber(value.totalPoints, 0)),
      wins: Math.max(0, clampInteger(value.wins, 0, Number.MAX_SAFE_INTEGER))
    };
  }
  const migratingV1 = theme !== "game_tower_tresses" && savedSchema < GAME_V2_SCHEMA_VERSION;
  const maxLevel = gameLevelCount(theme);
  const savedLevel = clampInteger(value.level, 1, migratingV1 ? 5 : maxLevel);
  const level = migratingV1 ? 1 + ((savedLevel - 1) * 20) : savedLevel;
  const target = gameTargetForLevel(theme, level);
  const savedProgress = Math.max(0, finiteNumber(value.progress, 0));
  const legacyTarget = Math.max(1, finiteNumber(value.target, V1_TARGETS[theme][savedLevel - 1] ?? 1));
  const progress = migratingV1
    ? Math.min(target - 1, Math.floor((savedProgress / legacyTarget) * target))
    : Math.min(target - 1, savedProgress);
  const lastEventType = isGameEventType(value.lastEventType) ? value.lastEventType : undefined;
  const lastAction = isGameAction(value.lastAction) ? value.lastAction : lastEventType ? gameActionForEvent({ type: lastEventType }) : "idle";
  const actionAt = finiteOptionalNumber(value.actionAt);
  const celebration = isGameCelebration(value.celebration) ? value.celebration : "none";
  const celebrationAt = finiteOptionalNumber(value.celebrationAt);

  return {
    schemaVersion: gameSchemaVersion(theme),
    theme,
    level,
    progress,
    target,
    totalPoints: Math.max(0, finiteNumber(value.totalPoints, 0)),
    wins: Math.max(0, clampInteger(value.wins, 0, Number.MAX_SAFE_INTEGER)),
    lastGain: Math.max(0, finiteNumber(value.lastGain, 0)),
    lastEventType,
    revision: Math.max(0, clampInteger(value.revision, 0, Number.MAX_SAFE_INTEGER)),
    lastAction,
    actionAt,
    celebration,
    celebrationAt: celebration === "none" ? undefined : celebrationAt
  };
}

export function normalizeGameProgressMap(value: unknown): GameProgressMap {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(
    GAME_THEME_IDS.map((theme) => [theme, normalizeGameThemeProgress(theme, source[theme])])
  ) as GameProgressMap;
}

export function isGameThemeProgress(value: unknown): value is GameThemeProgress {
  if (!isRecord(value) || !isGameThemeId(value.theme)) {
    return false;
  }
  const normalized = normalizeGameThemeProgress(value.theme, value);
  return normalized.level === value.level &&
    normalized.schemaVersion === value.schemaVersion &&
    normalized.progress === value.progress &&
    normalized.target === value.target &&
    normalized.totalPoints === value.totalPoints &&
    normalized.wins === value.wins &&
    normalized.lastGain === value.lastGain &&
    normalized.revision === value.revision &&
    normalized.lastAction === value.lastAction &&
    normalized.celebration === value.celebration &&
    (value.lastEventType === undefined || normalized.lastEventType === value.lastEventType) &&
    (value.actionAt === undefined || normalized.actionAt === value.actionAt) &&
    (value.celebrationAt === undefined || normalized.celebrationAt === value.celebrationAt);
}

export function isGameThemeProgressPayload(value: unknown): value is Record<string, unknown> & { theme: GameThemeId } {
  return isRecord(value) && isGameThemeId(value.theme);
}

export function celebrationClipAction(celebration: GameCelebration): Extract<GameAction, "level_up" | "win"> | null {
  if (celebration === "level_up" || celebration === "win") {
    return celebration;
  }
  return null;
}

export function celebrationActiveUntil(progress: Pick<GameThemeProgress, "celebration" | "celebrationAt">, now = Date.now()): number {
  const action = celebrationClipAction(progress.celebration);
  if (!action || progress.celebrationAt === undefined) {
    return 0;
  }
  return Math.max(0, progress.celebrationAt + GAME_ACTION_CLIP_MS[action] - now);
}

function isGameEventType(value: unknown): value is GameEventType {
  return value === "sale" || value === "bid" || value === "audience_action" || value === "tip" || value === "share";
}

function isGameCelebration(value: unknown): value is GameCelebration {
  return value === "none" || value === "level_up" || value === "win";
}

function isGameAction(value: unknown): value is GameAction {
  return value === "idle" || value === "bid" || value === "audience" || value === "share" || value === "tip" ||
    value === "sale" || value === "level_up" || value === "win";
}

function clampInteger(value: unknown, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(finiteNumber(value, min))));
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function finiteOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
