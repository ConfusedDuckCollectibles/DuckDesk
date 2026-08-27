import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ZipFile } from "yazl";

export interface HealthCheck {
  id: string;
  label: string;
  ready: boolean;
  pending?: boolean;
  detail: string;
  action?: string;
}

export interface HealthSnapshot {
  capturedAt: number;
  appVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  signed: false;
  notarized: false;
  installerType: "development" | "packaged";
  checks: HealthCheck[];
  update: UpdateStatus;
}

export interface UpdateStatus {
  currentVersion: string;
  latestVersion?: string;
  notesUrl?: string;
  status: "unknown" | "current" | "available" | "error";
  detail: string;
}

export interface DiagnosticEvent {
  at: number;
  kind: string;
  detail: string;
}

const maxRing = 200;

export class DiagnosticRing {
  private events: DiagnosticEvent[] = [];

  push(kind: string, detail: string, at = Date.now()): void {
    this.events.push({ at, kind, detail: redactText(detail) });
    if (this.events.length > maxRing) {
      this.events = this.events.slice(-maxRing);
    }
  }

  list(): DiagnosticEvent[] {
    return [...this.events];
  }
}

export function redactText(value: string, homeDir = os.homedir()): string {
  return value
    .replace(/([?&]token=)[^&#\s]+/gi, "$1[redacted]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(homeDir.replaceAll("\\", "\\\\"), "~")
    .replace(homeDir, "~");
}

export function redactSettingsSummary(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) {
    return { valid: false };
  }
  const customSounds = isRecord(input.customSounds)
    ? Object.fromEntries(Object.keys(input.customSounds).map((kind) => [kind, true]))
    : {};
  return {
    version: input.version ?? 1,
    theme: input.theme,
    skin: input.skin,
    addOns: Array.isArray(input.addOns) ? input.addOns : [],
    soundsEnabled: input.soundsEnabled,
    audioTheme: input.audioTheme,
    customSoundKinds: customSounds,
    gifCount: Array.isArray(input.customGifs) ? input.customGifs.length : 0,
    sceneMode: input.sceneMode,
    hideTopBanner: input.hideTopBanner,
    themeEffectsEnabled: input.themeEffectsEnabled,
    firstRunComplete: input.firstRunComplete
  };
}

export function compareVersions(current: string, latest: string): "current" | "available" {
  const left = parseVersion(current);
  const right = parseVersion(latest);
  for (let index = 0; index < 3; index += 1) {
    if ((right[index] ?? 0) > (left[index] ?? 0)) {
      return "available";
    }
    if ((right[index] ?? 0) < (left[index] ?? 0)) {
      return "current";
    }
  }
  return "current";
}

export async function createDiagnosticsArchive(files: Array<{ name: string; data: string | Buffer }>): Promise<Buffer> {
  const zipfile = new ZipFile();
  zipfile.addBuffer(Buffer.from(privacySummary()), "privacy-summary.txt");
  for (const file of files) {
    zipfile.addBuffer(Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data), file.name);
  }
  const chunks: Buffer[] = [];
  zipfile.outputStream.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  return await new Promise((resolve, reject) => {
    zipfile.outputStream.on("error", reject);
    zipfile.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    zipfile.end();
  });
}

export function checksum(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function dailyLogName(now = new Date()): string {
  return `Duck Desk-${now.toISOString().slice(0, 10)}.log`;
}

export function privacySummary(): string {
  return [
    "Duck Desk diagnostics privacy summary",
    "",
    "This ZIP includes app version, platform, health checks, a redacted settings summary,",
    "recent rotating logs, OBS source status text, extension heartbeat timing, and pack/rehearsal",
    "storage write results.",
    "",
    "It does not include event message text, buyer names, GIF URLs with query tokens,",
    "custom audio files, OBS passwords, Remote Deck pairing tokens, or full home directory paths."
  ].join("\n");
}

function parseVersion(value: string): number[] {
  const core = value.replace(/^v/i, "").split("-")[0] ?? "0";
  return core.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveInside(root: string, relativePath: string): string {
  const destination = path.resolve(root, relativePath);
  const rootResolved = path.resolve(root);
  if (destination !== rootResolved && !destination.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error("Path escaped its directory.");
  }
  return destination;
}
