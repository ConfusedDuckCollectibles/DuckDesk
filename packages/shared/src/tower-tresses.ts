import { GAME_ACTION_CLIP_MS, type GameAction } from "./games.js";

export interface TowerRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TowerClip {
  princessFrames: readonly number[];
  princeFrames: readonly number[];
    extra: "none" | "bird" | "comb" | "marker" | "rescue" | "win";
  durationMs: number;
  loop: boolean;
  holdFrame: number;
}

export const TOWER_LAYOUT = {
  canvas: { width: 1080, height: 1920 },
  protectedCenter: { x: 170, y: 300, width: 740, height: 1240 },
  leftRail: { x: 0, y: 280, width: 144, height: 1360 },
  rightRail: { x: 936, y: 280, width: 144, height: 1360 },
  bottomDeck: { x: 144, y: 1544, width: 786, height: 200 },
  topAccent: { x: 150, y: 230, width: 780, height: 90 },
  footer: { x: 0, y: 1745, width: 1080, height: 175 },
  wall: { x: 0, y: 280, width: 144, height: 1264 },
  roof: { x: 8, y: 280, width: 128, height: 96 },
  princess: { x: 0, y: 368, width: 144, height: 224 },
  scalp: { x: 80, y: 580 },
  braid: {
    x: 64,
    width: 32,
    rootY: 572,
    rootHeight: 48,
    tileHeight: 32,
    tasselHeight: 64,
    overlap: 8,
    courtyardY: 1544,
    step: 16
  },
  courtyard: { x: 0, y: 1544, width: 280, height: 200 },
  prince: { x: 156, y: 1576, width: 92, height: 160 },
  hud: { x: 0, y: 1688, width: 1080, height: 56 },
  goal: { x: 1008, y: 360, width: 64, height: 320 },
  bird: { y: 248, height: 56, width: 80, startX: 168, travel: 680 },
  comb: { x: 56, startY: 320, travel: 168, width: 48, height: 48 }
} as const;

