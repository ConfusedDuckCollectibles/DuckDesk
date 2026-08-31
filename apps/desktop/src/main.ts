import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import {
  app as electronApp,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  nativeTheme,
  shell,
    type OpenDialogOptions,
    type SaveDialogOptions
  } from "electron";
import { WebSocket, WebSocketServer } from "ws";
import QRCode from "qrcode";
import { createRemoteDeckHtml } from "./remote-deck.js";
import {
  RemotePairingSession,
  normalizeRemoteAction,
  type RemoteAction
} from "./remote.js";
import {
  RehearsalManager,
  createBuiltInRehearsals,
  loadRehearsalLibrary,
  sanitizeTimelineName,
  saveRehearsalTimelines,
  shouldUpdateLiveHealth,
  type RehearsalAction,
  type RehearsalActionInput,
  type RehearsalStatus,
  type RehearsalTimeline,
  type ShowEventOrigin
} from "./rehearsal.js";
import {
  PACK_PREVIEW_FALLBACK_PNG,
  allocatePackDirectory,
  assemblePackFiles,
  createDuckPackArchive,
  derivePackApplyState,
  inspectDuckPackDirectory,
  inspectDuckPackPath,
  isPackId,
  loadPackCatalog,
  recordFromManifest,
  resolvePackMediaFile,
  savePackCatalog,
  writeInstalledPack,
  type InspectedPack,
  type InstalledPackRecord,
  type PackApplyTarget,
  type PackFramePreset
} from "./packs.js";
import {
  DiagnosticRing,
  compareVersions,
  createDiagnosticsArchive,
  dailyLogName,
  redactSettingsSummary,
  redactText,
  type HealthCheck,
  type UpdateStatus
} from "./diagnostics.js";
import {
  createShowProfile,
  createShowSessionReset,
  loadShowProfileLibrary,
  parseShowProfile,
  saveShowProfileLibrary,
  serializeProfileExport,
  upsertShowProfile,
  type ShowLook,
  type ShowProfile
} from "./show-session.js";
import {
  AudioPlaybackScheduler,
  normalizeAudioVolume,
  selectAudioCueSource,
  isAddOnId,
  isAudioTheme,
  isGifPlacement,
  isGifSize,
  isOverlaySkin,
  isOverlayTheme,
  isSceneMode,
  isSoundKind,
  advanceGameTheme,
  createGameProgressMap,
  createGameThemeProgress,
  gameThemeFromSkin,
  normalizeGameProgressMap,
  type AddOnId,
  type AudioTheme,
  type GifPlacement,
  type GifSize,
  type GoalConfig,
  type GameProgressMap,
  type GameThemeProgress,
  type OverlaySkin,
  type SceneMode,
  normalizeShowEvent,
  DEFAULT_ALERT_VISUALS,
  defaultAlertVisual,
  isAlertKind,
  normalizeAlertVisualMap,
  patchAlertVisual,
  type AlertVisualMap,
  type SoundKind,
  type OverlayTheme,
  type ShowEvent
} from "@duck-desk/shared";

const port = 8741;
const overlayUrl = `http://localhost:${port}/overlay`;
const obsUrl = "ws://127.0.0.1:4455";
const obsSourceName = "Duck Desk Overlay";
const customAudioToken = randomUUID();
const packMediaToken = randomUUID();
const remoteSession = new RemotePairingSession(port);

let mainWindow: BrowserWindow | null = null;
let server: Server | null = null;
let wss: WebSocketServer | null = null;
let lastError: string | undefined;

const clients = new Set<WebSocket>();
const stats = {
  salesCount: 0,
  grossSales: 0,
  bidCount: 0,
  audienceActions: 0,
  tipCount: 0,
  tipTotal: 0,
  shareCount: 0
};
let activeTheme: OverlayTheme = "neon";
let activeSkin: OverlaySkin = "none";
let gameProgress: GameProgressMap = createGameProgressMap();
const activeAddOns = new Set<AddOnId>();
let soundsEnabled = true;
let soundVolume = 0.75;
let audioTheme: AudioTheme = "neon_pulse";
let customSounds: Partial<Record<SoundKind, CustomSoundSelection>> = {};
let audioNotice = "Ready";
let audioRevision = 0;
let nativeSoundPlayer: ChildProcess | null = null;
const nativeAudioScheduler = new AudioPlaybackScheduler();
const nativeSoundTimers = new Set<ReturnType<typeof setTimeout>>();
let demoMode = false;
let streamTitle = "";
let customGifs: CustomGif[] = [];
let gifPlacement: GifPlacement = "center";
let gifSize: GifSize = "medium";
let milestoneThresholds = [100, 250, 500, 1000];
const completedMilestones = new Set<number>();
let hypeMeterSeconds = 30;
let jumbotronCameraEnabled = false;
let promoBanners = ["Follow the show for new drops", "Bookmark your favorite lots", "Ask questions in chat"];
let sceneMode: SceneMode = "none";
let goals: GoalConfig[] = [
  { kind: "sales", target: 250, label: "Sales Goal" },
  { kind: "orders", target: 10, label: "Order Goal" }
];
let auctionTimerSeconds = 45;
let hideTopBanner = false;
let themeEffectsEnabled = true;
let alertVisuals: AlertVisualMap = DEFAULT_ALERT_VISUALS;
let firstRunComplete = false;
const showReadyAddOns: AddOnId[] = ["stream_skins", "noise_machines", "bid_ladder", "activity_feed"];
let obsStatus = "Not connected";
let extensionLastSeenAt = 0;
let whatnotPageReportedActive = false;
let lastRealEventAt = 0;
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;
let remoteQrDataUrl = "";
let remoteQrUrl = "";
let remoteQrPendingUrl = "";
let userRehearsals: RehearsalTimeline[] = [];
let rehearsalNotice = "";
let rehearsalTick: ReturnType<typeof setInterval> | null = null;
let installedPacks: InstalledPackRecord[] = [];
let pendingPack: InspectedPack | null = null;
let packUndoSnapshot: PackUndoSnapshot | null = null;
let packNotice = "";
let showProfiles: ShowProfile[] = [];
let activeShowProfileId = "";
let showEpoch = 0;
let showNotice = "";
let framePreset: PackFramePreset = "theme";
let reducedMotion = false;
const diagnosticRing = new DiagnosticRing();
let rejectedEventCount = 0;
let duplicateEventCount = 0;
let lastEventFingerprint = "";
let overlayLastSeenAt = 0;
let recoveryNotice = "";
let updateStatus: UpdateStatus = {
  currentVersion: electronApp.getVersion(),
  status: "unknown",
  detail: "Not checked yet."
};
const isPrimaryInstance = electronApp.requestSingleInstanceLock();

type CustomGif = {
  id: string;
  label: string;
  url: string;
};

type CustomSoundSelection = {
  storedFileName: string;
  displayName: string;
};

const allowedAudioExtensions = ["mp3", "wav", "m4a", "aac", "aiff", "aif", "caf"] as const;
const maxCustomSoundBytes = 20 * 1024 * 1024;

type PersistedSettings = {
  version: 1;
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
  soundVolume: number;
  audioTheme: AudioTheme;
  customSounds: Partial<Record<SoundKind, CustomSoundSelection>>;
  streamTitle: string;
  customGifUrls: string[];
  customGifs: CustomGif[];
  gifPlacement: GifPlacement;
  gifSize: GifSize;
  milestoneThresholds: number[];
  hypeMeterSeconds: number;
  jumbotronCameraEnabled: boolean;
  promoBanners: string[];
  sceneMode: SceneMode;
  goals: GoalConfig[];
  auctionTimerSeconds: number;
  hideTopBanner: boolean;
  themeEffectsEnabled: boolean;
  alertVisuals: AlertVisualMap;
  framePreset: PackFramePreset;
  reducedMotion: boolean;
  gameProgress: GameProgressMap;
  firstRunComplete: boolean;
};

type PackUndoSnapshot = PackApplyTarget & {
  customSounds: Partial<Record<SoundKind, CustomSoundSelection>>;
  customGifs: CustomGif[];
};

if (!isPrimaryInstance) {
  electronApp.quit();
} else {
  electronApp.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  });
}

process.on("uncaughtException", (error) => {
  lastError = error.message;
  log(`uncaughtException: ${error.stack ?? error.message}`);
  broadcastStatus();
});

process.on("unhandledRejection", (error) => {
  lastError = error instanceof Error ? error.message : String(error);
  log(`unhandledRejection: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  broadcastStatus();
});

void electronApp.whenReady().then(async () => {
  if (!isPrimaryInstance) {
    return;
  }
  log("app ready");
  nativeTheme.themeSource = "dark";
  recoverUncleanShutdown();
  loadSettings();
  loadUserRehearsals();
  loadUserPacks();
  loadShowProfiles();
  writeRuntimeMarker(false);
  registerIpc();
  createWindow();
  await startLocalBridge();
  void checkForUpdates(false);

  electronApp.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

electronApp.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electronApp.quit();
  }
});

electronApp.on("before-quit", () => {
  rehearsalManager.stop();
  stopRehearsalTick();
  stopNativeSound();
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = null;
    saveSettings();
  }
  writeRuntimeMarker(true);
  wss?.close();
  server?.close();
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 720,
    title: "Duck Desk",
    backgroundColor: "#071014",
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hiddenInset" as const,
          trafficLightPosition: { x: 16, y: 18 }
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const appPath = electronApp.getAppPath();
  void mainWindow.loadFile(path.join(appPath, "dist", "renderer", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function startLocalBridge(): Promise<void> {
  const expressApp = express();
  const overlayPath = resolveOverlayPath();
  log(`starting local bridge on ${port}`);
  log(`overlay path: ${overlayPath}`);

  expressApp.use(cors({
    origin(origin, callback) {
      callback(null, !origin || isAllowedBridgeOrigin(origin));
    }
  }));
  expressApp.use(express.json({ limit: "256kb" }));

  expressApp.get("/health", (_request, response) => {
    const status = getStatus();
    response.json({
      ok: status.ok,
      port: status.port,
      clients: status.clients,
      obsStatus: status.obsStatus,
      extensionConnected: status.extensionConnected,
      whatnotPageActive: status.whatnotPageActive,
      lastRealEventAt: status.lastRealEventAt,
      hasError: Boolean(status.lastError)
    });
  });

  expressApp.post("/events", (request, response) => {
    try {
      const event = normalizeShowEvent(request.body);
      extensionLastSeenAt = Date.now();
      whatnotPageReportedActive = true;
      receiveEvent(event, "live");
      response.status(202).json({ ok: true, event });
    } catch (error) {
      rejectedEventCount += 1;
      diagnosticRing.push("event-rejected", "Invalid live event payload");
      const message = error instanceof Error ? error.message : "Invalid event.";
      response.status(400).json({ ok: false, error: message });
    }
  });

  expressApp.post("/extension/heartbeat", (request, response) => {
    extensionLastSeenAt = Date.now();
    whatnotPageReportedActive = isRecord(request.body) && request.body.whatnotPageActive === true;
    broadcastStatus();
    response.status(202).json({ ok: true });
  });

  expressApp.get("/config", (_request, response) => {
    response.json(createOverlayConfig());
  });

  expressApp.get("/remote", (request, response) => {
    if (!remoteSession.authorize(request.query.token, request.socket.remoteAddress)) {
      response.sendStatus(404);
      return;
    }
    const nonce = randomBytes(18).toString("base64url");
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.setHeader("Content-Security-Policy", `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.type("html").send(createRemoteDeckHtml(nonce));
  });

  expressApp.get("/remote/api/status", (request, response) => {
    if (!remoteSession.authorize(request.query.token, request.socket.remoteAddress)) {
      response.sendStatus(404);
      return;
    }
    const clientId = remoteSession.touchClient(request.query.clientId);
    if (!clientId) {
      response.status(400).json({ ok: false });
      return;
    }
    response.setHeader("Cache-Control", "no-store");
    response.json(createRemoteControlStatus());
  });

  expressApp.post("/remote/api/action", (request, response) => {
    if (!remoteSession.authorize(request.query.token, request.socket.remoteAddress)) {
      response.sendStatus(404);
      return;
    }
    const clientId = isRecord(request.body) ? remoteSession.touchClient(request.body.clientId) : null;
    const action = isRecord(request.body) ? normalizeRemoteAction(request.body.action) : null;
    if (!clientId || !action) {
      response.status(400).json({ ok: false });
      return;
    }
    if (!remoteSession.allowAction(clientId)) {
      response.status(429).json({ ok: false, error: "Rate limit reached." });
      return;
    }
    performRemoteAction(action);
    response.setHeader("Cache-Control", "no-store");
    response.status(202).json(createRemoteControlStatus());
  });

  expressApp.post("/config", (request, response) => {
    try {
      applyConfigPatch(request.body);
      const config = createOverlayConfig();
      broadcast(config);
      broadcastStatus();
      response.status(202).json({ ok: true, config });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid config.";
      response.status(400).json({ ok: false, error: message });
    }
  });

  expressApp.get("/custom-audio/:kind", (request, response) => {
    const kind = request.params.kind;
    if (!isSoundKind(kind) || request.query.token !== customAudioToken) {
      response.sendStatus(404);
      return;
    }

    const selection = customSounds[kind];
    if (!selection) {
      response.sendStatus(404);
      return;
    }

    const soundPath = resolveCustomSoundPath(selection);
    if (!fs.existsSync(soundPath)) {
      response.sendStatus(404);
      return;
    }

    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.sendFile(soundPath);
  });

  expressApp.get("/pack-media/:packId/:fileName", (request, response) => {
    const packId = request.params.packId;
    const fileName = request.params.fileName;
    if (!isPackId(packId) || request.query.token !== packMediaToken) {
      response.sendStatus(404);
      return;
    }
    const mediaPath = resolvePackMediaFile(path.join(resolvePacksRoot(), packId), fileName);
    if (!mediaPath) {
      response.sendStatus(404);
      return;
    }
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.sendFile(mediaPath);
  });

  expressApp.use("/overlay", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    next();
  });
  expressApp.use("/overlay", express.static(overlayPath, {
    etag: false,
    lastModified: false
  }));
  expressApp.get("/overlay", (_request, response) => {
    response.sendFile(path.join(overlayPath, "index.html"));
  });
  expressApp.get("/", (_request, response) => {
    response.redirect("/overlay");
  });

  server = createServer(expressApp);
  wss = new WebSocketServer({
    server,
    path: "/ws",
    verifyClient: ({ origin }: { origin: string }) => isAllowedWebSocketOrigin(origin)
  });

  wss.on("connection", (socket) => {
    clients.add(socket);
    overlayLastSeenAt = Date.now();
    diagnosticRing.push("overlay", "Overlay client connected");
    broadcastStatus();

    socket.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
    socket.send(JSON.stringify(createOverlayClear()));
    socket.send(JSON.stringify(createOverlayConfig()));
    socket.on("close", () => {
      clients.delete(socket);
      broadcastStatus();
    });
  });

  await new Promise<void>((resolve) => {
    server?.once("error", (error) => {
      const code = (error as NodeJS.ErrnoException).code;
      lastError = code === "EADDRINUSE"
        ? "Port 8741 is already in use. If another Duck Desk window is open, use that one. Otherwise quit the process holding the port."
        : error instanceof Error ? error.message : "Unable to start local bridge.";
      log(`server error: ${lastError}`);
      diagnosticRing.push("bridge", lastError);
      broadcastStatus();
      resolve();
    });

    server?.listen(port, "0.0.0.0", () => {
      lastError = undefined;
      log(`local bridge listening on ${overlayUrl}`);
      void refreshRemoteQr();
      broadcastStatus();
      resolve();
    });
  });
}

