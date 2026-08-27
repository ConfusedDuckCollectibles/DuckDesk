import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_ALERT_VISUALS,
  isAddOnId,
  isAudioTheme,
  isGifPlacement,
  isGifSize,
  isOverlaySkin,
  isOverlayTheme,
  isSceneMode,
  normalizeAlertVisualMap,
  type AddOnId,
  type AlertVisualMap,
  type AudioTheme,
  type GifPlacement,
  type GifSize,
  type GoalConfig,
  type OverlaySkin,
  type OverlayTheme,
  type SceneMode
} from "@duck-desk/shared";

const maxProfiles = 20;
const maxFileBytes = 2 * 1024 * 1024;
const maxNameLength = 60;

export const emptyShowStats = {
  salesCount: 0,
  grossSales: 0,
  bidCount: 0,
  audienceActions: 0,
  tipCount: 0,
  tipTotal: 0,
  shareCount: 0
} as const;

export type ShowStats = {
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  tipCount: number;
  tipTotal: number;
  shareCount: number;
};

export type ShowLook = {
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
  soundVolume: number;
  audioTheme: AudioTheme;
  streamTitle: string;
  gifPlacement: GifPlacement;
  gifSize: GifSize;
  milestoneThresholds: number[];
  hypeMeterSeconds: number;
  promoBanners: string[];
  sceneMode: SceneMode;
  goals: GoalConfig[];
  auctionTimerSeconds: number;
  hideTopBanner: boolean;
  themeEffectsEnabled: boolean;
  alertVisuals: AlertVisualMap;
  framePreset: "theme" | "broadcast" | "none";
  reducedMotion: boolean;
};

export type ShowProfile = {
  version: 1;
  format: "duckdesk-profile";
  id: string;
  name: string;
  updatedAt: number;
  look: ShowLook;
};

export type ShowProfileSummary = {
  id: string;
  name: string;
  updatedAt: number;
};

export type ShowSessionReset = {
  stats: ShowStats;
  lastRealEventAt: 0;
  rejectedEventCount: 0;
  duplicateEventCount: 0;
  lastEventFingerprint: "";
  completedMilestones: number[];
  demoMode: false;
  jumbotronCameraEnabled: false;
  sceneMode: "none";
};

export function createShowSessionReset(): ShowSessionReset {
  return {
    stats: { ...emptyShowStats },
    lastRealEventAt: 0,
    rejectedEventCount: 0,
    duplicateEventCount: 0,
    lastEventFingerprint: "",
    completedMilestones: [],
    demoMode: false,
    jumbotronCameraEnabled: false,
    sceneMode: "none"
  };
}

export function sanitizeProfileName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxNameLength) || "Untitled look";
}

export function createShowProfile(name: string, look: ShowLook, now = Date.now()): ShowProfile {
  return {
    version: 1,
    format: "duckdesk-profile",
    id: randomUUID(),
    name: sanitizeProfileName(name),
    updatedAt: now,
    look: normalizeShowLook(look)
  };
}

export function upsertShowProfile(profiles: ShowProfile[], next: ShowProfile): ShowProfile[] {
  const existing = profiles.findIndex((profile) => profile.id === next.id || profile.name.toLowerCase() === next.name.toLowerCase());
  if (existing >= 0) {
    const merged = { ...next, id: profiles[existing].id };
    return [merged, ...profiles.filter((_, index) => index !== existing)].slice(0, maxProfiles);
  }
  return [next, ...profiles].slice(0, maxProfiles);
}

export function serializeProfileExport(profile: ShowProfile): ShowProfile {
  return {
    version: 1,
    format: "duckdesk-profile",
    id: profile.id,
    name: profile.name,
    updatedAt: profile.updatedAt,
    look: normalizeShowLook(profile.look)
  };
}

export function parseShowProfile(value: unknown): ShowProfile {
  if (!isRecord(value) || value.version !== 1 || value.format !== "duckdesk-profile") {
    throw new Error("That file is not a Duck Desk show profile.");
  }
  const name = typeof value.name === "string" ? sanitizeProfileName(value.name) : "Imported look";
  const id = typeof value.id === "string" && value.id.length <= 80 ? value.id : randomUUID();
  const updatedAt = typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) ? value.updatedAt : Date.now();
  return {
    version: 1,
    format: "duckdesk-profile",
    id,
    name,
    updatedAt,
    look: normalizeShowLook(value.look)
  };
}

