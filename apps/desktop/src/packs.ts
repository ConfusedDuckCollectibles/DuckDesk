import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yauzl from "yauzl";
import { ZipFile } from "yazl";
import {
  isOverlaySkin,
  isOverlayTheme,
  isSceneMode,
  isSoundKind,
  normalizeAlertVisualMap,
  type AddOnId,
  type AlertVisualMap,
  type GoalConfig,
  type OverlaySkin,
  type OverlayTheme,
  type SceneMode,
  type SoundKind
} from "@duck-desk/shared";

export const PACK_PREVIEW_FALLBACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export const PACK_LIMITS = {
  maxCompressedBytes: 25 * 1024 * 1024,
  maxExtractedBytes: 75 * 1024 * 1024,
  maxFiles: 100,
  maxAssetBytes: 20 * 1024 * 1024
} as const;

export const PACK_LICENSES = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "Unlicense"
] as const;

export const PACK_FRAME_PRESETS = ["theme", "broadcast", "none"] as const;
export const PACK_TYPOGRAPHY_PRESETS = ["theme", "modern", "condensed", "editorial"] as const;

export type PackLicense = (typeof PACK_LICENSES)[number];
export type PackFramePreset = (typeof PACK_FRAME_PRESETS)[number];
export type PackTypographyPreset = (typeof PACK_TYPOGRAPHY_PRESETS)[number];
export type PackAssetKind = "image" | "audio";

export interface PackAssetDeclaration {
  path: string;
  sha256: string;
  kind: PackAssetKind;
  sound?: SoundKind;
  label?: string;
}

export interface PackSetup {
  theme?: OverlayTheme;
  skin?: OverlaySkin;
  framePreset?: PackFramePreset;
  typographyPreset?: PackTypographyPreset;
  reducedMotion?: boolean;
  sceneMode?: SceneMode;
  promoBanners?: string[];
  goals?: GoalConfig[];
  alerts?: AlertVisualMap;
}

export interface PackManifest {
  version: 1;
  format: "duckpack";
  name: string;
  author: string;
  packVersion: string;
  description: string;
  license: PackLicense;
  projectUrl?: string;
  preview: string;
  setup: PackSetup;
  assets: PackAssetDeclaration[];
}

export interface PackChange {
  label: string;
  detail: string;
}

export interface InspectedPack {
  manifest: PackManifest;
  files: Map<string, Buffer>;
  review: PackChange[];
}

const safeFileName = /^[a-zA-Z0-9._-]+$/;
const hexHash = /^[a-f0-9]{64}$/;

export function isPackLicense(value: unknown): value is PackLicense {
  return typeof value === "string" && (PACK_LICENSES as readonly string[]).includes(value);
}

export async function inspectDuckPackArchive(archive: Buffer): Promise<InspectedPack> {
  if (archive.length > PACK_LIMITS.maxCompressedBytes) {
    throw new Error("Pack is larger than the 25 MB compressed limit.");
  }
  const files = await readZipEntries(archive);
  return inspectPackFiles(files);
}

export function inspectDuckPackDirectory(directory: string): InspectedPack {
  const files = new Map<string, Buffer>();
  const manifestPath = path.join(directory, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Pack folder is missing manifest.json.");
  }
  addDirectoryFile(files, directory, "manifest.json");
  const previewCandidates = ["preview.png", "preview.jpg", "preview.jpeg", "preview.webp"];
  for (const preview of previewCandidates) {
    if (fs.existsSync(path.join(directory, preview))) {
      addDirectoryFile(files, directory, preview);
    }
  }
  const assetsDir = path.join(directory, "assets");
  if (fs.existsSync(assetsDir)) {
    for (const name of fs.readdirSync(assetsDir)) {
      addDirectoryFile(files, directory, path.posix.join("assets", name));
    }
  }
  return inspectPackFiles(files);
}

export async function inspectDuckPackPath(targetPath: string): Promise<InspectedPack> {
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    return inspectDuckPackDirectory(targetPath);
  }
  if (!stats.isFile() || stats.size > PACK_LIMITS.maxCompressedBytes) {
    throw new Error("Pack is larger than the 25 MB compressed limit.");
  }
  return inspectDuckPackArchive(fs.readFileSync(targetPath));
}