function registerIpc(): void {
  ipcMain.handle("duck-desk:get-status", () => getStatus());

  ipcMain.handle("duck-desk:copy-overlay-url", () => {
    clipboard.writeText(overlayUrl);
  });

  ipcMain.handle("duck-desk:open-overlay", () => {
    void shell.openExternal(`${overlayUrl}?audio=off`);
  });

  ipcMain.handle("duck-desk:copy-remote-url", () => {
    const remoteUrl = remoteSession.getConnectionInfo().url;
    if (remoteUrl) {
      clipboard.writeText(remoteUrl);
    }
    return getStatus();
  });

  ipcMain.handle("duck-desk:open-remote-deck", () => {
    const remoteUrl = remoteSession.getConnectionInfo().url;
    if (remoteUrl) {
      void shell.openExternal(remoteUrl);
    }
    return getStatus();
  });

  ipcMain.handle("duck-desk:rotate-remote-access", async () => {
    remoteSession.rotate();
    await refreshRemoteQr();
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:reveal-extension", () => {
    void shell.openPath(resolveExtensionPath());
  });

  ipcMain.handle("duck-desk:complete-first-run", () => {
    firstRunComplete = true;
    scheduleSettingsSave();
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-hide-top-banner", (_event, hidden: unknown) => {
    if (typeof hidden !== "boolean") {
      return getStatus();
    }
    setBannerVisible(!hidden);
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-theme-effects-enabled", (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") {
      return getStatus();
    }
    setThemeEffects(enabled);
    return getStatus();
  });

  ipcMain.handle("duck-desk:auto-add-obs-overlay", async (_event, password: unknown) => {
    const suppliedPassword = typeof password === "string" ? password.trim().slice(0, 256) : "";
    obsStatus = "Connecting to OBS...";
    broadcastStatus();
    obsStatus = await autoAddObsOverlay(suppliedPassword);
    log(`OBS auto-add result: ${obsStatus}`);
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:send-test-sale", () => {
    if (!demoMode) {
      return getStatus();
    }

    receiveEvent({
      type: "sale",
      buyer: "TestBuyer",
      amount: 28,
      item: "Desktop Test Sale",
      timestamp: Date.now()
    }, "demo");
  });

  ipcMain.handle("duck-desk:send-test-bid", () => {
    if (!demoMode) {
      return getStatus();
    }

    receiveEvent({
      type: "bid",
      bidder: "BidBoss",
      amount: 34,
      item: "Live Auction Demo",
      timestamp: Date.now()
    }, "demo");
  });

  ipcMain.handle("duck-desk:send-test-action", () => {
    if (!demoMode) {
      return getStatus();
    }

    receiveEvent({
      type: "audience_action",
      actor: "ChatChampion",
      action: "reaction",
      message: "Audience surge",
      timestamp: Date.now()
    }, "demo");
  });

  ipcMain.handle("duck-desk:send-test-tip", () => {
    if (!demoMode) {
      return getStatus();
    }

    receiveEvent({
      type: "tip",
      tipper: "TestTipper",
      amount: 5,
      message: "Thanks for supporting the show!",
      timestamp: Date.now()
    }, "demo");
  });

  ipcMain.handle("duck-desk:send-test-share", () => {
    if (!demoMode) {
      return getStatus();
    }

    receiveEvent({
      type: "share",
      actor: "TestSharer",
      delta: 1,
      timestamp: Date.now()
    }, "demo");
  });

  ipcMain.handle("duck-desk:set-theme", (_event, theme: unknown) => {
    if (!isOverlayTheme(theme)) {
      return getStatus();
    }

    activeTheme = theme;
    activeSkin = "none";
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-skin", (_event, skin: unknown) => {
    if (!isOverlaySkin(skin)) {
      return getStatus();
    }

    activeSkin = skin;
    activeAddOns.add("stream_skins");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:reset-game-theme", () => {
    const game = gameThemeFromSkin(activeSkin);
    if (game) {
      gameProgress[game] = createGameThemeProgress(game);
      broadcast(createOverlayConfig());
      broadcastStatus();
    }
    return getStatus();
  });

  ipcMain.handle("duck-desk:preview-game-progress", () => {
    const game = gameThemeFromSkin(activeSkin);
    if (game) {
      gameProgress[game] = advanceGameTheme(gameProgress[game], { type: "bid" });
      broadcast(createOverlayConfig());
      broadcastStatus();
    }
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-addon", (_event, addOn: unknown, enabled: unknown) => {
    if (!isAddOnId(addOn) || typeof enabled !== "boolean") {
      return getStatus();
    }

    if (enabled) {
      activeAddOns.add(addOn);
    } else {
      activeAddOns.delete(addOn);
      if (addOn === "stream_skins") {
        activeSkin = "none";
      }
    }

    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-sounds-enabled", (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") {
      return getStatus();
    }

    soundsEnabled = enabled;
    if (!enabled) {
      stopNativeSound();
    }
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-sound-volume", (_event, volume: unknown) => {
    if (typeof volume !== "number" || !Number.isFinite(volume)) {
      return getStatus();
    }

    soundVolume = normalizeAudioVolume(volume);
    stopNativeSound();
    audioNotice = `Effects volume ${Math.round(soundVolume * 100)}%`;
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-audio-theme", (_event, theme: unknown) => {
    if (!isAudioTheme(theme)) {
      return getStatus();
    }

    audioTheme = theme;
    audioNotice = `${audioThemeName(theme)} selected`;
    activeAddOns.add("noise_machines");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:select-custom-sound", async (_event, kind: unknown) => {
    if (!isSoundKind(kind)) {
      return getStatus();
    }

    const options: OpenDialogOptions = {
      title: `Choose a sound for ${soundKindName(kind)}`,
      properties: ["openFile"],
      filters: [
        { name: "Audio", extensions: [...allowedAudioExtensions] },
        { name: "All Files", extensions: ["*"] }
      ]
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);
    const sourcePath = result.filePaths[0];
    if (result.canceled || !sourcePath) {
      return getStatus();
    }

    try {
      const sourceStats = fs.statSync(sourcePath);
      if (
        !sourceStats.isFile() ||
        sourceStats.size < 256 ||
        sourceStats.size > maxCustomSoundBytes ||
        !isAllowedAudioFileName(path.basename(sourcePath))
      ) {
        audioNotice = "Choose a valid MP3, WAV, M4A, AAC, AIFF, or CAF file under 20 MB";
        broadcastStatus();
        return getStatus();
      }
      const inspection = inspectAudioFile(sourcePath);
      if (!inspection.ok) {
        audioNotice = inspection.message;
        broadcastStatus();
        return getStatus();
      }

      const soundDirectory = resolveCustomSoundDirectory();
      fs.mkdirSync(soundDirectory, { recursive: true });
      const storedFileName = `${kind}.wav`;
      const destinationPath = path.join(soundDirectory, storedFileName);
      const conversion = convertCustomSoundToWav(sourcePath, destinationPath);
      if (!conversion.ok) {
        audioNotice = conversion.message;
        broadcastStatus();
        return getStatus();
      }

      const previous = customSounds[kind];
      customSounds[kind] = {
        storedFileName,
        displayName: path.basename(sourcePath).slice(0, 100)
      };
      if (previous && previous.storedFileName !== storedFileName) {
        fs.rmSync(resolveCustomSoundPath(previous), { force: true });
      }
      audioNotice = `${soundKindName(kind)} now uses ${path.basename(sourcePath).slice(0, 100)}`;
      audioRevision += 1;
      activeAddOns.add("noise_machines");
      broadcast(createOverlayConfig());
      broadcastStatus();
      return getStatus();
    } catch (error) {
      log(`unable to add custom sound: ${error instanceof Error ? error.message : String(error)}`);
      audioNotice = "Duck Desk could not add that sound file";
      broadcastStatus();
      return getStatus();
    }
  });

  ipcMain.handle("duck-desk:remove-custom-sound", (_event, kind: unknown) => {
    if (!isSoundKind(kind)) {
      return getStatus();
    }

    try {
      const previous = customSounds[kind];
      if (previous) {
        fs.rmSync(resolveCustomSoundPath(previous), { force: true });
        delete customSounds[kind];
        audioRevision += 1;
      }
      audioNotice = `${soundKindName(kind)} reset to ${audioThemeName(audioTheme)}`;
      broadcast(createOverlayConfig());
      broadcastStatus();
    } catch (error) {
      log(`unable to reset custom sound: ${error instanceof Error ? error.message : String(error)}`);
      audioNotice = "Duck Desk could not reset that sound file";
      broadcastStatus();
    }
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-demo-mode", (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") {
      return getStatus();
    }

    demoMode = enabled;
    if (!enabled) {
      broadcast(createOverlayClear());
    }
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-stream-title", (_event, title: unknown) => {
    if (typeof title !== "string") {
      return getStatus();
    }

    streamTitle = sanitizeStreamTitle(title);
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:add-custom-gif", (_event, url: unknown) => {
    const normalizedUrl = typeof url === "string" ? normalizeGifUrl(url) : null;
    if (!normalizedUrl) {
      return getStatus();
    }

    if (!customGifs.some((gif) => gif.url === normalizedUrl)) {
      customGifs = [{
        id: randomUUID(),
        label: createDefaultGifLabel(normalizedUrl, customGifs.length + 1),
        url: normalizedUrl
      }, ...customGifs].slice(0, 24);
    }
    activeAddOns.add("gif_reactions");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:remove-custom-gif", (_event, id: unknown) => {
    if (typeof id !== "string") {
      return getStatus();
    }

    customGifs = customGifs.filter((gif) => gif.id !== id);
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-custom-gif-label", (_event, id: unknown, label: unknown) => {
    if (typeof id !== "string" || typeof label !== "string") {
      return getStatus();
    }

    const nextLabel = sanitizeGifLabel(label);
    customGifs = customGifs.map((gif, index) => (
      gif.id === id
        ? { ...gif, label: nextLabel || createDefaultGifLabel(gif.url, index + 1) }
        : gif
    ));
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-gif", (_event, url: unknown) => {
    triggerGifSelection(url);
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-gif-settings", (_event, placement: unknown, size: unknown) => {
    if (isGifPlacement(placement)) {
      gifPlacement = placement;
    }
    if (isGifSize(size)) {
      gifSize = size;
    }

    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-sound", (_event, kind: unknown) => {
    if (!isSoundKind(kind)) {
      return getStatus();
    }
    triggerSoundPad(kind);
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-burst", () => {
    triggerBurst();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-milestones", (_event, thresholds: unknown) => {
    if (typeof thresholds !== "string") {
      return getStatus();
    }

    const parsed = thresholds
      .split(/[,\n]/)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((left, right) => left - right);
    milestoneThresholds = [...new Set(parsed)].slice(0, 12);
    completedMilestones.clear();
    activeAddOns.add("milestones");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-hype-meter", () => {
    triggerHypeMeterNow();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-hype-meter-seconds", (_event, seconds: unknown) => {
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      hypeMeterSeconds = Math.max(10, Math.min(120, Math.round(seconds)));
    }
    activeAddOns.add("hype_meter");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-jumbotron-camera", (_event, enabled: unknown) => {
    if (typeof enabled === "boolean") {
      jumbotronCameraEnabled = enabled;
    }
    activeAddOns.add("jumbotron");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-promo-banners", (_event, banners: unknown) => {
    if (typeof banners === "string") {
      promoBanners = banners
        .split(/\n/)
        .map((banner) => banner.replace(/\s+/g, " ").trim())
        .filter((banner) => banner.length > 0)
        .slice(0, 12);
    }
    activeAddOns.add("promo_banners");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-scene-mode", (_event, mode: unknown) => {
    if (!isSceneMode(mode)) {
      return getStatus();
    }

    setSceneModeNow(mode);
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-goals", (_event, rawGoals: unknown) => {
    if (typeof rawGoals !== "string") {
      return getStatus();
    }

    goals = parseGoals(rawGoals);
    activeAddOns.add("goal_widgets");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-auction-timer-seconds", (_event, seconds: unknown) => {
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      auctionTimerSeconds = Math.max(5, Math.min(900, Math.round(seconds)));
    }
    activeAddOns.add("auction_timer");
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-auction-timer", () => {
    triggerAuctionTimerNow();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-recap", () => {
    triggerRecapNow();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-alert-visual", (_event, kind: unknown, patch: unknown) => {
    if (!isAlertKind(kind)) {
      return getStatus();
    }
    alertVisuals = patchAlertVisual(kind, alertVisuals, patch);
    scheduleSettingsSave();
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:reset-alert-visual", (_event, kind: unknown) => {
    if (!isAlertKind(kind)) {
      return getStatus();
    }
    alertVisuals = { ...alertVisuals, [kind]: defaultAlertVisual(kind) };
    scheduleSettingsSave();
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:preview-alert", (_event, kind: unknown) => {
    previewAlert(kind);
    return getStatus();
  });

  ipcMain.handle("duck-desk:start-rehearsal", (_event, id: unknown) => {
    startRehearsal(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:pause-rehearsal", () => {
    rehearsalManager.pause();
    return getStatus();
  });

  ipcMain.handle("duck-desk:resume-rehearsal", () => {
    rehearsalManager.resume();
    return getStatus();
  });

  ipcMain.handle("duck-desk:stop-rehearsal", () => {
    rehearsalManager.stop();
    return getStatus();
  });

  ipcMain.handle("duck-desk:start-rehearsal-recording", () => {
    rehearsalManager.startRecording();
    rehearsalNotice = "";
    return getStatus();
  });

  ipcMain.handle("duck-desk:save-rehearsal-recording", (_event, name: unknown) => {
    saveRehearsalRecording(name);
    return getStatus();
  });

  ipcMain.handle("duck-desk:rename-rehearsal", (_event, id: unknown, name: unknown) => {
    renameUserRehearsal(id, name);
    return getStatus();
  });

  ipcMain.handle("duck-desk:delete-rehearsal", (_event, id: unknown) => {
    deleteUserRehearsal(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:import-pack", async () => {
    await choosePackToImport();
    return getStatus();
  });

  ipcMain.handle("duck-desk:confirm-import-pack", () => {
    confirmPendingPackInstall();
    return getStatus();
  });

  ipcMain.handle("duck-desk:cancel-import-pack", () => {
    pendingPack = null;
    packNotice = "";
    return getStatus();
  });

  ipcMain.handle("duck-desk:apply-pack", (_event, id: unknown) => {
    applyInstalledPack(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:export-pack", async (_event, id: unknown) => {
    await exportInstalledPack(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:export-current-setup", async () => {
    await exportCurrentSetup();
    return getStatus();
  });

  ipcMain.handle("duck-desk:remove-pack", (_event, id: unknown) => {
    removeInstalledPack(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:undo-pack", () => {
    undoPackApply();
    return getStatus();
  });

  ipcMain.handle("duck-desk:restart-bridge", async () => {
    await restartLocalBridge();
    return getStatus();
  });

  ipcMain.handle("duck-desk:clear-overlay-queue", () => {
    clearOverlayNow();
    packNotice = packNotice;
    diagnosticRing.push("overlay", "Overlay queue cleared");
    return getStatus();
  });

  ipcMain.handle("duck-desk:reset-audio-output", () => {
    stopNativeSound();
    audioNotice = "Ready";
    audioRevision += 1;
    diagnosticRing.push("audio", "Audio output reset");
    return getStatus();
  });

  ipcMain.handle("duck-desk:open-log-folder", async () => {
    const logDir = resolveLogDirectory();
    fs.mkdirSync(logDir, { recursive: true });
    await shell.openPath(logDir);
    return getStatus();
  });

  ipcMain.handle("duck-desk:check-for-updates", async () => {
    await checkForUpdates(true);
    return getStatus();
  });

  ipcMain.handle("duck-desk:export-diagnostics", async () => {
    await exportDiagnostics();
    return getStatus();
  });

  ipcMain.handle("duck-desk:start-new-show", async () => {
    await startNewShow();
    return getStatus();
  });

  ipcMain.handle("duck-desk:save-show-profile", (_event, name: unknown) => {
    saveCurrentShowProfile(name);
    return getStatus();
  });

  ipcMain.handle("duck-desk:load-show-profile", (_event, id: unknown) => {
    loadShowProfileById(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:delete-show-profile", (_event, id: unknown) => {
    deleteShowProfileById(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:export-show-profile", async (_event, id: unknown) => {
    await exportShowProfileById(id);
    return getStatus();
  });

  ipcMain.handle("duck-desk:import-show-profile", async () => {
    await importShowProfileFromDisk();
    return getStatus();
  });

  ipcMain.handle("duck-desk:dismiss-recovery-notice", () => {
    recoveryNotice = "";
    return getStatus();
  });
}

function setBannerVisible(visible: boolean): void {
  hideTopBanner = !visible;
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function setThemeEffects(enabled: boolean): void {
  themeEffectsEnabled = enabled;
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function setSceneModeNow(mode: SceneMode): void {
  sceneMode = mode;
  if (mode !== "none") {
    activeAddOns.add("scene_switcher");
  }
  recordRehearsalAction({ kind: "scene", scene: mode });
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function triggerGifSelection(selection: unknown): void {
  const selectedGif = typeof selection === "string"
    ? customGifs.find((gif) => gif.id === selection)
    : undefined;
  const selectedUrl = selectedGif?.url
    ?? (typeof selection === "string" ? normalizeGifUrl(selection) : undefined)
    ?? customGifs[0]?.url
    ?? "/gifs/chat-spark.gif";
  if (!selectedUrl) {
    return;
  }
  activeAddOns.add("gif_reactions");
  recordRehearsalAction({
    kind: "gif",
    gifId: selectedGif?.id ?? (typeof selection === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(selection) ? selection : "featured")
  });
  broadcast(createOverlayConfig());
  broadcast(createOverlayGifTrigger(selectedUrl));
  broadcastStatus();
}

function triggerSoundPad(kind: SoundKind): void {
  activeAddOns.add("noise_machines");
  if (soundsEnabled) {
    const trigger = createOverlaySoundTrigger(kind);
    playSoundKind(kind, trigger.timestamp);
    broadcast(trigger);
  }
  recordRehearsalAction({ kind: "sound", sound: kind });
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function triggerBurst(): void {
  activeAddOns.add("hype_bursts");
  recordRehearsalAction({ kind: "burst" });
  broadcast(createOverlayConfig());
  broadcast(createOverlayBurstTrigger());
  broadcastStatus();
}

function triggerHypeMeterNow(): void {
  activeAddOns.add("hype_meter");
  recordRehearsalAction({ kind: "hype" });
  broadcast(createOverlayConfig());
  broadcast(createOverlayHypeMeterTrigger(hypeMeterSeconds));
  broadcastStatus();
}

function triggerAuctionTimerNow(): void {
  activeAddOns.add("auction_timer");
  recordRehearsalAction({ kind: "timer" });
  broadcast(createOverlayConfig());
  broadcast(createOverlayAuctionTimerTrigger(auctionTimerSeconds));
  broadcastStatus();
}

function triggerRecapNow(): void {
  if (!activeAddOns.has("show_recap")) {
    return;
  }
  recordRehearsalAction({ kind: "recap" });
  broadcast(createOverlayRecapTrigger());
  broadcastStatus();
}

function clearOverlayNow(): void {
  recordRehearsalAction({ kind: "clear" });
  broadcast(createOverlayClear());
  broadcastStatus();
}

function performRemoteAction(action: RemoteAction): void {
  if (action.type === "clear") {
    clearOverlayNow();
  } else if (action.type === "set_scene") {
    setSceneModeNow(action.scene);
  } else if (action.type === "set_banner") {
    setBannerVisible(action.visible);
  } else if (action.type === "set_effects") {
    setThemeEffects(action.enabled);
  } else if (action.type === "trigger_sound") {
    triggerSoundPad(action.kind);
  } else if (action.type === "trigger_gif") {
    triggerGifSelection(action.id);
  } else if (action.type === "trigger_burst") {
    triggerBurst();
  } else if (action.type === "trigger_hype") {
    triggerHypeMeterNow();
  } else if (action.type === "trigger_timer") {
    triggerAuctionTimerNow();
  } else if (action.type === "trigger_recap") {
    triggerRecapNow();
  }
}

function receiveEvent(event: ShowEvent, origin: ShowEventOrigin = "live"): void {
  const fingerprint = `${event.type}:${event.timestamp}`;
  if (origin === "live" && fingerprint === lastEventFingerprint) {
    duplicateEventCount += 1;
  }
  lastEventFingerprint = fingerprint;
  if (origin === "live") {
    if (event.type === "sale") {
      stats.salesCount += 1;
      stats.grossSales += event.amount;
      checkMilestones();
    } else if (event.type === "bid") {
      stats.bidCount += 1;
    } else if (event.type === "audience_action") {
      stats.audienceActions += 1;
    } else if (event.type === "tip") {
      stats.tipCount += 1;
      stats.tipTotal += event.amount;
    } else if (event.type === "share") {
      stats.shareCount += event.delta ?? 1;
    }
  }

  if (shouldUpdateLiveHealth(origin)) {
    lastRealEventAt = Date.now();
  }

  if (origin !== "rehearsal") {
    recordRehearsalAction({ kind: "event", event });
  }

  playEventSound(event);
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send("duck-desk:event", {
      ...event,
      rehearsal: origin === "rehearsal"
    });
  }
  broadcast(event);
  const game = gameThemeFromSkin(activeSkin);
  if (game) {
    gameProgress[game] = advanceGameTheme(gameProgress[game], event);
    broadcast(createOverlayConfig());
  }
  broadcastStatus();
}

const rehearsalManager = new RehearsalManager(executeRehearsalAction, () => {
  syncRehearsalTick();
  broadcastStatus();
});

function executeRehearsalAction(action: RehearsalAction): void {
  if (action.kind === "event") {
    receiveEvent(action.event, "rehearsal");
    return;
  }
  if (action.kind === "gif") {
    const known = customGifs.find((gif) => gif.id === action.gifId);
    triggerGifSelection(known?.id);
    return;
  }
  if (action.kind === "sound") {
    triggerSoundPad(action.sound);
    return;
  }
  if (action.kind === "scene") {
    setSceneModeNow(action.scene);
    return;
  }
  if (action.kind === "burst") {
    triggerBurst();
    return;
  }
  if (action.kind === "hype") {
    triggerHypeMeterNow();
    return;
  }
  if (action.kind === "timer") {
    triggerAuctionTimerNow();
    return;
  }
  if (action.kind === "recap") {
    triggerRecapNow();
    return;
  }
  clearOverlayNow();
}

function recordRehearsalAction(action: RehearsalActionInput): void {
  rehearsalManager.record(action);
}

function rehearsalLibraryPath(): string {
  return path.join(electronApp.getPath("userData"), "rehearsal-timelines.json");
}

function resolvePacksRoot(): string {
  return path.join(electronApp.getPath("userData"), "packs");
}

function packCatalogPath(): string {
  return path.join(resolvePacksRoot(), "index.json");
}

function loadUserPacks(): void {
  const loaded = loadPackCatalog(packCatalogPath());
  installedPacks = loaded.packs;
  if (loaded.quarantined) {
    packNotice = "A pack catalog file was invalid and was set aside. Installed packs were not loaded.";
  }
}

function persistPackCatalog(): void {
  savePackCatalog(packCatalogPath(), installedPacks);
}

function captureShowLook(): PackUndoSnapshot {
  return {
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    alertVisuals: structuredClone(alertVisuals),
    promoBanners: [...promoBanners],
    goals: goals.map((goal) => ({ ...goal })),
    sceneMode,
    framePreset,
    reducedMotion,
    customSounds: { ...customSounds },
    customGifs: customGifs.map((gif) => ({ ...gif }))
  };
}

function restoreShowLook(snapshot: PackUndoSnapshot): void {
  activeTheme = snapshot.theme;
  activeSkin = snapshot.skin;
  activeAddOns.clear();
  for (const addOn of snapshot.addOns) {
    activeAddOns.add(addOn);
  }
  alertVisuals = snapshot.alertVisuals;
  promoBanners = snapshot.promoBanners;
  goals = snapshot.goals;
  sceneMode = snapshot.sceneMode;
  framePreset = snapshot.framePreset;
  reducedMotion = snapshot.reducedMotion;
  customSounds = snapshot.customSounds;
  customGifs = snapshot.customGifs;
}

async function choosePackToImport(): Promise<void> {
  const options: OpenDialogOptions = {
    title: "Import Duck Desk pack",
    properties: ["openFile"],
    filters: [
      { name: "Duckpack", extensions: ["duckpack", "zip"] },
      { name: "All Files", extensions: ["*"] }
    ]
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);
  const sourcePath = result.filePaths[0];
  if (result.canceled || !sourcePath) {
    return;
  }
  try {
    pendingPack = await inspectDuckPackPath(sourcePath);
    packNotice = "";
  } catch (error) {
    pendingPack = null;
    packNotice = error instanceof Error ? error.message : "That pack could not be imported.";
  }
}

function confirmPendingPackInstall(): void {
  if (!pendingPack) {
    packNotice = "Choose a pack to review before installing it.";
    return;
  }
  try {
    const { id, directory } = allocatePackDirectory(resolvePacksRoot());
    writeInstalledPack(directory, pendingPack);
    installedPacks = [recordFromManifest(id, pendingPack.manifest), ...installedPacks];
    persistPackCatalog();
    pendingPack = null;
    packNotice = "Pack installed. Apply it when you want it on the overlay.";
  } catch (error) {
    packNotice = error instanceof Error ? error.message : "Duck Desk could not install that pack.";
  }
}

function applyInstalledPack(id: unknown): void {
  if (!isPackId(id)) {
    packNotice = "That pack is not installed.";
    return;
  }
  const record = installedPacks.find((pack) => pack.id === id);
  if (!record) {
    packNotice = "That pack is not installed.";
    return;
  }
  const previous = captureShowLook();
  try {
    const inspected = inspectDuckPackDirectory(path.join(resolvePacksRoot(), id));
    const next = derivePackApplyState(previous, inspected.manifest.setup);
    restoreShowLook({
      ...next,
      customSounds: { ...customSounds },
      customGifs: customGifs.filter((gif) => !gif.id.startsWith(`pack:${id}:`))
    });
    for (const asset of inspected.manifest.assets) {
      if (asset.sound) {
        installPackSound(id, asset.path, asset.sound, inspected.files.get(asset.path));
      } else if (asset.kind === "image" && asset.path.startsWith("assets/")) {
        const fileName = path.posix.basename(asset.path);
        const url = packMediaPublicUrl(id, fileName, false);
        if (!url) {
          throw new Error(`Pack image ${asset.path} could not be served.`);
        }
        customGifs = [{
          id: `pack:${id}:${fileName}`.slice(0, 80),
          label: asset.label || fileName,
          url
        }, ...customGifs.filter((gif) => gif.id !== `pack:${id}:${fileName}`.slice(0, 80))].slice(0, 24);
        activeAddOns.add("gif_reactions");
      }
    }
    packUndoSnapshot = previous;
    packNotice = `Applied ${inspected.manifest.name}. Undo is available until Duck Desk closes.`;
    audioRevision += 1;
    broadcast(createOverlayConfig());
    broadcastStatus();
  } catch (error) {
    restoreShowLook(previous);
    packNotice = error instanceof Error ? error.message : "Applying that pack failed, so the current setup was left unchanged.";
    broadcast(createOverlayConfig());
    broadcastStatus();
  }
}

function installPackSound(packId: string, relativePath: string, kind: SoundKind, data: Buffer | undefined): void {
  if (!data) {
    throw new Error(`Pack is missing ${relativePath}.`);
  }
  const soundDirectory = resolveCustomSoundDirectory();
  fs.mkdirSync(soundDirectory, { recursive: true });
  const sourceExtension = path.posix.extname(relativePath).toLowerCase() || ".wav";
  const sourcePath = path.join(soundDirectory, `pack-${packId}-${kind}-src${sourceExtension}`);
  const storedFileName = `pack-${packId}-${kind}.wav`;
  const destinationPath = path.join(soundDirectory, storedFileName);
  fs.writeFileSync(sourcePath, data);
  const conversion = convertCustomSoundToWav(sourcePath, destinationPath);
  fs.rmSync(sourcePath, { force: true });
  if (!conversion.ok) {
    fs.rmSync(destinationPath, { force: true });
    throw new Error(conversion.message);
  }
  customSounds[kind] = {
    storedFileName,
    displayName: path.posix.basename(relativePath).slice(0, 100)
  };
  activeAddOns.add("noise_machines");
}

function undoPackApply(): void {
  if (!packUndoSnapshot) {
    packNotice = "There is nothing to undo until a pack is applied in this session.";
    return;
  }
  restoreShowLook(packUndoSnapshot);
  packUndoSnapshot = null;
  packNotice = "Restored the setup from before the last pack apply.";
  audioRevision += 1;
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function removeInstalledPack(id: unknown): void {
  if (!isPackId(id)) {
    return;
  }
  installedPacks = installedPacks.filter((pack) => pack.id !== id);
  persistPackCatalog();
  fs.rmSync(path.join(resolvePacksRoot(), id), { recursive: true, force: true });
  customGifs = customGifs.filter((gif) => !gif.id.startsWith(`pack:${id}:`));
  packNotice = "Pack removed.";
  broadcast(createOverlayConfig());
  broadcastStatus();
}

async function exportInstalledPack(id: unknown): Promise<void> {
  if (!isPackId(id)) {
    packNotice = "That pack is not installed.";
    return;
  }
  const record = installedPacks.find((pack) => pack.id === id);
  if (!record) {
    packNotice = "That pack is not installed.";
    return;
  }
  try {
    const inspected = inspectDuckPackDirectory(path.join(resolvePacksRoot(), id));
    const archive = await createDuckPackArchive([...inspected.files.entries()].map(([name, data]) => ({ name, data })));
    await savePackArchive(`${sanitizeExportName(record.name)}.duckpack`, archive);
    packNotice = `Exported ${record.name}.`;
  } catch (error) {
    packNotice = error instanceof Error ? error.message : "Duck Desk could not export that pack.";
  }
}

async function exportCurrentSetup(): Promise<void> {
  try {
    const assets: Array<{ path: string; data: Buffer; kind: "image" | "audio"; sound?: SoundKind; label?: string }> = [
      { path: "preview.png", data: PACK_PREVIEW_FALLBACK_PNG, kind: "image" }
    ];
    for (const [kind, selection] of Object.entries(customSounds) as Array<[SoundKind, CustomSoundSelection]>) {
      const soundPath = resolveCustomSoundPath(selection);
      if (fs.existsSync(soundPath)) {
        assets.push({
          path: `assets/${kind}${path.extname(selection.storedFileName) || ".wav"}`,
          data: fs.readFileSync(soundPath),
          kind: "audio",
          sound: kind,
          label: selection.displayName
        });
      }
    }
    for (const [index, gif] of customGifs.entries()) {
      const local = localPackGifFile(gif.url);
      if (!local) {
        continue;
      }
      const extension = path.extname(local).toLowerCase() || ".png";
      assets.push({
        path: `assets/gif-${index + 1}${extension}`,
        data: fs.readFileSync(local),
        kind: "image",
        label: gif.label
      });
    }
    const assembled = assemblePackFiles({
      name: streamTitle || "Current Setup",
      author: "Duck Desk",
      packVersion: "1.0.0",
      description: "Exported from the current Duck Desk setup.",
      license: "MIT",
      preview: "preview.png",
      setup: {
        theme: activeTheme,
        skin: activeSkin,
        framePreset,
        reducedMotion,
        sceneMode,
        promoBanners,
        goals,
        alerts: alertVisuals
      }
    }, assets);
    const archive = await createDuckPackArchive(assembled.files);
    await savePackArchive(`${sanitizeExportName(assembled.manifest.name)}.duckpack`, archive);
    packNotice = "Exported the current setup.";
  } catch (error) {
    packNotice = error instanceof Error ? error.message : "Duck Desk could not export the current setup.";
  }
}

async function savePackArchive(defaultName: string, archive: Buffer): Promise<void> {
  const options: SaveDialogOptions = {
    title: "Export Duck Desk pack",
    defaultPath: defaultName,
    filters: [{ name: "Duckpack", extensions: ["duckpack"] }]
  };
  const result = mainWindow
    ? await dialog.showSaveDialog(mainWindow, options)
    : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) {
    return;
  }
  fs.writeFileSync(result.filePath, archive);
}

function sanitizeExportName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "duck-desk-pack";
}

function packMediaPublicUrl(packId: string, fileName: string, includeToken: boolean): string | null {
  const safe = path.basename(fileName);
  if (!safe || safe !== fileName) {
    return null;
  }
  const url = new URL(`http://localhost:${port}/pack-media/${encodeURIComponent(packId)}/${encodeURIComponent(safe)}`);
  if (includeToken) {
    url.searchParams.set("token", packMediaToken);
  }
  return url.href;
}

function withCurrentPackToken(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/pack-media/")) {
      return url;
    }
    parsed.protocol = "http:";
    parsed.host = `localhost:${port}`;
    parsed.searchParams.set("token", packMediaToken);
    return parsed.href;
  } catch {
    return url;
  }
}

function localPackGifFile(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/pack-media\/([^/]+)\/([^/]+)$/);
    if (!match || !isPackId(match[1])) {
      return null;
    }
    return resolvePackMediaFile(path.join(resolvePacksRoot(), match[1]), decodeURIComponent(match[2]));
  } catch {
    return null;
  }
}

function pendingPackPreview(): string | undefined {
  if (!pendingPack) {
    return undefined;
  }
  const preview = pendingPack.files.get(pendingPack.manifest.preview);
  if (!preview) {
    return undefined;
  }
  const kind = preview.subarray(0, 8).toString("hex").startsWith("89504e47")
    ? "png"
    : preview.subarray(0, 2).toString("hex") === "ffd8"
      ? "jpeg"
      : "webp";
  return `data:image/${kind};base64,${preview.toString("base64")}`;
}

function listPackStatus(): Array<InstalledPackRecord & { previewUrl?: string }> {
  return installedPacks.map((pack) => ({
    ...pack,
    previewUrl: packMediaPublicUrl(pack.id, pack.preview, true) ?? undefined
  }));
}

function loadUserRehearsals(): void {
  const loaded = loadRehearsalLibrary(rehearsalLibraryPath());
  userRehearsals = loaded.timelines;
  rehearsalNotice = loaded.quarantined
    ? "A saved rehearsal file was invalid and was set aside. Built-in scenarios are still available."
    : "";
}

function persistUserRehearsals(): void {
  saveRehearsalTimelines(rehearsalLibraryPath(), userRehearsals);
}

function showProfileLibraryPath(): string {
  return path.join(electronApp.getPath("userData"), "show-profiles.json");
}

function snapshotShowLook(): ShowLook {
  return {
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
    soundVolume,
    audioTheme,
    streamTitle,
    gifPlacement,
    gifSize,
    milestoneThresholds,
    hypeMeterSeconds,
    promoBanners,
    sceneMode,
    goals,
    auctionTimerSeconds,
    hideTopBanner,
    themeEffectsEnabled,
    alertVisuals,
    framePreset,
    reducedMotion
  };
}

function applyShowLook(look: ShowLook): void {
  applyConfigPatch({
    theme: look.theme,
    skin: look.skin,
    addOns: look.addOns,
    soundsEnabled: look.soundsEnabled,
    soundVolume: look.soundVolume,
    audioTheme: look.audioTheme,
    streamTitle: look.streamTitle,
    gifPlacement: look.gifPlacement,
    gifSize: look.gifSize,
    milestoneThresholds: look.milestoneThresholds,
    hypeMeterSeconds: look.hypeMeterSeconds,
    promoBanners: look.promoBanners,
    sceneMode: look.sceneMode,
    goals: look.goals,
    auctionTimerSeconds: look.auctionTimerSeconds,
    hideTopBanner: look.hideTopBanner,
    themeEffectsEnabled: look.themeEffectsEnabled,
    alertVisuals: look.alertVisuals
  });
  framePreset = look.framePreset;
  reducedMotion = look.reducedMotion;
}

function loadShowProfiles(): void {
  const loaded = loadShowProfileLibrary(showProfileLibraryPath());
  showProfiles = loaded.profiles;
  if (loaded.quarantined) {
    showNotice = "A saved show profile file was invalid and was set aside.";
  }
}

function persistShowProfiles(): void {
  saveShowProfileLibrary(showProfileLibraryPath(), showProfiles);
}

async function startNewShow(): Promise<void> {
  if (mainWindow) {
    const choice = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Start New Show", "Cancel"],
      defaultId: 1,
      cancelId: 1,
      title: "Start New Show",
      message: "Clear tonight's totals, game progress, recap, overlay queue, and event log?",
      detail: "Looks, sounds, alerts, packs, and saved rehearsals stay. Live totals and game progress cannot be undone."
    });
    if (choice.response !== 0) {
      return;
    }
  }
  rehearsalManager.stop();
  const reset = createShowSessionReset();
  stats.salesCount = reset.stats.salesCount;
  stats.grossSales = reset.stats.grossSales;
  stats.bidCount = reset.stats.bidCount;
  stats.audienceActions = reset.stats.audienceActions;
  stats.tipCount = reset.stats.tipCount;
  stats.tipTotal = reset.stats.tipTotal;
  stats.shareCount = reset.stats.shareCount;
  lastRealEventAt = reset.lastRealEventAt;
  rejectedEventCount = reset.rejectedEventCount;
  duplicateEventCount = reset.duplicateEventCount;
  lastEventFingerprint = reset.lastEventFingerprint;
  completedMilestones.clear();
  gameProgress = createGameProgressMap();
  demoMode = reset.demoMode;
  jumbotronCameraEnabled = reset.jumbotronCameraEnabled;
  sceneMode = reset.sceneMode;
  showEpoch += 1;
  showNotice = "New show started. Totals, game progress, recap, overlay queue, and the event log were cleared.";
  diagnosticRing.push("show", "Started a new show session");
  broadcast(createOverlayClear());
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function saveCurrentShowProfile(name: unknown): void {
  if (typeof name !== "string") {
    return;
  }
  const profile = createShowProfile(name, snapshotShowLook());
  showProfiles = upsertShowProfile(showProfiles, profile);
  activeShowProfileId = showProfiles[0]?.id ?? profile.id;
  showNotice = `Saved look “${showProfiles[0]?.name ?? profile.name}”.`;
  persistShowProfiles();
  broadcastStatus();
}

function loadShowProfileById(id: unknown): void {
  if (typeof id !== "string") {
    return;
  }
  const profile = showProfiles.find((entry) => entry.id === id);
  if (!profile) {
    showNotice = "That show profile is no longer saved.";
    broadcastStatus();
    return;
  }
  applyShowLook(profile.look);
  activeShowProfileId = profile.id;
  showNotice = `Loaded “${profile.name}”. Start New Show if last night's totals are still on screen.`;
  scheduleSettingsSave();
  broadcast(createOverlayConfig());
  broadcastStatus();
}

function deleteShowProfileById(id: unknown): void {
  if (typeof id !== "string") {
    return;
  }
  const profile = showProfiles.find((entry) => entry.id === id);
  showProfiles = showProfiles.filter((entry) => entry.id !== id);
  if (activeShowProfileId === id) {
    activeShowProfileId = showProfiles[0]?.id ?? "";
  }
  showNotice = profile ? `Removed “${profile.name}”.` : "That show profile was already gone.";
  persistShowProfiles();
  broadcastStatus();
}

async function exportShowProfileById(id: unknown): Promise<void> {
  if (typeof id !== "string" || !mainWindow) {
    return;
  }
  const profile = showProfiles.find((entry) => entry.id === id);
  if (!profile) {
    showNotice = "Save a look before exporting it.";
    broadcastStatus();
    return;
  }
  const target = await dialog.showSaveDialog(mainWindow, {
    title: "Export show profile",
    defaultPath: `${profile.name.replace(/[^\w\s-]+/g, "").trim() || "duck-desk-look"}.json`,
    filters: [{ name: "Duck Desk show profile", extensions: ["json"] }]
  } satisfies SaveDialogOptions);
  if (target.canceled || !target.filePath) {
    return;
  }
  fs.writeFileSync(target.filePath, `${JSON.stringify(serializeProfileExport(profile), null, 2)}\n`, { mode: 0o600 });
  showNotice = `Exported “${profile.name}”. Custom audio and GIFs stay on this computer.`;
  broadcastStatus();
}

async function importShowProfileFromDisk(): Promise<void> {
  if (!mainWindow) {
    return;
  }
  const picked = await dialog.showOpenDialog(mainWindow, {
    title: "Import show profile",
    properties: ["openFile"],
    filters: [{ name: "Duck Desk show profile", extensions: ["json"] }]
  } satisfies OpenDialogOptions);
  const filePath = picked.filePaths[0];
  if (picked.canceled || !filePath) {
    return;
  }
  try {
    const parsed = parseShowProfile(JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown);
    showProfiles = upsertShowProfile(showProfiles, parsed);
    applyShowLook(parsed.look);
    activeShowProfileId = showProfiles[0]?.id ?? parsed.id;
    showNotice = `Imported “${parsed.name}”.`;
    persistShowProfiles();
    scheduleSettingsSave();
    broadcast(createOverlayConfig());
    broadcastStatus();
  } catch (error) {
    showNotice = error instanceof Error ? error.message : "That profile could not be imported.";
    broadcastStatus();
  }
}

function listRehearsalSummaries(): Array<{
  id: string;
  name: string;
  durationMs: number;
  actionCount: number;
  builtIn: boolean;
}> {
  return [...createBuiltInRehearsals(), ...userRehearsals].map((timeline) => ({
    id: timeline.id,
    name: timeline.name,
    durationMs: timeline.durationMs,
    actionCount: timeline.actions.length,
    builtIn: Boolean(timeline.builtIn)
  }));
}

function findRehearsal(id: string): RehearsalTimeline | undefined {
  return userRehearsals.find((item) => item.id === id)
    ?? createBuiltInRehearsals().find((item) => item.id === id);
}

function startRehearsal(id: unknown): void {
  if (typeof id !== "string") {
    return;
  }
  const timeline = findRehearsal(id);
  if (!timeline) {
    return;
  }
  rehearsalNotice = "";
  rehearsalManager.start(timeline);
}

function saveRehearsalRecording(name: unknown): void {
  if (userRehearsals.length >= 50) {
    rehearsalNotice = "Saved rehearsal limit reached. Delete one before recording another.";
    return;
  }
  const saved = rehearsalManager.saveRecording(randomUUID(), typeof name === "string" ? name : "Recorded Rehearsal");
  if (!saved) {
    rehearsalNotice = "Record at least one event or trigger before saving.";
    return;
  }
  userRehearsals = [...userRehearsals, saved];
  persistUserRehearsals();
  rehearsalNotice = "";
}

function renameUserRehearsal(id: unknown, name: unknown): void {
  if (typeof id !== "string" || typeof name !== "string") {
    return;
  }
  const nextName = sanitizeTimelineName(name);
  userRehearsals = userRehearsals.map((timeline) => (
    timeline.id === id ? { ...timeline, name: nextName } : timeline
  ));
  persistUserRehearsals();
}

function deleteUserRehearsal(id: unknown): void {
  if (typeof id !== "string") {
    return;
  }
  if (rehearsalManager.getStatus().activeId === id) {
    rehearsalManager.stop();
  }
  userRehearsals = userRehearsals.filter((timeline) => timeline.id !== id);
  persistUserRehearsals();
}

function syncRehearsalTick(): void {
  const state = rehearsalManager.getStatus().state;
  if (state === "playing" || state === "recording") {
    if (!rehearsalTick) {
      rehearsalTick = setInterval(() => broadcastStatus(), 250);
    }
    return;
  }
  stopRehearsalTick();
}

function stopRehearsalTick(): void {
  if (rehearsalTick) {
    clearInterval(rehearsalTick);
    rehearsalTick = null;
  }
}

function previewAlert(kind: unknown): void {
  if (!isAlertKind(kind)) {
    return;
  }
  const timestamp = Date.now();
  if (kind === "sale") {
    receiveEvent({ type: "sale", buyer: "StudioPreview", amount: 48, item: "Preview Lot", timestamp }, "demo");
    return;
  }
  if (kind === "bid") {
    receiveEvent({ type: "bid", bidder: "StudioBidder", amount: 22, item: "Preview Lot", timestamp }, "demo");
    return;
  }
  if (kind === "tip") {
    receiveEvent({ type: "tip", tipper: "StudioTipper", amount: 10, message: "Great show", timestamp }, "demo");
    return;
  }
  if (kind === "share") {
    receiveEvent({ type: "share", actor: "StudioSharer", delta: 1, timestamp }, "demo");
    return;
  }
  receiveEvent({
    type: "audience_action",
    actor: "StudioViewer",
    action: "reaction",
    message: "Alert preview",
    timestamp
  }, "demo");
}

function applyConfigPatch(input: unknown): void {
  if (!isRecord(input)) {
    throw new Error("Config body must be an object.");
  }

  if ("theme" in input) {
    if (!isOverlayTheme(input.theme)) {
      throw new Error("Invalid overlay theme.");
    }
    activeTheme = input.theme;
    activeSkin = "none";
  }

  if ("skin" in input) {
    if (!isOverlaySkin(input.skin)) {
      throw new Error("Invalid overlay skin.");
    }
    activeSkin = input.skin;
    if (input.skin !== "none") {
      activeAddOns.add("stream_skins");
    }
  }

  if ("addOns" in input) {
    if (!Array.isArray(input.addOns) || !input.addOns.every(isAddOnId)) {
      throw new Error("Invalid add-on list.");
    }
    activeAddOns.clear();
    for (const addOn of input.addOns) {
      activeAddOns.add(addOn);
    }
    if (!activeAddOns.has("stream_skins")) {
      activeSkin = "none";
    }
  }

  if ("soundsEnabled" in input) {
    if (typeof input.soundsEnabled !== "boolean") {
      throw new Error("Invalid sound setting.");
    }
    soundsEnabled = input.soundsEnabled;
  }

  if ("soundVolume" in input) {
    if (typeof input.soundVolume !== "number" || !Number.isFinite(input.soundVolume)) {
      throw new Error("Invalid sound volume.");
    }
    soundVolume = Math.max(0, Math.min(1, input.soundVolume));
  }

  if ("audioTheme" in input) {
    if (!isAudioTheme(input.audioTheme)) {
      throw new Error("Invalid audio theme.");
    }
    audioTheme = input.audioTheme;
  }

  if ("streamTitle" in input) {
    if (typeof input.streamTitle !== "string") {
      throw new Error("Invalid stream title.");
    }
    streamTitle = sanitizeStreamTitle(input.streamTitle);
  }

  if ("customGifUrls" in input) {
    if (!Array.isArray(input.customGifUrls)) {
      throw new Error("Invalid custom GIF URL list.");
    }

    const normalizedUrls = input.customGifUrls.map((url) => (
      typeof url === "string" ? normalizeGifUrl(url) : null
    ));
    if (normalizedUrls.some((url) => url === null)) {
      throw new Error("Invalid custom GIF URL list.");
    }
    customGifs = [...new Set(normalizedUrls as string[])].slice(0, 24).map((url, index) => ({
      id: customGifs.find((gif) => gif.url === url)?.id ?? randomUUID(),
      label: customGifs.find((gif) => gif.url === url)?.label ?? createDefaultGifLabel(url, index + 1),
      url
    }));
  }

  if ("gifPlacement" in input) {
    if (!isGifPlacement(input.gifPlacement)) {
      throw new Error("Invalid GIF placement.");
    }
    gifPlacement = input.gifPlacement;
  }

  if ("gifSize" in input) {
    if (!isGifSize(input.gifSize)) {
      throw new Error("Invalid GIF size.");
    }
    gifSize = input.gifSize;
  }

  if ("milestoneThresholds" in input) {
    if (
      !Array.isArray(input.milestoneThresholds) ||
      !input.milestoneThresholds.every((amount) => typeof amount === "number" && Number.isFinite(amount))
    ) {
      throw new Error("Invalid milestone thresholds.");
    }
    milestoneThresholds = [...new Set(input.milestoneThresholds)].filter((amount) => amount > 0).sort((a, b) => a - b);
  }

  if ("hypeMeterSeconds" in input) {
    if (typeof input.hypeMeterSeconds !== "number" || !Number.isFinite(input.hypeMeterSeconds)) {
      throw new Error("Invalid hype meter duration.");
    }
    hypeMeterSeconds = Math.max(10, Math.min(120, Math.round(input.hypeMeterSeconds)));
  }

  if ("jumbotronCameraEnabled" in input) {
    if (typeof input.jumbotronCameraEnabled !== "boolean") {
      throw new Error("Invalid jumbotron camera setting.");
    }
    jumbotronCameraEnabled = input.jumbotronCameraEnabled;
  }

  if ("promoBanners" in input) {
    if (!Array.isArray(input.promoBanners) || !input.promoBanners.every((banner) => typeof banner === "string")) {
      throw new Error("Invalid promo banners.");
    }
    promoBanners = input.promoBanners.map((banner) => banner.trim()).filter(Boolean).slice(0, 12);
  }

  if ("sceneMode" in input) {
    if (!isSceneMode(input.sceneMode)) {
      throw new Error("Invalid scene mode.");
    }
    sceneMode = input.sceneMode;
  }

  if ("goals" in input) {
    if (!Array.isArray(input.goals)) {
      throw new Error("Invalid goals.");
    }

    goals = input.goals
      .map((goal) => {
        if (!isRecord(goal)) {
          return null;
        }
        const kind = goal.kind;
        const target = goal.target;
        const label = goal.label;
        if (
          (kind !== "sales" && kind !== "orders" && kind !== "hype" && kind !== "follows") ||
          typeof target !== "number" ||
          !Number.isFinite(target) ||
          target <= 0 ||
          typeof label !== "string"
        ) {
          return null;
        }
        return { kind, target, label: sanitizeGoalLabel(label) };
      })
      .filter((goal): goal is GoalConfig => goal !== null)
      .slice(0, 4);
  }

  if ("auctionTimerSeconds" in input) {
    if (typeof input.auctionTimerSeconds !== "number" || !Number.isFinite(input.auctionTimerSeconds)) {
      throw new Error("Invalid auction timer duration.");
    }
    auctionTimerSeconds = Math.max(5, Math.min(900, Math.round(input.auctionTimerSeconds)));
  }

  if ("hideTopBanner" in input) {
    if (typeof input.hideTopBanner !== "boolean") {
      throw new Error("Invalid top banner setting.");
    }
    hideTopBanner = input.hideTopBanner;
  }

  if ("themeEffectsEnabled" in input) {
    if (typeof input.themeEffectsEnabled !== "boolean") {
      throw new Error("Invalid theme effects setting.");
    }
    themeEffectsEnabled = input.themeEffectsEnabled;
  }

  if ("alertVisuals" in input) {
    alertVisuals = normalizeAlertVisualMap(input.alertVisuals);
  }

  if ("gameProgress" in input) {
    gameProgress = normalizeGameProgressMap(input.gameProgress);
  }
}

function checkMilestones(): void {
  if (!activeAddOns.has("milestones")) {
    return;
  }

  for (const threshold of milestoneThresholds) {
    if (stats.grossSales >= threshold && !completedMilestones.has(threshold)) {
      completedMilestones.add(threshold);
      broadcast(createOverlayMilestoneTrigger(threshold));
      broadcast(createOverlayBurstTrigger());
    }
  }
}

function playEventSound(event: ShowEvent): void {
  if (!soundsEnabled || soundVolume === 0) {
    return;
  }

  playSoundKind(event.type === "audience_action" ? "action" : event.type, event.timestamp);
}

function playSoundKind(kind: SoundKind, eventKey: string | number = Date.now()): void {
  const now = Date.now();
  const decision = nativeAudioScheduler.request(kind, now, eventKey);
  if (decision.action === "drop") {
    return;
  }

  if (decision.action === "queue") {
    const timer = setTimeout(() => {
      nativeSoundTimers.delete(timer);
      if (soundsEnabled && soundVolume > 0) {
        startNativeSound(kind, decision.variant, true);
      }
    }, decision.delayMs);
    nativeSoundTimers.add(timer);
    return;
  }

  startNativeSound(kind, decision.variant, decision.interrupt);
}

function startNativeSound(kind: SoundKind, variant: number, interrupt: boolean): void {
  const selection = customSounds[kind];
  const customPath = selection ? resolveCustomSoundPath(selection) : undefined;
  const selectedSource = selectAudioCueSource(kind, variant, customPath);
  const soundPath = customPath
    ? selectedSource
    : path.join(resolveOverlayPath(), "audio", audioTheme, selectedSource);

  if (!fs.existsSync(soundPath) || !fs.statSync(soundPath).isFile()) {
    reportAudioPlaybackError(`Missing ${soundKindName(kind)} sound for ${audioThemeName(audioTheme)}`);
    return;
  }

  try {
    if (interrupt) {
      stopNativePlayer();
    }
    const player = process.platform === "win32"
      ? spawnWindowsSoundPlayer(soundPath, soundVolume)
      : spawn("/usr/bin/afplay", ["-v", String(soundVolume), soundPath], {
          detached: true,
          stdio: "ignore"
        });
    nativeSoundPlayer = player;
    player.once("error", (error) => reportAudioPlaybackError(`Could not play ${soundKindName(kind)}: ${error.message}`));
    player.once("exit", () => {
      if (nativeSoundPlayer === player) {
        nativeSoundPlayer = null;
      }
    });
    player.unref();
  } catch (error) {
    reportAudioPlaybackError(`Could not play ${soundKindName(kind)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function stopNativeSound(): void {
  for (const timer of nativeSoundTimers) {
    clearTimeout(timer);
  }
  nativeSoundTimers.clear();
  nativeAudioScheduler.reset();
  stopNativePlayer();
}

function stopNativePlayer(): void {
  if (nativeSoundPlayer && !nativeSoundPlayer.killed) {
    nativeSoundPlayer.kill();
  }
  nativeSoundPlayer = null;
}

function reportAudioPlaybackError(message: string): void {
  log(`audio playback error: ${message}`);
  audioNotice = message;
  audioRevision += 1;
  broadcastStatus();
}

function broadcast(
  event:
    | ShowEvent
    | ReturnType<typeof createOverlayConfig>
    | ReturnType<typeof createOverlayClear>
    | ReturnType<typeof createOverlayGifTrigger>
    | ReturnType<typeof createOverlaySoundTrigger>
    | ReturnType<typeof createOverlayBurstTrigger>
    | ReturnType<typeof createOverlayMilestoneTrigger>
    | ReturnType<typeof createOverlayHypeMeterTrigger>
    | ReturnType<typeof createOverlayAuctionTimerTrigger>
    | ReturnType<typeof createOverlayRecapTrigger>
): void {
  if (event.type === "overlay_config") {
    scheduleSettingsSave();
  }
  const payload = JSON.stringify(event);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function loadSettings(): void {
  const settingsPath = resolveSettingsPath();
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as unknown;
    if (!isRecord(parsed)) {
      throw new Error("Settings file does not contain an object.");
    }

    applyConfigPatch(parsed);
    if (Array.isArray(parsed.customGifs)) {
      const loadedGifs: CustomGif[] = [];
      const seenUrls = new Set<string>();
      for (const candidate of parsed.customGifs) {
        if (!isRecord(candidate)) {
          continue;
        }
        const url = typeof candidate.url === "string" ? normalizeGifUrl(candidate.url) : null;
        if (!url || seenUrls.has(url)) {
          continue;
        }
        seenUrls.add(url);
        loadedGifs.push({
          id: typeof candidate.id === "string" && candidate.id.length <= 80 ? candidate.id : randomUUID(),
          label: sanitizeGifLabel(typeof candidate.label === "string" ? candidate.label : "")
            || createDefaultGifLabel(url, loadedGifs.length + 1),
          url
        });
      }
      customGifs = loadedGifs.slice(0, 24);
    }
    if (isRecord(parsed.customSounds)) {
      const loadedSounds: Partial<Record<SoundKind, CustomSoundSelection>> = {};
      for (const [kind, candidate] of Object.entries(parsed.customSounds)) {
        if (!isSoundKind(kind) || !isRecord(candidate)) {
          continue;
        }
        const storedFileName = typeof candidate.storedFileName === "string"
          ? path.basename(candidate.storedFileName)
          : "";
        const displayName = typeof candidate.displayName === "string"
          ? path.basename(candidate.displayName).slice(0, 100)
          : storedFileName;
        if (!isAllowedAudioFileName(storedFileName)) {
          continue;
        }

        const selection = { storedFileName, displayName };
        const sourcePath = resolveCustomSoundPath(selection);
        if (!fs.existsSync(sourcePath)) {
          continue;
        }

        if (path.extname(storedFileName).toLowerCase() === ".wav") {
          loadedSounds[kind] = selection;
          continue;
        }

        const migratedFileName = `${kind}.wav`;
        const migratedSelection = { storedFileName: migratedFileName, displayName };
        const conversion = convertCustomSoundToWav(sourcePath, resolveCustomSoundPath(migratedSelection));
        if (conversion.ok) {
          loadedSounds[kind] = migratedSelection;
          fs.rmSync(sourcePath, { force: true });
        } else {
          log(`unable to migrate custom ${kind} sound: ${conversion.message}`);
        }
      }
      customSounds = loadedSounds;
    }
    if (typeof parsed.firstRunComplete === "boolean") {
      firstRunComplete = parsed.firstRunComplete;
    } else {
      firstRunComplete = true;
    }
    if (typeof parsed.hideTopBanner === "boolean") {
      hideTopBanner = parsed.hideTopBanner;
    }
    if ("alertVisuals" in parsed) {
      alertVisuals = normalizeAlertVisualMap(parsed.alertVisuals);
    }
    if (parsed.framePreset === "theme" || parsed.framePreset === "broadcast" || parsed.framePreset === "none") {
      framePreset = parsed.framePreset;
    }
    if (typeof parsed.reducedMotion === "boolean") {
      reducedMotion = parsed.reducedMotion;
    }
    log(`loaded creator settings version ${readNumber(parsed, "version") ?? 1}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      for (const addOn of showReadyAddOns) {
        activeAddOns.add(addOn);
      }
    } else if (tryLoadSettingsBackup()) {
      recoveryNotice = [recoveryNotice, "Creator settings were restored from the last good backup."]
        .filter(Boolean)
        .join(" ");
    } else {
      log(`unable to load creator settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function scheduleSettingsSave(): void {
  if (!electronApp.isReady()) {
    return;
  }
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer);
  }
  settingsSaveTimer = setTimeout(() => {
    settingsSaveTimer = null;
    saveSettings();
  }, 150);
}

function saveSettings(): void {
  const settingsPath = resolveSettingsPath();
  const temporaryPath = `${settingsPath}.tmp`;
  const backupPath = `${settingsPath}.bak`;
  const settings: PersistedSettings = {
    version: 1,
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
    soundVolume,
    audioTheme,
    customSounds,
    streamTitle,
    customGifUrls: customGifs.map((gif) => gif.url),
    customGifs,
    gifPlacement,
    gifSize,
    milestoneThresholds,
    hypeMeterSeconds,
    jumbotronCameraEnabled,
    promoBanners,
    sceneMode,
    goals,
    auctionTimerSeconds,
    hideTopBanner,
    themeEffectsEnabled,
    alertVisuals,
    framePreset,
    reducedMotion,
    gameProgress,
    firstRunComplete
  };

  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    if (fs.existsSync(settingsPath)) {
      fs.copyFileSync(settingsPath, backupPath);
    }
    fs.writeFileSync(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryPath, settingsPath);
  } catch (error) {
    log(`unable to save creator settings: ${error instanceof Error ? error.message : String(error)}`);
    try {
      fs.rmSync(temporaryPath, { force: true });
    } catch {
      // Best-effort cleanup after an interrupted settings write.
    }
  }
}

function resolveSettingsPath(): string {
  return path.join(electronApp.getPath("userData"), "creator-settings.json");
}

function resolveCustomSoundDirectory(): string {
  return path.join(electronApp.getPath("userData"), "custom-audio");
}

function resolveCustomSoundPath(selection: CustomSoundSelection): string {
  return path.join(resolveCustomSoundDirectory(), path.basename(selection.storedFileName));
}

function isAllowedAudioFileName(fileName: string): boolean {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  return path.basename(fileName) === fileName && allowedAudioExtensions.includes(extension as typeof allowedAudioExtensions[number]);
}

function spawnWindowsSoundPlayer(soundPath: string, volume: number): ChildProcess {
  const uri = pathToFileURL(soundPath).href.replace(/'/g, "''");
  const script = [
    "Add-Type -AssemblyName PresentationCore",
    "$player = New-Object System.Windows.Media.MediaPlayer",
    `$player.Open([Uri]'${uri}')`,
    `$player.Volume = ${Math.max(0, Math.min(1, volume))}`,
    "$player.Play()",
    "while (-not $player.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 40 }",
    "Start-Sleep -Milliseconds ([int]$player.NaturalDuration.TimeSpan.TotalMilliseconds)"
  ].join("; ");
  return spawn("powershell.exe", ["-NoProfile", "-STA", "-WindowStyle", "Hidden", "-Command", script], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
}

function inspectAudioFile(filePath: string): { ok: true } | { ok: false; message: string } {
  if (process.platform === "darwin") {
    const inspection = spawnSync("/usr/bin/afinfo", [filePath], {
      encoding: "utf8",
      timeout: 5_000,
      maxBuffer: 512 * 1024
    });
    if (inspection.status !== 0 || inspection.error) {
      return { ok: false, message: "That file is not playable audio" };
    }

    const details = `${inspection.stdout}\n${inspection.stderr}`;
    const durationMatch = details.match(/estimated duration:\s*([\d.]+)\s*sec/i);
    const duration = durationMatch ? Number(durationMatch[1]) : Number.NaN;
    if (!Number.isFinite(duration) || duration <= 0) {
      return { ok: false, message: "Duck Desk could not read that audio file" };
    }
    if (duration > 12) {
      return { ok: false, message: "Choose a sound that is 12 seconds or shorter" };
    }
    return { ok: true };
  }

  const wavDuration = readWavDurationSeconds(filePath);
  if (wavDuration !== null) {
    if (wavDuration <= 0) {
      return { ok: false, message: "Duck Desk could not read that audio file" };
    }
    if (wavDuration > 12) {
      return { ok: false, message: "Choose a sound that is 12 seconds or shorter" };
    }
  }
  return { ok: true };
}

function readWavDurationSeconds(filePath: string): number | null {
  try {
    const header = Buffer.alloc(44);
    const fd = fs.openSync(filePath, "r");
    try {
      if (fs.readSync(fd, header, 0, 44, 0) < 44) {
        return null;
      }
    } finally {
      fs.closeSync(fd);
    }
    if (header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WAVE") {
      return null;
    }
    const byteRate = header.readUInt32LE(28);
    if (!byteRate) {
      return null;
    }
    return Math.max(0, (fs.statSync(filePath).size - 44) / byteRate);
  } catch {
    return null;
  }
}

function convertCustomSoundToWav(
  sourcePath: string,
  destinationPath: string
): { ok: true } | { ok: false; message: string } {
  const temporaryPath = `${destinationPath}.${randomUUID()}.tmp.wav`;
  if (process.platform !== "darwin") {
    try {
      fs.copyFileSync(sourcePath, temporaryPath);
      fs.renameSync(temporaryPath, destinationPath);
      return { ok: true };
    } catch (error) {
      fs.rmSync(temporaryPath, { force: true });
      log(`unable to store custom sound: ${error instanceof Error ? error.message : String(error)}`);
      return { ok: false, message: "Duck Desk could not store that sound" };
    }
  }

  const conversion = spawnSync(
    "/usr/bin/afconvert",
    [sourcePath, temporaryPath, "-f", "WAVE", "-d", "LEI16@32000", "-c", "1"],
    {
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 512 * 1024
    }
  );

  if (conversion.status !== 0 || conversion.error || !fs.existsSync(temporaryPath)) {
    fs.rmSync(temporaryPath, { force: true });
    log(`audio conversion failed: ${conversion.error?.message ?? conversion.stderr ?? "unknown error"}`);
    return { ok: false, message: "Duck Desk could not prepare that sound for OBS" };
  }

  try {
    fs.renameSync(temporaryPath, destinationPath);
    return { ok: true };
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    log(`unable to store converted sound: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, message: "Duck Desk could not store that sound" };
  }
}

function isAllowedBridgeOrigin(origin: string): boolean {
  if (origin.startsWith("chrome-extension://")) {
    return true;
  }
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (url.hostname === "whatnot.com" || url.hostname.endsWith(".whatnot.com"));
  } catch {
    return false;
  }
}

function isAllowedWebSocketOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "http:"
      && (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      && url.port === String(port);
  } catch {
    return false;
  }
}

function createCustomSoundUrls(): Partial<Record<SoundKind, string>> {
  const urls: Partial<Record<SoundKind, string>> = {};
  for (const kind of ["sale", "bid", "action", "tip", "share"] as const) {
    const selection = customSounds[kind];
    if (!selection) {
      continue;
    }
    const soundPath = resolveCustomSoundPath(selection);
    if (fs.existsSync(soundPath)) {
      urls[kind] = `/custom-audio/${kind}?token=${encodeURIComponent(customAudioToken)}&v=${Math.round(fs.statSync(soundPath).mtimeMs)}`;
    }
  }
  return urls;
}

function audioThemeName(theme: AudioTheme): string {
  return {
    neon_pulse: "Neon Pulse",
    arcade_8bit: "8-Bit Arcade",
    broadcast: "Broadcast Pro",
    crystal: "Crystal Chimes",
    duck_party: "Duck Party",
    luxury: "Luxury Lounge",
    retro: "Retro Console",
    stadium: "Stadium Hype",
    storm: "Thunder Strike",
    zen: "Soft Focus"
  }[theme];
}

function soundKindName(kind: SoundKind): string {
  return {
    sale: "Sale",
    bid: "Bid",
    action: "Audience action",
    tip: "Tip",
    share: "Share"
  }[kind];
}

function broadcastStatus(): void {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send("duck-desk:status", getStatus());
  }
}

async function refreshRemoteQr(): Promise<void> {
  const remoteUrl = remoteSession.getConnectionInfo().url;
  if (!remoteUrl) {
    remoteQrDataUrl = "";
    remoteQrUrl = "";
    remoteQrPendingUrl = "";
    return;
  }
  if (remoteUrl === remoteQrUrl || remoteUrl === remoteQrPendingUrl) {
    return;
  }
  remoteQrPendingUrl = remoteUrl;
  try {
    const dataUrl = await QRCode.toDataURL(remoteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#071014", light: "#f3f8f7" }
    });
    if (remoteQrPendingUrl === remoteUrl) {
      remoteQrDataUrl = dataUrl;
      remoteQrUrl = remoteUrl;
    }
  } catch (error) {
    log(`unable to create Remote Deck QR code: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (remoteQrPendingUrl === remoteUrl) {
      remoteQrPendingUrl = "";
    }
  }
}

function createRemoteControlStatus(): {
  ok: boolean;
  obsReady: boolean;
  sceneMode: SceneMode;
  sceneLabel: string;
  bannerVisible: boolean;
  effectsEnabled: boolean;
  salesCount: number;
  grossSales: number;
  bidCount: number;
  tipTotal: number;
  shareCount: number;
  gifs: Array<{ id: string; label: string }>;
} {
  return {
    ok: !lastError,
    obsReady: obsStatus.startsWith("Added") || obsStatus.startsWith("Updated"),
    sceneMode,
    sceneLabel: {
      none: "Live",
      starting: "Starting",
      auction: "Auction",
      break: "Break",
      winner: "Winner",
      ending: "Ending"
    }[sceneMode],
    bannerVisible: !hideTopBanner,
    effectsEnabled: themeEffectsEnabled,
    salesCount: stats.salesCount,
    grossSales: stats.grossSales,
    bidCount: stats.bidCount,
    tipTotal: stats.tipTotal,
    shareCount: stats.shareCount,
    gifs: customGifs.map(({ id, label }) => ({ id, label }))
  };
}

function getStatus(): {
  ok: boolean;
  port: number;
  overlayUrl: string;
  clients: number;
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  tipCount: number;
  tipTotal: number;
  shareCount: number;
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
  soundVolume: number;
  audioTheme: AudioTheme;
  customSounds: Partial<Record<SoundKind, string>>;
  audioNotice: string;
  audioRevision: number;
  demoMode: boolean;
  streamTitle: string;
  customGifUrls: string[];
  customGifs: CustomGif[];
  gifPlacement: GifPlacement;
  gifSize: GifSize;
  milestoneThresholds: number[];
  hypeMeterSeconds: number;
  jumbotronCameraEnabled: boolean;
  promoBanners: string[];
  sceneMode: SceneMode;
  goals: GoalConfig[];
  auctionTimerSeconds: number;
  hideTopBanner: boolean;
  themeEffectsEnabled: boolean;
  alertVisuals: AlertVisualMap;
  firstRunComplete: boolean;
  platform: NodeJS.Platform;
  obsStatus: string;
  extensionConnected: boolean;
  whatnotPageActive: boolean;
  remoteAvailable: boolean;
  remoteUrl?: string;
  remotePairingCode: string;
  remoteQrDataUrl?: string;
  remoteClients: number;
  remoteLastSeenAt?: number;
  lastRealEventAt?: number;
  rehearsal: RehearsalStatus;
  rehearsals: Array<{
    id: string;
    name: string;
    durationMs: number;
    actionCount: number;
    builtIn: boolean;
  }>;
  rehearsalNotice?: string;
  packs: Array<InstalledPackRecord & { previewUrl?: string }>;
  pendingPack?: {
    name: string;
    author: string;
    packVersion: string;
    license: string;
    description: string;
    projectUrl?: string;
    review: Array<{ label: string; detail: string }>;
    previewDataUrl?: string;
  };
  packUndoAvailable: boolean;
  packNotice?: string;
  framePreset: PackFramePreset;
  reducedMotion: boolean;
  gameState?: GameThemeProgress;
  showEpoch: number;
  showNotice?: string;
  showProfiles: Array<{ id: string; name: string; updatedAt: number }>;
  activeShowProfileId?: string;
  healthChecks: HealthCheck[];
  update: UpdateStatus;
  recoveryNotice?: string;
  rejectedEventCount: number;
  duplicateEventCount: number;
  lastError?: string;
} {
  const extensionConnected = Date.now() - extensionLastSeenAt < 30_000;
  const remote = remoteSession.getConnectionInfo();
  if (remote.url && remote.url !== remoteQrUrl && remote.url !== remoteQrPendingUrl) {
    void refreshRemoteQr().then(broadcastStatus);
  }
  return {
    ok: !lastError,
    port,
    overlayUrl,
    clients: clients.size,
    salesCount: stats.salesCount,
    grossSales: stats.grossSales,
    bidCount: stats.bidCount,
    audienceActions: stats.audienceActions,
    tipCount: stats.tipCount,
    tipTotal: stats.tipTotal,
    shareCount: stats.shareCount,
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
    soundVolume,
    audioTheme,
    customSounds: Object.fromEntries(
      Object.entries(customSounds).map(([kind, selection]) => [kind, selection.displayName])
    ),
    audioNotice,
    audioRevision,
    demoMode,
    streamTitle,
    customGifUrls: customGifs.map((gif) => withCurrentPackToken(gif.url)),
    customGifs: customGifs.map((gif) => ({ ...gif, url: withCurrentPackToken(gif.url) })),
    gifPlacement,
    gifSize,
    milestoneThresholds,
    hypeMeterSeconds,
    jumbotronCameraEnabled,
    promoBanners,
    sceneMode,
    goals,
    auctionTimerSeconds,
    hideTopBanner,
    themeEffectsEnabled,
    alertVisuals,
    firstRunComplete,
    platform: process.platform,
    obsStatus,
    extensionConnected,
    whatnotPageActive: extensionConnected && whatnotPageReportedActive,
    remoteAvailable: remote.available,
    remoteUrl: remote.url,
    remotePairingCode: remote.pairingCode,
    remoteQrDataUrl: remote.url === remoteQrUrl ? remoteQrDataUrl : undefined,
    remoteClients: remoteSession.activeClientCount(),
    remoteLastSeenAt: remoteSession.lastSeenAt(),
    lastRealEventAt: lastRealEventAt || undefined,
    rehearsal: rehearsalManager.getStatus(),
    rehearsals: listRehearsalSummaries(),
    rehearsalNotice: rehearsalNotice || undefined,
    packs: listPackStatus(),
    pendingPack: pendingPack
      ? {
          name: pendingPack.manifest.name,
          author: pendingPack.manifest.author,
          packVersion: pendingPack.manifest.packVersion,
          license: pendingPack.manifest.license,
          description: pendingPack.manifest.description,
          projectUrl: pendingPack.manifest.projectUrl,
          review: pendingPack.review,
          previewDataUrl: pendingPackPreview()
        }
      : undefined,
    packUndoAvailable: Boolean(packUndoSnapshot),
    packNotice: packNotice || undefined,
    framePreset,
    reducedMotion,
    gameState: currentGameState(),
    showEpoch,
    showNotice: showNotice || undefined,
    showProfiles: showProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      updatedAt: profile.updatedAt
    })),
    activeShowProfileId: activeShowProfileId || undefined,
    healthChecks: buildHealthChecks(),
    update: updateStatus,
    recoveryNotice: recoveryNotice || undefined,
    rejectedEventCount,
    duplicateEventCount,
    lastError
  };
}

function createOverlayConfig(): {
  type: "overlay_config";
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
  soundVolume: number;
  audioTheme: AudioTheme;
  customSoundUrls: Partial<Record<SoundKind, string>>;
  streamTitle: string;
  customGifUrls: string[];
  gifPlacement: GifPlacement;
  gifSize: GifSize;
  milestoneThresholds: number[];
  hypeMeterSeconds: number;
  jumbotronCameraEnabled: boolean;
  promoBanners: string[];
  sceneMode: SceneMode;
  goals: GoalConfig[];
  auctionTimerSeconds: number;
  hideTopBanner: boolean;
  themeEffectsEnabled: boolean;
  alertVisuals: AlertVisualMap;
  framePreset: PackFramePreset;
  reducedMotion: boolean;
  gameState?: GameThemeProgress;
  timestamp: number;
} {
  return {
    type: "overlay_config",
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
    soundVolume,
    audioTheme,
    customSoundUrls: createCustomSoundUrls(),
    streamTitle,
    customGifUrls: customGifs.map((gif) => withCurrentPackToken(gif.url)),
    gifPlacement,
    gifSize,
    milestoneThresholds,
    hypeMeterSeconds,
    jumbotronCameraEnabled,
    promoBanners,
    sceneMode,
    goals,
    auctionTimerSeconds,
    hideTopBanner,
    themeEffectsEnabled,
    alertVisuals,
    framePreset,
    reducedMotion,
    gameState: currentGameState(),
    timestamp: Date.now()
  };
}

function currentGameState(): GameThemeProgress | undefined {
  const game = gameThemeFromSkin(activeSkin);
  return game ? gameProgress[game] : undefined;
}

function parseGoals(rawGoals: string): GoalConfig[] {
  return rawGoals
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): GoalConfig | null => {
      const [kindInput, targetInput, ...labelParts] = line.split("|").map((part) => part.trim());
      const target = Number(targetInput);
      const kind = kindInput?.toLowerCase();
      if (
        (kind !== "sales" && kind !== "orders" && kind !== "hype" && kind !== "follows") ||
        !Number.isFinite(target) ||
        target <= 0
      ) {
        return null;
      }

      return {
        kind,
        target,
        label: sanitizeGoalLabel(labelParts.join(" | ") || defaultGoalLabel(kind))
      };
    })
    .filter((goal): goal is GoalConfig => goal !== null)
    .slice(0, 4);
}

function sanitizeGoalLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim().slice(0, 34);
}

function defaultGoalLabel(kind: GoalConfig["kind"]): string {
  if (kind === "sales") {
    return "Sales Goal";
  }
  if (kind === "orders") {
    return "Order Goal";
  }
  if (kind === "hype") {
    return "Hype Goal";
  }
  return "Follower Goal";
}

function createOverlayGifTrigger(url: string): {
  type: "gif_trigger";
  url: string;
  timestamp: number;
} {
  return {
    type: "gif_trigger",
    url: withCurrentPackToken(url),
    timestamp: Date.now()
  };
}

function createOverlaySoundTrigger(kind: SoundKind): {
  type: "sound_trigger";
  kind: SoundKind;
  timestamp: number;
} {
  return {
    type: "sound_trigger",
    kind,
    timestamp: Date.now()
  };
}

function createOverlayBurstTrigger(): {
  type: "burst_trigger";
  timestamp: number;
} {
  return {
    type: "burst_trigger",
    timestamp: Date.now()
  };
}

function createOverlayMilestoneTrigger(amount: number): {
  type: "milestone_trigger";
  amount: number;
  label: string;
  timestamp: number;
} {
  return {
    type: "milestone_trigger",
    amount,
    label: `$${amount.toLocaleString()} milestone`,
    timestamp: Date.now()
  };
}

function createOverlayHypeMeterTrigger(durationSeconds: number): {
  type: "hype_meter_trigger";
  durationSeconds: number;
  timestamp: number;
} {
  return {
    type: "hype_meter_trigger",
    durationSeconds,
    timestamp: Date.now()
  };
}

function createOverlayAuctionTimerTrigger(durationSeconds: number): {
  type: "auction_timer_trigger";
  durationSeconds: number;
  timestamp: number;
} {
  return {
    type: "auction_timer_trigger",
    durationSeconds,
    timestamp: Date.now()
  };
}

function createOverlayRecapTrigger(): {
  type: "recap_trigger";
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  timestamp: number;
} {
  return {
    type: "recap_trigger",
    salesCount: stats.salesCount,
    grossSales: stats.grossSales,
    bidCount: stats.bidCount,
    audienceActions: stats.audienceActions,
    timestamp: Date.now()
  };
}

function createOverlayClear(): {
  type: "overlay_clear";
  timestamp: number;
} {
  return {
    type: "overlay_clear",
    timestamp: Date.now()
  };
}

function resolveOverlayPath(): string {
  if (electronApp.isPackaged) {
    return path.join(process.resourcesPath, "overlay");
  }

  return path.resolve(electronApp.getAppPath(), "../overlay/dist");
}

function resolveExtensionPath(): string {
  if (electronApp.isPackaged) {
    return path.join(process.resourcesPath, "extension");
  }

  return path.resolve(electronApp.getAppPath(), "../extension/dist");
}

function log(message: string): void {
  const redacted = redactText(message);
  const line = `[${new Date().toISOString()}] ${redacted}\n`;
  try {
    const logDir = resolveLogDirectory();
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, dailyLogName()), line);
    diagnosticRing.push("log", redacted);
  } catch {
    // Logging should never stop the desktop app from launching.
  }
  console.log(line.trim());
}

function resolveLogDirectory(): string {
  if (electronApp.isReady()) {
    return electronApp.getPath("logs");
  }
  return path.join(
    os.homedir(),
    process.platform === "win32"
      ? path.join("AppData", "Roaming", "Duck Desk", "logs")
      : path.join("Library", "Logs", "Duck Desk")
  );
}

function runtimeMarkerPath(): string {
  return path.join(electronApp.getPath("userData"), "runtime-marker.json");
}

function recoverUncleanShutdown(): void {
  try {
    const markerPath = runtimeMarkerPath();
    if (!fs.existsSync(markerPath)) {
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(markerPath, "utf8")) as unknown;
    if (isRecord(parsed) && parsed.clean !== true) {
      recoveryNotice = "Duck Desk did not shut down cleanly last time. Check Setup > Preflight if the overlay or audio looks stuck.";
      diagnosticRing.push("recovery", "Unclean previous shutdown");
    }
  } catch {
    recoveryNotice = "Duck Desk could not read the previous session marker.";
  }
}

function writeRuntimeMarker(clean: boolean): void {
  try {
    const markerPath = runtimeMarkerPath();
    fs.mkdirSync(path.dirname(markerPath), { recursive: true });
    const payload = `${JSON.stringify({ version: 1, pid: process.pid, startedAt: Date.now(), clean }, null, 2)}\n`;
    const temporaryPath = `${markerPath}.tmp`;
    fs.writeFileSync(temporaryPath, payload, { mode: 0o600 });
    fs.renameSync(temporaryPath, markerPath);
  } catch (error) {
    log(`unable to write runtime marker: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function tryLoadSettingsBackup(): boolean {
  const backupPath = `${resolveSettingsPath()}.bak`;
  if (!fs.existsSync(backupPath)) {
    return false;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(backupPath, "utf8")) as unknown;
    if (!isRecord(parsed)) {
      return false;
    }
    applyConfigPatch(parsed);
    log("restored creator settings from backup");
    return true;
  } catch {
    return false;
  }
}

function missingCustomSoundCount(): number {
  return Object.values(customSounds).filter((selection) => selection && !fs.existsSync(resolveCustomSoundPath(selection))).length;
}

function storageWritable(): boolean {
  try {
    const directory = electronApp.getPath("userData");
    fs.mkdirSync(directory, { recursive: true });
    const probe = path.join(directory, ".write-check");
    fs.writeFileSync(probe, "ok", { mode: 0o600 });
    fs.rmSync(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

function buildHealthChecks(): HealthCheck[] {
  const obsReady = obsStatus.startsWith("Added") || obsStatus.startsWith("Updated");
  const extensionConnected = Date.now() - extensionLastSeenAt < 30_000;
  const overlayRecent = clients.size > 0 && Date.now() - overlayLastSeenAt < 30_000;
  const missingSounds = missingCustomSoundCount();
  const writable = storageWritable();
  const remote = remoteSession.getConnectionInfo();
  return [
    {
      id: "bridge",
      label: "Local Bridge",
      ready: !lastError,
      detail: lastError || `Listening on ${overlayUrl}`,
      action: lastError ? "Restart Local Bridge" : undefined
    },
    {
      id: "overlay",
      label: "Overlay Clients",
      ready: overlayRecent,
      pending: clients.size === 0,
      detail: clients.size > 0 ? `${clients.size} connected` : "No overlay clients yet",
      action: "Clear Overlay Queue"
    },
    {
      id: "obs",
      label: "OBS Source",
      ready: obsReady,
      pending: obsStatus.startsWith("Connecting"),
      detail: obsStatus,
      action: "Repair + Refresh OBS"
    },
    {
      id: "extension",
      label: "Extension",
      ready: extensionConnected && whatnotPageReportedActive,
      pending: !extensionConnected,
      detail: whatnotPageReportedActive ? "Seller page connected" : extensionConnected ? "Open the seller page" : "Waiting for the extension",
      action: "Reopen Extension Folder"
    },
    {
      id: "events",
      label: "Live Events",
      ready: Boolean(lastRealEventAt),
      pending: !lastRealEventAt,
      detail: lastRealEventAt
        ? `Last real event recorded. ${rejectedEventCount} rejected, ${duplicateEventCount} duplicates.`
        : `No real events yet. ${rejectedEventCount} rejected, ${duplicateEventCount} duplicates.`
    },
    {
      id: "audio",
      label: "Audio Output",
      ready: missingSounds === 0 && !audioNotice.toLowerCase().includes("could not"),
      detail: missingSounds > 0 ? `${missingSounds} custom sound file(s) missing` : audioNotice,
      action: "Reset Audio Output"
    },
    {
      id: "remote",
      label: "Remote Deck",
      ready: remote.available,
      detail: remote.available ? `${remoteSession.activeClientCount()} device(s), code ready` : "No private LAN address",
      action: "Rotate Remote Access Code"
    },
    {
      id: "rehearsal",
      label: "Rehearsal",
      ready: rehearsalManager.getStatus().state !== "playing",
      pending: rehearsalManager.getStatus().state === "playing",
      detail: `Scheduler ${rehearsalManager.getStatus().state}`
    },
    {
      id: "storage",
      label: "Settings Storage",
      ready: writable,
      detail: writable ? "Settings and packs can be saved" : "Duck Desk cannot write to its data folder",
      action: "Open Log Folder"
    },
    {
      id: "updates",
      label: "App Version",
      ready: updateStatus.status !== "error",
      pending: updateStatus.status === "unknown",
      detail: `${electronApp.getVersion()} · ${updateStatus.detail}`,
      action: "Check for Updates"
    }
  ];
}

async function checkForUpdates(manual: boolean): Promise<void> {
  const currentVersion = electronApp.getVersion();
  updateStatus = {
    currentVersion,
    status: "unknown",
    detail: manual ? "Checking GitHub Releases…" : "Startup check in progress."
  };
  if (!manual && rehearsalManager.getStatus().state === "playing") {
    updateStatus.detail = "Update check postponed until rehearsal is idle.";
    return;
  }
  try {
    const response = await fetch("https://api.github.com/repos/ConfusedDuckCollectibles/DuckDesk/releases/latest", {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "DuckDesk" }
    });
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }
    const payload = await response.json() as { tag_name?: string; html_url?: string };
    const latestVersion = typeof payload.tag_name === "string" ? payload.tag_name.replace(/^v/i, "") : undefined;
    if (!latestVersion) {
      throw new Error("Latest release has no tag.");
    }
    const comparison = compareVersions(currentVersion, latestVersion);
    updateStatus = {
      currentVersion,
      latestVersion,
      notesUrl: typeof payload.html_url === "string" ? payload.html_url : undefined,
      status: comparison,
      detail: comparison === "available"
        ? `Update available: ${latestVersion}. Duck Desk will not download it during a show.`
        : latestVersion === currentVersion
          ? `This build matches the latest GitHub release tag ${latestVersion}.`
          : `This build is newer than the latest GitHub release tag ${latestVersion}.`
    };
  } catch (error) {
    updateStatus = {
      currentVersion,
      status: "error",
      detail: `Could not check GitHub Releases (${error instanceof Error ? error.message : "network error"}).`
    };
  }
  diagnosticRing.push("update", updateStatus.detail);
  broadcastStatus();
}

async function restartLocalBridge(): Promise<void> {
  diagnosticRing.push("bridge", "Restarting local bridge");
  await new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    wss?.close();
    server.close(() => resolve());
    server = null;
    wss = null;
  });
  await startLocalBridge();
}

async function exportDiagnostics(): Promise<void> {
  const options: SaveDialogOptions = {
    title: "Export Duck Desk diagnostics",
    defaultPath: `duck-desk-diagnostics-${new Date().toISOString().slice(0, 10)}.zip`,
    filters: [{ name: "Zip", extensions: ["zip"] }]
  };
  const result = mainWindow
    ? await dialog.showSaveDialog(mainWindow, options)
    : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) {
    return;
  }
  const logDir = resolveLogDirectory();
  const todayLog = path.join(logDir, dailyLogName());
  let recentLog = "";
  try {
    if (fs.existsSync(todayLog)) {
      const contents = fs.readFileSync(todayLog, "utf8");
      recentLog = redactText(contents.split("\n").slice(-200).join("\n"));
    }
  } catch {
    recentLog = "Logs were unavailable.";
  }
  const archive = await createDiagnosticsArchive([
    { name: "health.json", data: `${JSON.stringify({ checks: buildHealthChecks(), update: updateStatus, platform: process.platform, arch: process.arch, appVersion: electronApp.getVersion(), signed: false, notarized: false, installerType: electronApp.isPackaged ? "packaged" : "development" }, null, 2)}\n` },
    { name: "settings-summary.json", data: `${JSON.stringify(redactSettingsSummary({
      version: 1,
      theme: activeTheme,
      skin: activeSkin,
      addOns: [...activeAddOns],
      soundsEnabled,
      audioTheme,
      customSounds,
      customGifs,
      sceneMode,
      hideTopBanner,
      themeEffectsEnabled,
      firstRunComplete
    }), null, 2)}\n` },
    { name: "recent-log.txt", data: recentLog },
    { name: "bridge-events.json", data: `${JSON.stringify(diagnosticRing.list(), null, 2)}\n` },
    { name: "obs-status.txt", data: redactText(obsStatus) },
    { name: "extension-status.json", data: `${JSON.stringify({
      lastSeenAt: extensionLastSeenAt || undefined,
      sellerPageActive: whatnotPageReportedActive,
      overlayClients: clients.size
    }, null, 2)}\n` }
  ]);
  fs.writeFileSync(result.filePath, archive);
  diagnosticRing.push("diagnostics", "Exported diagnostics zip");
}