export function loadShowProfileLibrary(filePath: string): { profiles: ShowProfile[]; quarantined: boolean } {
  try {
    return { profiles: readShowProfileLibrary(filePath), quarantined: false };
  } catch {
    try {
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, `${filePath}.invalid-${Date.now()}`);
      }
    } catch {
      // Keep starting even if the bad file cannot be moved.
    }
    return { profiles: [], quarantined: true };
  }
}

export function saveShowProfileLibrary(filePath: string, profiles: ShowProfile[]): void {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(temporaryPath, `${JSON.stringify({ version: 1, profiles: profiles.slice(0, maxProfiles) }, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

function readShowProfileLibrary(filePath: string): ShowProfile[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const stats = fs.statSync(filePath);
  if (!stats.isFile() || stats.size > maxFileBytes) {
    throw new Error("Show profile library exceeds its size limit.");
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.profiles)) {
    throw new Error("Show profile library is malformed.");
  }
  return parsed.profiles.map((entry) => {
    try {
      return parseShowProfile(entry);
    } catch {
      return null;
    }
  }).filter((value): value is ShowProfile => Boolean(value)).slice(0, maxProfiles);
}

export function normalizeShowLook(value: unknown): ShowLook {
  if (!isRecord(value)) {
    throw new Error("Show look is missing.");
  }
  const theme = isOverlayTheme(value.theme) ? value.theme : "neon";
  const skin = isOverlaySkin(value.skin) ? value.skin : "none";
  const addOns = Array.isArray(value.addOns) ? value.addOns.filter(isAddOnId).slice(0, 24) : [];
  const goals = Array.isArray(value.goals) ? value.goals.filter(isGoalConfig).slice(0, 8) : [];
  const promoBanners = Array.isArray(value.promoBanners)
    ? value.promoBanners.filter((banner): banner is string => typeof banner === "string").map((banner) => banner.trim().slice(0, 80)).filter(Boolean).slice(0, 8)
    : [];
  const milestoneThresholds = Array.isArray(value.milestoneThresholds)
    ? value.milestoneThresholds.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry) && entry > 0).slice(0, 8)
    : [];
  return {
    theme,
    skin,
    addOns,
    soundsEnabled: value.soundsEnabled !== false,
    soundVolume: clampNumber(value.soundVolume, 0, 1, 0.75),
    audioTheme: isAudioTheme(value.audioTheme) ? value.audioTheme : "neon_pulse",
    streamTitle: typeof value.streamTitle === "string" ? value.streamTitle.trim().slice(0, 88) : "",
    gifPlacement: isGifPlacement(value.gifPlacement) ? value.gifPlacement : "center",
    gifSize: isGifSize(value.gifSize) ? value.gifSize : "medium",
    milestoneThresholds,
    hypeMeterSeconds: Math.round(clampNumber(value.hypeMeterSeconds, 5, 180, 30)),
    promoBanners,
    sceneMode: isSceneMode(value.sceneMode) ? value.sceneMode : "none",
    goals,
    auctionTimerSeconds: Math.round(clampNumber(value.auctionTimerSeconds, 5, 300, 45)),
    hideTopBanner: value.hideTopBanner === true,
    themeEffectsEnabled: value.themeEffectsEnabled !== false,
    alertVisuals: normalizeAlertVisualMap(value.alertVisuals ?? DEFAULT_ALERT_VISUALS),
    framePreset: value.framePreset === "broadcast" || value.framePreset === "none" ? value.framePreset : "theme",
    reducedMotion: value.reducedMotion === true
  };
}

function isGoalConfig(value: unknown): value is GoalConfig {
  return isRecord(value)
    && (value.kind === "sales" || value.kind === "orders" || value.kind === "hype" || value.kind === "follows")
    && typeof value.target === "number"
    && Number.isFinite(value.target)
    && typeof value.label === "string";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