export async function createDuckPackArchive(files: Array<{ name: string; data: Buffer }>): Promise<Buffer> {
  const zipfile = new ZipFile();
  for (const file of files) {
    zipfile.addBuffer(file.data, file.name);
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

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sanitizePackName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled Pack";
}

function inspectPackFiles(files: Map<string, Buffer>): InspectedPack {
  if (files.size > PACK_LIMITS.maxFiles) {
    throw new Error("Pack contains too many files.");
  }
  const manifestBuffer = files.get("manifest.json");
  if (!manifestBuffer) {
    throw new Error("Pack is missing manifest.json.");
  }
  if (detectFileKind(manifestBuffer) !== "json") {
    throw new Error("manifest.json is not safe JSON.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestBuffer.toString("utf8"));
  } catch {
    throw new Error("manifest.json is malformed.");
  }
  const manifest = normalizeManifest(parsed);
  const declared = new Map(manifest.assets.map((asset) => [asset.path, asset]));
  if (!declared.has(manifest.preview)) {
    throw new Error("Pack must declare a hash for the preview image.");
  }
  for (const [filePath, buffer] of files) {
    if (filePath === "manifest.json") {
      continue;
    }
    const asset = declared.get(filePath);
    if (!asset) {
      throw new Error(`Pack contains undeclared file ${filePath}.`);
    }
    if (sha256(buffer) !== asset.sha256) {
      throw new Error(`Hash mismatch for ${filePath}.`);
    }
    assertAssetMatchesBytes(asset, buffer);
  }
  for (const asset of manifest.assets) {
    if (asset.path === "manifest.json") {
      throw new Error("manifest.json is not a hashed asset; omit it from assets.");
    }
    if (!files.has(asset.path)) {
      throw new Error(`Pack is missing declared file ${asset.path}.`);
    }
  }
  return {
    manifest,
    files,
    review: describePackChanges(manifest)
  };
}

export function describePackChanges(manifest: PackManifest): PackChange[] {
  const changes: PackChange[] = [];
  if (manifest.setup.theme) {
    changes.push({ label: "Theme", detail: manifest.setup.theme });
  }
  if (manifest.setup.skin && manifest.setup.skin !== "none") {
    changes.push({ label: "Skin", detail: manifest.setup.skin });
  }
  if (manifest.setup.framePreset) {
    changes.push({ label: "Frame", detail: manifest.setup.framePreset });
  }
  if (manifest.setup.typographyPreset) {
    changes.push({ label: "Typography", detail: manifest.setup.typographyPreset });
  }
  if (manifest.setup.reducedMotion) {
    changes.push({ label: "Motion", detail: "Prefer reduced motion" });
  }
  if (manifest.setup.sceneMode && manifest.setup.sceneMode !== "none") {
    changes.push({ label: "Scene", detail: manifest.setup.sceneMode });
  }
  if (manifest.setup.promoBanners?.length) {
    changes.push({ label: "Promo banners", detail: `${manifest.setup.promoBanners.length} messages` });
  }
  if (manifest.setup.goals?.length) {
    changes.push({ label: "Goals", detail: `${manifest.setup.goals.length} widgets` });
  }
  if (manifest.setup.alerts) {
    changes.push({ label: "Alert studio", detail: "Custom event visuals" });
  }
  for (const asset of manifest.assets) {
    if (asset.sound) {
      changes.push({ label: "Sound", detail: `${asset.sound} replacement` });
    } else if (asset.kind === "image" && asset.path.startsWith("assets/")) {
      changes.push({ label: "GIF library", detail: asset.label || asset.path });
    }
  }
  return changes;
}

export function normalizeManifest(value: unknown): PackManifest {
  if (!isRecord(value) || value.version !== 1 || value.format !== "duckpack") {
    throw new Error("Unsupported or missing Duckpack version.");
  }
  if (typeof value.name !== "string" || typeof value.author !== "string" || typeof value.description !== "string"
    || typeof value.packVersion !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(value.packVersion)
    || !isPackLicense(value.license) || typeof value.preview !== "string") {
    throw new Error("Pack manifest is missing required identity fields or uses an unsupported license.");
  }
  const preview = normalizePackPath(value.preview);
  if (preview !== "preview.png" && preview !== "preview.jpg" && preview !== "preview.jpeg" && preview !== "preview.webp") {
    throw new Error("Preview image must be preview.png, preview.jpg, or preview.webp.");
  }
  const projectUrl = typeof value.projectUrl === "string" ? sanitizeProjectUrl(value.projectUrl) : undefined;
  const assets = normalizeAssets(value.assets);
  return {
    version: 1,
    format: "duckpack",
    name: sanitizePackName(value.name),
    author: sanitizePackName(value.author),
    packVersion: value.packVersion,
    description: value.description.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 500),
    license: value.license,
    ...(projectUrl ? { projectUrl } : {}),
    preview,
    setup: normalizeSetup(value.setup),
    assets
  };
}

function normalizeSetup(value: unknown): PackSetup {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw new Error("Pack setup must be an object.");
  }
  const setup: PackSetup = {};
  if (value.theme !== undefined) {
    if (!isOverlayTheme(value.theme)) {
      throw new Error("Pack theme is not an allowed overlay theme.");
    }
    setup.theme = value.theme;
  }
  if (value.skin !== undefined) {
    if (!isOverlaySkin(value.skin)) {
      throw new Error("Pack skin is not an allowed overlay skin.");
    }
    setup.skin = value.skin;
  }
  if (value.framePreset !== undefined) {
    if (!(PACK_FRAME_PRESETS as readonly string[]).includes(value.framePreset as string)) {
      throw new Error("Pack frame preset is not on the app allowlist.");
    }
    setup.framePreset = value.framePreset as PackFramePreset;
  }
  if (value.typographyPreset !== undefined) {
    if (!(PACK_TYPOGRAPHY_PRESETS as readonly string[]).includes(value.typographyPreset as string)) {
      throw new Error("Pack typography preset is not on the app allowlist.");
    }
    setup.typographyPreset = value.typographyPreset as PackTypographyPreset;
  }
  if (value.reducedMotion !== undefined) {
    if (typeof value.reducedMotion !== "boolean") {
      throw new Error("Pack reduced-motion flag must be boolean.");
    }
    setup.reducedMotion = value.reducedMotion;
  }
  if (value.sceneMode !== undefined) {
    if (!isSceneMode(value.sceneMode)) {
      throw new Error("Pack scene is not an allowed scene mode.");
    }
    setup.sceneMode = value.sceneMode;
  }
  if (value.promoBanners !== undefined) {
    if (!Array.isArray(value.promoBanners) || !value.promoBanners.every((item) => typeof item === "string")) {
      throw new Error("Pack promo banners are invalid.");
    }
    setup.promoBanners = value.promoBanners.map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 6);
  }
  if (value.goals !== undefined) {
    if (!Array.isArray(value.goals)) {
      throw new Error("Pack goals are invalid.");
    }
    setup.goals = value.goals.filter((goal): goal is GoalConfig => (
      isRecord(goal)
      && (goal.kind === "sales" || goal.kind === "orders" || goal.kind === "hype" || goal.kind === "follows")
      && typeof goal.target === "number"
      && Number.isFinite(goal.target)
      && goal.target > 0
      && typeof goal.label === "string"
    )).map((goal) => ({
      kind: goal.kind,
      target: Math.round(goal.target),
      label: goal.label.trim().slice(0, 32) || "Goal"
    })).slice(0, 4);
  }
  if (value.alerts !== undefined) {
    setup.alerts = normalizeAlertVisualMap(value.alerts);
  }
  return setup;
}