async function autoAddObsOverlay(suppliedPassword = ""): Promise<string> {
  let socket: WebSocket | null = null;

  try {
    socket = await connectObsWebSocket(suppliedPassword);
    const sceneResponse = requireObsRequest(await sendObsRequest(socket, "GetCurrentProgramScene"));
    const currentScene = readString(sceneResponse, "sceneName")
      ?? readString(sceneResponse, "currentProgramSceneName")
      ?? "Scene";
    const browserSettings = {
      url: overlayUrl,
      width: 1080,
      height: 1920,
      css: "body { background-color: rgba(0, 0, 0, 0); margin: 0; overflow: hidden; }",
      shutdown: false,
      restart_when_active: true
    };

    const existingInput = await sendObsRequest(socket, "GetInputSettings", { inputName: obsSourceName });
    let sceneItemId: number | undefined;
    let resultVerb = "Added";

    if (existingInput.ok) {
      const existingKind = readString(existingInput.data, "inputKind");
      if (existingKind && existingKind !== "browser_source") {
        throw new Error(`OBS already has a non-browser source named "${obsSourceName}". Rename that source and try again.`);
      }

      requireObsRequest(await sendObsRequest(socket, "SetInputSettings", {
        inputName: obsSourceName,
        inputSettings: browserSettings,
        overlay: false
      }));
      resultVerb = "Updated";

      const sceneItem = await sendObsRequest(socket, "GetSceneItemId", {
        sceneName: currentScene,
        sourceName: obsSourceName,
        searchOffset: -1
      });
      if (sceneItem.ok) {
        sceneItemId = readNumber(sceneItem.data, "sceneItemId");
      } else {
        const createdItem = requireObsRequest(await sendObsRequest(socket, "CreateSceneItem", {
          sceneName: currentScene,
          sourceName: obsSourceName,
          sceneItemEnabled: true
        }));
        sceneItemId = readNumber(createdItem, "sceneItemId");
        resultVerb = "Added";
      }
    } else {
      const createdInput = requireObsRequest(await sendObsRequest(socket, "CreateInput", {
        sceneName: currentScene,
        inputName: obsSourceName,
        inputKind: "browser_source",
        inputSettings: browserSettings,
        sceneItemEnabled: true
      }));
      sceneItemId = readNumber(createdInput, "sceneItemId");
    }

    if (sceneItemId !== undefined) {
      requireObsRequest(await sendObsRequest(socket, "SetSceneItemEnabled", {
        sceneName: currentScene,
        sceneItemId,
        sceneItemEnabled: true
      }));

      const videoSettings = await sendObsRequest(socket, "GetVideoSettings");
      const baseWidth = readNumber(videoSettings.data, "baseWidth") ?? 1080;
      const baseHeight = readNumber(videoSettings.data, "baseHeight") ?? 1920;
      const scale = Math.min(baseWidth / 1080, baseHeight / 1920);
      requireObsRequest(await sendObsRequest(socket, "SetSceneItemTransform", {
        sceneName: currentScene,
        sceneItemId,
        sceneItemTransform: {
          positionX: Math.round((baseWidth - (1080 * scale)) / 2),
          positionY: Math.round((baseHeight - (1920 * scale)) / 2),
          rotation: 0,
          scaleX: scale,
          scaleY: scale,
          cropTop: 0,
          cropRight: 0,
          cropBottom: 0,
          cropLeft: 0
        }
      }));
    }

    await sendObsRequest(socket, "PressInputPropertiesButton", {
      inputName: obsSourceName,
      propertyName: "refreshnocache"
    });

    return `${resultVerb} and refreshed ${obsSourceName} in OBS scene "${currentScene}".`;
  } catch (error) {
    return formatObsError(error);
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000);
    }
  }
}

