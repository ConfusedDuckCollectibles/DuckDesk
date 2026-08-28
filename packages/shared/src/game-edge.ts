export const GAME_EDGE = {
  canvas: { width: 1080, height: 1920 },
  protectedCenter: { x: 170, y: 300, width: 740, height: 1240 },
  leftRail: { x: 0, y: 280, width: 144, height: 1408 },
  rightRail: { x: 936, y: 280, width: 144, height: 1408 },
  bottomDeck: { x: 144, y: 1544, width: 792, height: 144 },
  topAccent: { x: 150, y: 230, width: 780, height: 90 },
  footer: { x: 0, y: 1745, width: 1080, height: 175 },
  hud: { x: 0, y: 1688, width: 1080, height: 56 },
  plantBed: { x: 168, y: 1440, width: 744, height: 248 }
} as const;

export interface GameRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsOverlap(a: GameRect, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectContained(
  inner: GameRect,
  outer: { x: number; y: number; width: number; height: number }
): boolean {
  return inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height;
}

export function occupancyViolations(
  rects: readonly GameRect[],
  allowed: readonly { x: number; y: number; width: number; height: number }[] = []
): GameRect[] {
  return rects.filter((rect) => {
    const allowedHere = allowed.some((zone) => rectContained(rect, zone));
    if (rect.y + rect.height > GAME_EDGE.footer.y) {
      return true;
    }
    if (allowedHere) {
      return false;
    }
    return rectsOverlap(rect, GAME_EDGE.protectedCenter);
  });
}

export function lanePoint(fill: number, points: readonly { x: number; y: number }[]): { x: number; y: number } {
  const clamped = Math.min(1, Math.max(0, fill));
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  if (points.length === 1 || clamped <= 0) {
    return points[0] ?? { x: 0, y: 0 };
  }
  const scaled = clamped * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const start = points[index] ?? points[0];
  const end = points[index + 1] ?? start;
  return {
    x: Math.round(start.x + (end.x - start.x) * local),
    y: Math.round(start.y + (end.y - start.y) * local)
  };
}