function normalizeAssets(value: unknown): PackAssetDeclaration[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > PACK_LIMITS.maxFiles) {
    throw new Error("Pack must declare between 1 and 100 hashed assets.");
  }
  const seen = new Set<string>();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.path !== "string" || typeof item.sha256 !== "string" || !hexHash.test(item.sha256)
      || (item.kind !== "image" && item.kind !== "audio")) {
      throw new Error("Pack asset declarations are invalid.");
    }
    const assetPath = normalizePackPath(item.path);
    if (seen.has(assetPath)) {
      throw new Error(`Pack declares duplicate path ${assetPath}.`);
    }
    seen.add(assetPath);
    if (assetPath === "manifest.json") {
      throw new Error("manifest.json is not a hashed asset; omit it from assets.");
    }
    const sound = item.sound === undefined ? undefined : isSoundKind(item.sound) ? item.sound : null;
    if (sound === null) {
      throw new Error("Pack audio assets must use a known sound kind.");
    }
    if (item.kind === "audio" && !sound) {
      throw new Error("Audio assets must name a sale, bid, action, tip, or share sound.");
    }
    if (item.kind === "image" && sound) {
      throw new Error("Image assets cannot be assigned as event sounds.");
    }
    return {
      path: assetPath,
      sha256: item.sha256,
      kind: item.kind,
      ...(sound ? { sound } : {}),
      ...(typeof item.label === "string" ? { label: item.label.trim().slice(0, 40) } : {})
    };
  });
}