type ObsRequestResult = {
  ok: boolean;
  code?: number;
  comment?: string;
  data: Record<string, unknown>;
};

async function connectObsWebSocket(suppliedPassword: string): Promise<WebSocket> {
  const socket = new WebSocket(obsUrl);
  const helloPromise = waitForObsMessage(socket, (message) => message.op === 0, 5000);
  await waitForObsOpen(socket, 5000);
  const hello = await helloPromise;
  const helloData = isRecord(hello.d) ? hello.d : {};
  const identify: Record<string, unknown> = {
    rpcVersion: Math.min(readNumber(helloData, "rpcVersion") ?? 1, 1),
    eventSubscriptions: 0
  };
  const authentication = isRecord(helloData.authentication) ? helloData.authentication : null;

  if (authentication) {
    const challenge = readString(authentication, "challenge");
    const salt = readString(authentication, "salt");
    const password = suppliedPassword || readLocalObsPassword();
    if (!challenge || !salt || !password) {
      socket.close();
      throw new Error("OBS requires a WebSocket password. Enter it in Duck Desk and try again.");
    }
    identify.authentication = createObsAuthentication(password, salt, challenge);
  }

  const identifiedPromise = waitForObsMessage(socket, (message) => message.op === 2, 5000);
  socket.send(JSON.stringify({ op: 1, d: identify }));
  await identifiedPromise;
  return socket;
}

