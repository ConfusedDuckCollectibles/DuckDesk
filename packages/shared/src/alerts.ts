export const ALERT_KINDS = ["sale", "bid", "action", "tip", "share"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];
export type AlertPlacement = "below_banner" | "upper" | "center" | "lower";
export type AlertSize = "compact" | "standard" | "large";
export type AlertEntrance = "rise" | "slide" | "pop" | "broadcast" | "none";
export type AlertTypography = "theme" | "modern" | "condensed" | "editorial";

export interface AlertVisualConfig {
  enabled: boolean;
  placement: AlertPlacement;
  size: AlertSize;
  durationMs: number;
  entrance: AlertEntrance;
  accent: string;
  typography: AlertTypography;
  mediaUrl?: string;
}

export type AlertVisualMap = Record<AlertKind, AlertVisualConfig>;

export const ALERT_DURATION_LIMITS: Record<AlertKind, { min: number; max: number; defaultMs: number }> = {
  sale: { min: 1_500, max: 8_000, defaultMs: 3_400 },
  bid: { min: 800, max: 4_000, defaultMs: 1_600 },
  action: { min: 800, max: 5_000, defaultMs: 2_200 },
  tip: { min: 1_500, max: 8_000, defaultMs: 3_200 },
  share: { min: 800, max: 5_000, defaultMs: 2_400 }
};

const themeAccent = "theme";

export const DEFAULT_ALERT_VISUALS: AlertVisualMap = {
  sale: defaultAlertVisual("sale"),
  bid: defaultAlertVisual("bid"),
  action: defaultAlertVisual("action"),
  tip: defaultAlertVisual("tip"),
  share: defaultAlertVisual("share")
};

export function defaultAlertVisual(kind: AlertKind): AlertVisualConfig {
  return {
    enabled: true,
    placement: "below_banner",
    size: "standard",
    durationMs: ALERT_DURATION_LIMITS[kind].defaultMs,
    entrance: "broadcast",
    accent: themeAccent,
    typography: "theme"
  };
}

export function alertKindFromEventType(type: "sale" | "bid" | "audience_action" | "tip" | "share"): AlertKind {
  return type === "audience_action" ? "action" : type;
}

export function isAlertKind(value: unknown): value is AlertKind {
  return value === "sale" || value === "bid" || value === "action" || value === "tip" || value === "share";
}

export function isAlertPlacement(value: unknown): value is AlertPlacement {
  return value === "below_banner" || value === "upper" || value === "center" || value === "lower";
}

export function isAlertSize(value: unknown): value is AlertSize {
  return value === "compact" || value === "standard" || value === "large";
}

export function isAlertEntrance(value: unknown): value is AlertEntrance {
  return value === "rise" || value === "slide" || value === "pop" || value === "broadcast" || value === "none";
}

export function isAlertTypography(value: unknown): value is AlertTypography {
  return value === "theme" || value === "modern" || value === "condensed" || value === "editorial";
}

export function usesThemeAlertArt(visual: AlertVisualConfig): boolean {
  return visual.typography === "theme" && (!visual.accent || visual.accent === themeAccent);
}

export function normalizeAlertVisual(kind: AlertKind, value: unknown): AlertVisualConfig {
  const fallback = defaultAlertVisual(kind);
  if (!isRecord(value)) {
    return fallback;
  }
  const durationMs = clampDuration(kind, value.durationMs, fallback.durationMs);
  const mediaUrl = sanitizeAlertMediaUrl(value.mediaUrl);
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : fallback.enabled,
    placement: isAlertPlacement(value.placement) ? value.placement : fallback.placement,
    size: isAlertSize(value.size) ? value.size : fallback.size,
    durationMs,
    entrance: isAlertEntrance(value.entrance) ? value.entrance : fallback.entrance,
    accent: sanitizeAlertAccent(value.accent, fallback.accent),
    typography: isAlertTypography(value.typography) ? value.typography : fallback.typography,
    ...(mediaUrl ? { mediaUrl } : {})
  };
}

export function normalizeAlertVisualMap(value: unknown): AlertVisualMap {
  const source = isRecord(value) ? value : {};
  return {
    sale: normalizeAlertVisual("sale", source.sale),
    bid: normalizeAlertVisual("bid", source.bid),
    action: normalizeAlertVisual("action", source.action),
    tip: normalizeAlertVisual("tip", source.tip),
    share: normalizeAlertVisual("share", source.share)
  };
}

export function patchAlertVisual(kind: AlertKind, current: AlertVisualMap, patch: unknown): AlertVisualMap {
  const next = normalizeAlertVisualMap(current);
  next[kind] = normalizeAlertVisual(kind, { ...next[kind], ...(isRecord(patch) ? patch : {}) });
  return next;
}

export function isAlertVisualMap(value: unknown): value is AlertVisualMap {
  if (!isRecord(value)) {
    return false;
  }
  return ALERT_KINDS.every((kind) => value[kind] === undefined || isRecord(value[kind]));
}

function clampDuration(kind: AlertKind, value: unknown, fallback: number): number {
  const limits = ALERT_DURATION_LIMITS[kind];
  const duration = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.round(Math.max(limits.min, Math.min(limits.max, duration)));
}

function sanitizeAlertAccent(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const accent = value.trim().toLowerCase();
  if (accent === "" || accent === themeAccent) {
    return themeAccent;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent)) {
    return accent;
  }
  return fallback;
}

export function sanitizeAlertMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const url = value.trim();
  if (!url || url.length > 500) {
    return undefined;
  }
  if (url.startsWith("/gifs/") || url.startsWith("/media/")) {
    return url.includes("..") ? undefined : url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return undefined;
    }
    if (!/\.(gif|webp|png|jpe?g)(?:$|[?#])/i.test(parsed.pathname)) {
      return undefined;
    }
    return parsed.href;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