export const TOWER_TRESSES_CLIPS: Record<GameAction, TowerClip> = {
  idle: {
    princessFrames: [0, 1, 0, 4, 0, 1],
    princeFrames: [0, 1, 0, 1, 0, 1],
    extra: "none",
    durationMs: GAME_ACTION_CLIP_MS.idle,
    loop: true,
    holdFrame: 0
  },
  bid: {
    princessFrames: [0, 2, 3, 3, 2, 3],
    princeFrames: [0, 1, 0, 1, 0, 1],
    extra: "none",
    durationMs: GAME_ACTION_CLIP_MS.bid,
    loop: false,
    holdFrame: 3
  },
  audience: {
    princessFrames: [1, 4, 4, 4, 1, 4],
    princeFrames: [1, 0, 1, 0, 1, 0],
    extra: "none",
    durationMs: GAME_ACTION_CLIP_MS.audience,
    loop: false,
    holdFrame: 2
  },
  share: {
    princessFrames: [4, 4, 1, 4, 4, 1, 4, 1],
    princeFrames: [0, 1, 0, 1, 0, 1, 0, 1],
    extra: "bird",
    durationMs: GAME_ACTION_CLIP_MS.share,
    loop: false,
    holdFrame: 3
  },
  tip: {
    princessFrames: [2, 3, 3, 2, 3, 3, 2, 3],
    princeFrames: [0, 1, 0, 1, 0, 1, 0, 1],
    extra: "comb",
    durationMs: GAME_ACTION_CLIP_MS.tip,
    loop: false,
    holdFrame: 4
  },
  sale: {
    princessFrames: [5, 5, 4, 5, 5, 4, 5, 5, 4, 5],
    princeFrames: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
    extra: "none",
    durationMs: GAME_ACTION_CLIP_MS.sale,
    loop: false,
    holdFrame: 0
  },
  level_up: {
    princessFrames: [5, 5, 6, 5, 6, 5, 6, 5, 6, 6, 5, 6, 5, 6, 6, 6],
    princeFrames: [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 7, 7, 7, 7, 7, 7],
    extra: "rescue",
    durationMs: GAME_ACTION_CLIP_MS.level_up,
    loop: false,
    holdFrame: 10
  },
  win: {
    princessFrames: [6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 6, 6, 6],
    princeFrames: [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    extra: "win",
    durationMs: GAME_ACTION_CLIP_MS.win,
    loop: false,
    holdFrame: 11
  }
};

export function journeyRatioForProgress(level: number, progress: number, target: number): number {
  const local = Math.min(1, Math.max(0, progress / Math.max(1, target)));
  return Math.min(1, (Math.max(1, level) - 1 + local) / 100);
}

export function towerBraidFill(
  progress: number,
  target: number,
  celebration: "none" | "level_up" | "win" = "none"
): number {
  if (celebration === "level_up" || celebration === "win") {
    return 1;
  }
  return Math.min(1, Math.max(0, progress / Math.max(1, target)));
}

export function towerBraidHeight(fill: number): number {
  const { rootY, rootHeight, tasselHeight, overlap, courtyardY, step } = TOWER_LAYOUT.braid;
  const min = rootHeight + tasselHeight - overlap;
  const max = courtyardY - rootY;
  const span = max - min;
  const clamped = Math.min(1, Math.max(0, fill));
  if (clamped <= 0) {
    return min;
  }
  const extra = Math.max(step, Math.round((clamped * span) / step) * step);
  return Math.min(max, min + extra);
}

export function towerBraidSegments(journeyRatio: number): TowerRect[] {
  const braid = TOWER_LAYOUT.braid;
  const height = towerBraidHeight(journeyRatio);
  const root: TowerRect = {
    id: "braid-root",
    x: braid.x,
    y: braid.rootY,
    width: braid.width,
    height: braid.rootHeight
  };
  const runHeight = Math.max(0, height - braid.rootHeight - braid.tasselHeight + braid.overlap);
  const tileCount = Math.max(1, Math.ceil(runHeight / (braid.tileHeight - braid.overlap)));
  const tiles: TowerRect[] = [];
  let y = braid.rootY + braid.rootHeight - braid.overlap;
  for (let index = 0; index < tileCount; index += 1) {
    tiles.push({
      id: `braid-tile-${index}`,
      x: braid.x,
      y,
      width: braid.width,
      height: braid.tileHeight
    });
    y += braid.tileHeight - braid.overlap;
  }
  const tasselY = braid.rootY + height - braid.tasselHeight;
  const tassel: TowerRect = {
    id: "braid-tassel",
    x: braid.x - 16,
    y: tasselY,
    width: 64,
    height: braid.tasselHeight
  };
  return [root, ...tiles, tassel];
}

export function towerPersistentRects(journeyRatio: number): TowerRect[] {
  const { wall, roof, princess, courtyard, prince, hud, goal } = TOWER_LAYOUT;
  return [
    { id: "wall", ...wall },
    { id: "roof", ...roof },
    { id: "princess", ...princess },
    ...towerBraidSegments(journeyRatio),
    { id: "courtyard", ...courtyard },
    { id: "prince", ...prince },
    { id: "hud", ...hud },
    { id: "goal", ...goal }
  ];
}

export function rectsOverlap(a: TowerRect, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function towerOccupancyViolations(journeyRatio: number): TowerRect[] {
  const protectedCenter = TOWER_LAYOUT.protectedCenter;
  const footer = TOWER_LAYOUT.footer;
  return towerPersistentRects(journeyRatio).filter((rect) => {
    return rectsOverlap(rect, protectedCenter) || rect.y + rect.height > footer.y;
  });
}

export function reducedMotionHoldFrame(action: GameAction): number {
  return TOWER_TRESSES_CLIPS[action].holdFrame;
}

export function birdRect(frameIndex: number, frameCount: number): TowerRect {
  const { bird } = TOWER_LAYOUT;
  const t = frameCount <= 1 ? 0 : Math.min(1, frameIndex / (frameCount - 1));
  return {
    id: "bird",
    x: bird.startX + Math.round(t * bird.travel),
    y: bird.y,
    width: bird.width,
    height: bird.height
  };
}

export function combRect(frameIndex: number, frameCount: number): TowerRect {
  const { comb } = TOWER_LAYOUT;
  const t = frameCount <= 1 ? 0 : Math.min(1, frameIndex / (frameCount - 1));
  return {
    id: "comb",
    x: comb.x,
    y: comb.startY + Math.round(t * comb.travel),
    width: comb.width,
    height: comb.height
  };
}

export function clipFrameIndex(elapsedMs: number, frameCount: number, durationMs: number, loop: boolean): number {
  const count = Math.max(1, frameCount);
  if (count <= 1 || durationMs <= 0) {
    return 0;
  }
  const frameMs = Math.max(80, Math.floor(durationMs / count));
  const index = Math.floor(Math.max(0, elapsedMs) / frameMs);
  return loop ? index % count : Math.min(count - 1, index);
}

export function princeSaleOffset(frameIndex: number): number {
  return Math.min(96, Math.floor(frameIndex / 2) * 32);
}

export function princeRescueBox(progress: number): TowerRect {
  const startY = TOWER_LAYOUT.prince.y;
  const endY = TOWER_LAYOUT.princess.y + 8;
  const climb = Math.min(1, Math.max(0, progress) / 0.7);
  return {
    id: "prince-rescue",
    x: 16,
    y: Math.round(startY + (endY - startY) * climb),
    width: 128,
    height: 224
  };
}