function waitForObsOpen(socket: WebSocket, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("OBS WebSocket connection timed out.")), timeoutMs);
    const onOpen = () => finish();
    const onError = () => finish(new Error("Could not reach OBS on port 4455."));
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      socket.off("open", onOpen);
      socket.off("error", onError);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    socket.on("open", onOpen);
    socket.on("error", onError);
  });
}

function waitForObsMessage(
  socket: WebSocket,
  predicate: (message: { op?: number; d?: unknown }) => boolean,
  timeoutMs: number
): Promise<{ op?: number; d?: unknown }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("OBS did not respond in time.")), timeoutMs);
    const onMessage = (data: WebSocket.RawData) => {
      const message = parseObsMessage(data.toString());
      if (message && predicate(message)) {
        finish(undefined, message);
      }
    };
    const onClose = (code: number) => {
      const message = code === 4009
        ? "OBS rejected the WebSocket password. Enter the current password and try again."
        : `OBS closed the connection (${code}).`;
      finish(new Error(message));
    };
    const onError = () => finish(new Error("OBS WebSocket connection failed."));
    const finish = (error?: Error, message?: { op?: number; d?: unknown }) => {
      clearTimeout(timeout);
      socket.off("message", onMessage);
      socket.off("close", onClose);
      socket.off("error", onError);
      if (error) {
        reject(error);
      } else if (message) {
        resolve(message);
      }
    };
    socket.on("message", onMessage);
    socket.on("close", onClose);
    socket.on("error", onError);
  });
}