function normalizePackPath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..") || normalized.includes(":")) {
    throw new Error("Pack paths must be relative and cannot contain ..");
  }
  const parts = normalized.split("/");
  if (parts.some((part) => !safeFileName.test(part))) {
    throw new Error("Pack file names may only use letters, numbers, dots, underscores, and hyphens.");
  }
  if (normalized !== "manifest.json" && !normalized.startsWith("preview.") && !normalized.startsWith("assets/")) {
    throw new Error("Pack files must be manifest.json, a preview image, or assets/*.");
  }
  if (parts.length > 2) {
    throw new Error("Pack assets cannot be nested more than one folder deep.");
  }
  return normalized;
}

function assertAssetMatchesBytes(asset: PackAssetDeclaration, buffer: Buffer): void {
  if (buffer.length > PACK_LIMITS.maxAssetBytes) {
    throw new Error(`${asset.path} exceeds the 20 MB asset limit.`);
  }
  const kind = detectFileKind(buffer);
  if (asset.path === "manifest.json") {
    if (kind !== "json") {
      throw new Error("manifest.json failed JSON signature checks.");
    }
    return;
  }
  if (asset.kind === "image" && kind !== "png" && kind !== "jpeg" && kind !== "gif" && kind !== "webp") {
    throw new Error(`${asset.path} is not a PNG, JPEG, GIF, or WebP file.`);
  }
  if (asset.kind === "audio" && kind !== "wav" && kind !== "mp3" && kind !== "m4a") {
    throw new Error(`${asset.path} is not a WAV, MP3, or M4A file.`);
  }
  const extension = path.posix.extname(asset.path).toLowerCase();
  const expected: Record<string, string[]> = {
    png: [".png"],
    jpeg: [".jpg", ".jpeg"],
    gif: [".gif"],
    webp: [".webp"],
    wav: [".wav"],
    mp3: [".mp3"],
    m4a: [".m4a"],
    json: [".json"]
  };
  if (!kind || !expected[kind]?.includes(extension)) {
    throw new Error(`${asset.path} file signature does not match its extension.`);
  }
}

export function detectFileKind(buffer: Buffer): "png" | "jpeg" | "gif" | "webp" | "wav" | "mp3" | "m4a" | "json" | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a")) {
    return "gif";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE") {
    return "wav";
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "ID3") {
    return "mp3";
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return "mp3";
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return "m4a";
  }
  const trimmed = buffer.toString("utf8").trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return "json";
      }
    } catch {
      return null;
    }
  }
  return null;
}

function addDirectoryFile(files: Map<string, Buffer>, directory: string, relativePath: string): void {
  const absolute = path.join(directory, ...relativePath.split("/"));
  const stats = fs.statSync(absolute);
  if (!stats.isFile() || stats.size > PACK_LIMITS.maxAssetBytes) {
    throw new Error(`${relativePath} exceeds the 20 MB asset limit.`);
  }
  files.set(relativePath, fs.readFileSync(absolute));
}

async function readZipEntries(archive: Buffer): Promise<Map<string, Buffer>> {
  const zipfile = await openZipBuffer(archive);
  if (zipfile.entryCount > PACK_LIMITS.maxFiles) {
    zipfile.close();
    throw new Error("Pack contains too many files.");
  }
  const files = new Map<string, Buffer>();
  let extractedBytes = 0;
  return await new Promise((resolve, reject) => {
    const fail = (error: Error): void => {
      zipfile.close();
      reject(error);
    };
    zipfile.on("error", (error) => fail(error instanceof Error ? error : new Error(String(error))));
    zipfile.on("end", () => resolve(files));
    zipfile.on("entry", (entry) => {
      void readZipEntry(zipfile, entry, files, extractedBytes)
        .then((nextTotal) => {
          extractedBytes = nextTotal;
          zipfile.readEntry();
        })
        .catch(fail);
    });
    zipfile.readEntry();
  });
}

