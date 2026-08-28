import { GAME_ACTION_CLIP_MS, type GameAction } from "./games.js";
import { GAME_EDGE, lanePoint, occupancyViolations, type GameRect } from "./game-edge.js";

export interface EdgeClip {
  heroFrames: readonly number[];
  extra: "none" | "share" | "tip" | "sale" | "level_up" | "win";
  durationMs: number;
  loop: boolean;
  holdFrame: number;
}

function clips(hero: Record<GameAction, readonly number[]>, extra: Partial<Record<GameAction, EdgeClip["extra"]>> = {}): Record<GameAction, EdgeClip> {
  const actions: GameAction[] = ["idle", "bid", "audience", "share", "tip", "sale", "level_up", "win"];
  return Object.fromEntries(actions.map((action) => [action, {
    heroFrames: hero[action],
    extra: extra[action] ?? (action === "idle" || action === "bid" || action === "audience" ? "none" : action),
    durationMs: GAME_ACTION_CLIP_MS[action],
    loop: action === "idle",
    holdFrame: Math.min(hero[action].length - 1, action === "idle" ? 0 : Math.floor(hero[action].length / 2))
  }])) as Record<GameAction, EdgeClip>;
}

export const STARSHIP_CLIPS = clips({
  idle: [0, 1, 0, 1, 2, 1],
  bid: [2, 3, 4, 3, 2, 3],
  audience: [1, 5, 5, 1, 5, 1],
  share: [0, 1, 0, 1, 0, 1, 0, 1],
  tip: [3, 4, 3, 4, 5, 4, 3, 4],
  sale: [4, 5, 6, 5, 6, 4, 5, 6, 5, 6],
  level_up: [5, 6, 7, 6, 7, 5, 6, 7, 6, 7],
  win: [6, 7, 6, 7, 6, 7, 6, 7, 7, 7, 7, 7]
});

export const GARDEN_CLIPS = clips({
  idle: [0, 1, 0, 1, 0, 1],
  bid: [2, 2, 4, 4, 2, 4],
  audience: [3, 3, 3, 1, 3, 3],
  share: [0, 1, 5, 1, 0, 1, 5, 1],
  tip: [3, 4, 3, 4, 4, 3, 4, 3],
  sale: [6, 6, 7, 6, 7, 6, 7, 6, 7, 6],
  level_up: [6, 7, 6, 7, 6, 7, 6, 7, 7, 7],
  win: [7, 6, 7, 6, 7, 6, 7, 7, 7, 7, 7, 7]
});

export const CRYSTAL_CLIPS = clips({
  idle: [0, 1, 0, 2, 0, 1],
  bid: [5, 6, 7, 6, 5, 7],
  audience: [1, 4, 4, 1, 4, 1],
  share: [0, 1, 0, 1, 0, 1, 0, 1],
  tip: [4, 5, 4, 5, 7, 5, 4, 5],
  sale: [2, 3, 2, 3, 4, 3, 2, 3, 4, 3],
  level_up: [6, 7, 1, 7, 6, 7, 1, 7, 7, 7],
  win: [7, 1, 7, 1, 7, 1, 7, 7, 7, 7, 7, 7]
});

export const RACE_CLIPS = clips({
  idle: [0, 1, 0, 2, 0, 1],
  bid: [2, 3, 4, 3, 2, 4],
  audience: [1, 5, 1, 5, 1, 5],
  share: [0, 1, 0, 1, 0, 1, 0, 1],
  tip: [3, 4, 5, 4, 3, 5, 4, 3],
  sale: [4, 5, 6, 5, 6, 4, 5, 6, 5, 6],
  level_up: [5, 6, 5, 6, 5, 6, 5, 6, 6, 6],
  win: [6, 5, 6, 5, 6, 5, 6, 6, 6, 6, 6, 6]
});

export const STARSHIP_PATH = [
  { x: 16, y: 1576 },
  { x: 240, y: 1576 },
  { x: 480, y: 1576 },
  { x: 720, y: 1576 },
  { x: 888, y: 1576 }
] as const;

export const RACE_PATH = [
  { x: 8, y: 1588 },
  { x: 220, y: 1588 },
  { x: 460, y: 1588 },
  { x: 700, y: 1588 },
  { x: 888, y: 1588 }
] as const;

export function plantFrame(fill: number, index: number, count = 6): number {
  const clamped = Math.min(1, Math.max(0, fill));
  const start = index / Math.max(1, count);
  const span = Math.max(0.18, 1 - start);
  const local = (clamped - start) / span;
  if (local <= 0) {
    return 0;
  }
  return Math.min(5, Math.floor(local * 6));
}

export function plantStage(fill: number): number {
  return plantFrame(fill, 0, 1);
}

export function cartFrame(fill: number, frames: number): number {
  return Math.min(frames - 1, Math.max(0, Math.floor(fill * frames)));
}

export function cartX(fill: number): number {
  return 140 + Math.round(Math.min(1, Math.max(0, fill)) * 676);
}

export function gardenPlantRect(index: number): GameRect {
  return {
    id: `plant-${index}`,
    x: 176 + index * 120,
    y: 1456,
    width: 120,
    height: 230
  };
}

export function starshipPersistentRects(fill: number): GameRect[] {
  const ship = lanePoint(fill, STARSHIP_PATH);
  return [
    { id: "pilot", x: 8, y: 1388, width: 96, height: 160 },
    { id: "station", x: 8, y: 1544, width: 72, height: 96 },
    { id: "ship", x: ship.x, y: ship.y, width: 120, height: 64 },
    { id: "beacon", x: 992, y: 1572, width: 40, height: 68 },
    { id: "fuel", x: 16, y: 620, width: 48, height: 320 },
    { id: "hud", ...GAME_EDGE.hud }
  ];
}

export function gardenPersistentRects(): GameRect[] {
  return [
    { id: "gardener", x: 948, y: 1288, width: 120, height: 168 },
    { id: "planter", x: 176, y: 1576, width: 720, height: 80 },
    { id: "vine-left", x: 8, y: 420, width: 64, height: 1156 },
    { id: "vine-right", x: 1008, y: 420, width: 64, height: 1156 },
    ...[0, 1, 2, 3, 4, 5].map((index) => gardenPlantRect(index)),
    { id: "hud", ...GAME_EDGE.hud }
  ];
}

export function crystalPersistentRects(fill = 0): GameRect[] {
  return [
    { id: "wall-left", x: 0, y: 300, width: 96, height: 1240 },
    { id: "wall-right", x: 984, y: 300, width: 96, height: 1240 },
    { id: "explorer", x: 8, y: 1504, width: 96, height: 128 },
    { id: "track", x: 144, y: 1608, width: 792, height: 48 },
    { id: "cart", x: cartX(fill), y: 1548, width: 120, height: 96 },
    { id: "door", x: 936, y: 1508, width: 136, height: 160 },
    { id: "hud", ...GAME_EDGE.hud }
  ];
}

export function racePersistentRects(fill = 0): GameRect[] {
  const car = lanePoint(fill, RACE_PATH);
  return [
    { id: "rail-left", x: 8, y: 1504, width: 48, height: 176 },
    { id: "road", x: 144, y: 1584, width: 792, height: 64 },
    { id: "finish", x: 936, y: 1568, width: 144, height: 76 },
    { id: "car", x: car.x, y: car.y, width: 128, height: 56 },
    { id: "hud", ...GAME_EDGE.hud }
  ];
}

export function edgeOccupancyViolations(
  rects: readonly GameRect[],
  allowed: readonly { x: number; y: number; width: number; height: number }[] = []
): GameRect[] {
  return occupancyViolations(rects, allowed);
}