async function sendObsRequest(
  socket: WebSocket,
  requestType: string,
  requestData?: Record<string, unknown>
): Promise<ObsRequestResult> {
  const requestId = `duck-${randomUUID()}`;
  const responsePromise = waitForObsMessage(
    socket,
    (message) => message.op === 7 && isRecord(message.d) && message.d.requestId === requestId,
    5000
  );
  socket.send(JSON.stringify({
    op: 6,
    d: {
      requestType,
      requestId,
      ...(requestData ? { requestData } : {})
    }
  }));
  const response = await responsePromise;
  const responseBody = isRecord(response.d) ? response.d : {};
  const status = isRecord(responseBody.requestStatus) ? responseBody.requestStatus : {};
  return {
    ok: status.result === true,
    code: readNumber(status, "code"),
    comment: readString(status, "comment"),
    data: isRecord(responseBody.responseData) ? responseBody.responseData : {}
  };
}

function requireObsRequest(result: ObsRequestResult): Record<string, unknown> {
  if (!result.ok) {
    const detail = result.comment || (result.code ? `OBS request failed with code ${result.code}.` : "OBS request failed.");
    throw new Error(detail);
  }
  return result.data;
}

function createObsAuthentication(password: string, salt: string, challenge: string): string {
  const secret = createHash("sha256").update(password + salt).digest("base64");
  return createHash("sha256").update(secret + challenge).digest("base64");
}