async function readZipEntry(
  zipfile: yauzl.ZipFile,
  entry: yauzl.Entry,
  files: Map<string, Buffer>,
  extractedBytes: number
): Promise<number> {
  const name = entry.fileName.replaceAll("\\", "/");
  if (name.endsWith("/")) {
    return extractedBytes;
  }
  if (entry.isEncrypted() || (entry.generalPurposeBitFlag & 0x1) !== 0) {
    throw new Error("Encrypted pack entries are not allowed.");
  }
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    throw new Error("Pack uses an unsupported compression method.");
  }
  if (isZipSymlink(entry)) {
    throw new Error("Pack cannot contain symbolic links.");
  }
  const normalized = normalizePackPath(name);
  if (files.has(normalized)) {
    throw new Error(`Pack contains duplicate path ${normalized}.`);
  }
  if (entry.uncompressedSize > PACK_LIMITS.maxAssetBytes) {
    throw new Error(`${normalized} exceeds the 20 MB asset limit.`);
  }
  const nextTotal = extractedBytes + entry.uncompressedSize;
  if (nextTotal > PACK_LIMITS.maxExtractedBytes) {
    throw new Error("Pack exceeds the 75 MB extracted size limit.");
  }
  const buffer = await readEntryBuffer(zipfile, entry);
  files.set(normalized, buffer);
  return nextTotal;
}

function isZipSymlink(entry: yauzl.Entry): boolean {
  const unixType = (entry.externalFileAttributes >> 16) & 0xf000;
  return unixType === 0xa000;
}

function openZipBuffer(archive: Buffer): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(archive, { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (error, zipfile) => {
      if (error || !zipfile) {
        reject(error ?? new Error("Unable to open pack archive."));
        return;
      }
      resolve(zipfile);
    });
  });
}

function readEntryBuffer(zipfile: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new Error("Unable to read pack entry."));
        return;
      }
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

function sanitizeProjectUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.href.slice(0, 200);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const PACK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPackId(value: unknown): value is string {
  return typeof value === "string" && PACK_ID_PATTERN.test(value);
}

export interface InstalledPackRecord {
  id: string;
  installedAt: number;
  name: string;
  author: string;
  packVersion: string;
  description: string;
  license: PackLicense;
  projectUrl?: string;
  preview: string;
}

export interface PackApplyTarget {
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  alertVisuals: AlertVisualMap;
  promoBanners: string[];
  goals: GoalConfig[];
  sceneMode: SceneMode;
  framePreset: PackFramePreset;
  reducedMotion: boolean;
}

export function assemblePackFiles(
  identity: {
    name: string;
    author: string;
    packVersion: string;
    description: string;
    license: PackLicense;
    projectUrl?: string;
    preview: string;
    setup: PackSetup;
  },
  assets: Array<{ path: string; data: Buffer; kind: PackAssetKind; sound?: SoundKind; label?: string }>
): { manifest: PackManifest; files: Array<{ name: string; data: Buffer }> } {
  const hashedAssets: PackAssetDeclaration[] = assets.map((asset) => ({
    path: normalizePackPath(asset.path),
    sha256: sha256(asset.data),
    kind: asset.kind,
    ...(asset.sound ? { sound: asset.sound } : {}),
    ...(asset.label ? { label: asset.label } : {})
  }));
  const manifest = normalizeManifest({
    version: 1,
    format: "duckpack",
    ...identity,
    assets: hashedAssets
  });
  return {
    manifest,
    files: [
      { name: "manifest.json", data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8") },
      ...assets.map((asset) => ({ name: normalizePackPath(asset.path), data: asset.data }))
    ]
  };
}

export function derivePackApplyState(current: PackApplyTarget, setup: PackSetup): PackApplyTarget {
  const addOns = new Set(current.addOns);
  let { theme, skin, alertVisuals, promoBanners, goals, sceneMode, framePreset, reducedMotion } = current;
  if (setup.theme) {
    theme = setup.theme;
    if (!setup.skin) {
      skin = "none";
    }
  }
  if (setup.skin) {
    skin = setup.skin;
    if (skin !== "none") {
      addOns.add("stream_skins");
    }
  }
  if (setup.framePreset) {
    framePreset = setup.framePreset;
    if (framePreset !== "none") {
      addOns.add("stream_skins");
    }
  }
  if (setup.reducedMotion !== undefined) {
    reducedMotion = setup.reducedMotion;
  }
  if (setup.sceneMode) {
    sceneMode = setup.sceneMode;
    if (sceneMode !== "none") {
      addOns.add("scene_switcher");
    }
  }
  if (setup.promoBanners) {
    promoBanners = setup.promoBanners;
    addOns.add("promo_banners");
  }
  if (setup.goals) {
    goals = setup.goals;
    addOns.add("goal_widgets");
  }
  if (setup.alerts) {
    alertVisuals = setup.alerts;
  } else if (setup.typographyPreset && setup.typographyPreset !== "theme") {
    alertVisuals = {
      sale: { ...current.alertVisuals.sale, typography: setup.typographyPreset },
      bid: { ...current.alertVisuals.bid, typography: setup.typographyPreset },
      action: { ...current.alertVisuals.action, typography: setup.typographyPreset },
      tip: { ...current.alertVisuals.tip, typography: setup.typographyPreset },
      share: { ...current.alertVisuals.share, typography: setup.typographyPreset }
    };
  }
  return {
    theme,
    skin,
    addOns: [...addOns],
    alertVisuals,
    promoBanners,
    goals,
    sceneMode,
    framePreset,
    reducedMotion
  };
}

export function allocatePackDirectory(root: string): { id: string; directory: string } {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = randomUUID();
    const directory = path.join(root, id);
    if (!fs.existsSync(directory)) {
      return { id, directory };
    }
  }
  throw new Error("Unable to allocate a pack install directory.");
}