function readLocalObsPassword(): string {
  const configPath = process.platform === "win32"
    ? path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "obs-studio", "plugin_config", "obs-websocket", "config.json")
    : path.join(os.homedir(), "Library", "Application Support", "obs-studio", "plugin_config", "obs-websocket", "config.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
    if (isRecord(config) && config.auth_required === true && typeof config.server_password === "string") {
      return config.server_password;
    }
  } catch {
    // A password can still be supplied in the Duck Desk connection field.
  }
  return "";
}

function formatObsError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown OBS connection error.";
  if (message.includes("Could not reach") || message.includes("connection failed")) {
    return "Could not reach OBS. Open OBS and enable Tools > WebSocket Server Settings.";
  }
  return message;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === "string" ? record[key] : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  return typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] : undefined;
}

function parseObsMessage(payload: string): { op?: number; d?: unknown } | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    return {
      op: typeof parsed.op === "number" ? parsed.op : undefined,
      d: parsed.d
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeStreamTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim().slice(0, 88);
}

function sanitizeGifLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim().slice(0, 42);
}

function createDefaultGifLabel(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const mediaIndex = parts.indexOf("media");
    if (mediaIndex >= 0 && parts[mediaIndex + 1]) {
      return `Giphy ${parts[mediaIndex + 1].slice(0, 8)}`;
    }

    const fileName = parts.at(-1)?.replace(/\.(gif|webp)$/i, "");
    if (fileName) {
      return fileName.replace(/[-_]+/g, " ").slice(0, 42);
    }
  } catch {
    // Fall back to an ordered label.
  }

  return `GIF ${index}`;
}

function normalizeGifUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    const packMatch = parsed.pathname.match(/^\/pack-media\/([0-9a-f-]{36})\/([A-Za-z0-9._-]+)$/i);
    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      && parsed.port === String(port)
      && packMatch
      && isPackId(packMatch[1])
      && /\.(gif|webp|png|jpe?g)$/i.test(packMatch[2])
    ) {
      parsed.protocol = "http:";
      parsed.host = `localhost:${port}`;
      parsed.search = "";
      parsed.hash = "";
      return parsed.href;
    }

    if (/\.(gif|webp)(?:$|[?#])/i.test(parsed.href)) {
      return parsed.href;
    }

    const giphyId = extractGiphyId(parsed);
    if (giphyId) {
      return `https://media.giphy.com/media/${giphyId}/giphy.gif`;
    }

    return null;
  } catch {
    return null;
  }
}

function extractGiphyId(parsed: URL): string | null {
  if (!/(^|\.)giphy\.com$/i.test(parsed.hostname)) {
    return null;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const mediaIndex = parts.indexOf("media");
  if (mediaIndex >= 0 && parts[mediaIndex + 1]) {
    return sanitizeGiphyId(parts[mediaIndex + 1]);
  }

  const gifsIndex = parts.indexOf("gifs");
  if (gifsIndex >= 0 && parts[gifsIndex + 1]) {
    const slug = parts[gifsIndex + 1];
    return sanitizeGiphyId(slug.split("-").pop() ?? slug);
  }

  return null;
}

function sanitizeGiphyId(value: string): string | null {
  return /^[a-z0-9]+$/i.test(value) ? value : null;
}