export function writeInstalledPack(directory: string, inspected: InspectedPack): void {
  if (fs.existsSync(directory)) {
    throw new Error("Refusing to overwrite an existing pack directory.");
  }
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  try {
    for (const [relativePath, data] of inspected.files) {
      const destination = resolveInsideDirectory(directory, relativePath);
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
      fs.writeFileSync(destination, data, { mode: 0o600 });
    }
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

export function resolveInsideDirectory(root: string, relativePath: string): string {
  const normalized = normalizePackPath(relativePath);
  const destination = path.resolve(root, ...normalized.split("/"));
  const rootResolved = path.resolve(root);
  if (destination !== rootResolved && !destination.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error("Pack path escaped its install directory.");
  }
  return destination;
}

export function resolvePackMediaFile(packDirectory: string, fileName: string): string | null {
  const safe = path.basename(fileName);
  if (safe !== fileName || !safeFileName.test(safe)) {
    return null;
  }
  if (!fs.existsSync(packDirectory)) {
    return null;
  }
  const root = fs.realpathSync(packDirectory);
  for (const candidate of [path.join(packDirectory, safe), path.join(packDirectory, "assets", safe)]) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
      continue;
    }
    const resolved = fs.realpathSync(candidate);
    if (resolved !== root && resolved.startsWith(`${root}${path.sep}`)) {
      return resolved;
    }
  }
  return null;
}

export function recordFromManifest(id: string, manifest: PackManifest, installedAt = Date.now()): InstalledPackRecord {
  return {
    id,
    installedAt,
    name: manifest.name,
    author: manifest.author,
    packVersion: manifest.packVersion,
    description: manifest.description,
    license: manifest.license,
    ...(manifest.projectUrl ? { projectUrl: manifest.projectUrl } : {}),
    preview: manifest.preview
  };
}

export function loadPackCatalog(filePath: string): { packs: InstalledPackRecord[]; quarantined: boolean } {
  try {
    if (!fs.existsSync(filePath)) {
      return { packs: [], quarantined: false };
    }
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size > 2 * 1024 * 1024) {
      throw new Error("Pack catalog exceeds its size limit.");
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.packs)) {
      throw new Error("Pack catalog is malformed.");
    }
    return {
      packs: parsed.packs.map(normalizeInstalledPack).filter((pack): pack is InstalledPackRecord => Boolean(pack)),
      quarantined: false
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { packs: [], quarantined: false };
    }
    try {
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, `${filePath}.invalid-${Date.now()}`);
      }
    } catch {
      // Keep starting even if the bad catalog cannot be moved.
    }
    return { packs: [], quarantined: true };
  }
}

export function savePackCatalog(filePath: string, packs: InstalledPackRecord[]): void {
  const payload = `${JSON.stringify({ version: 1, packs }, null, 2)}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, payload, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

function normalizeInstalledPack(value: unknown): InstalledPackRecord | null {
  if (!isRecord(value) || !isPackId(value.id) || typeof value.installedAt !== "number" || !Number.isFinite(value.installedAt)
    || typeof value.name !== "string" || typeof value.author !== "string" || typeof value.packVersion !== "string"
    || typeof value.description !== "string" || !isPackLicense(value.license) || typeof value.preview !== "string") {
    return null;
  }
  return {
    id: value.id,
    installedAt: value.installedAt,
    name: sanitizePackName(value.name),
    author: sanitizePackName(value.author),
    packVersion: value.packVersion,
    description: value.description.slice(0, 500),
    license: value.license,
    ...(typeof value.projectUrl === "string" ? { projectUrl: value.projectUrl } : {}),
    preview: value.preview
  };
}
