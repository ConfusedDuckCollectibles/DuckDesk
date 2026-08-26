import { createHash, randomUUID } from "node:crypto";
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
  type OpenDialogOptions
} from "electron";
import { WebSocket, WebSocketServer } from "ws";
import {
  isAddOnId,
  isAudioTheme,
  isGifPlacement,
  isGifSize,
  isOverlaySkin,
  isOverlayTheme,
  isSceneMode,
  isSoundKind,
  type AddOnId,
  type AudioTheme,
  type GifPlacement,
  type GifSize,
  type GoalConfig,
  type OverlaySkin,
  type SceneMode,
  normalizeShowEvent,
  type SoundKind,
  type OverlayTheme,
  type ShowEvent
} from "@duck-desk/shared";

const port = 8741;
const overlayUrl = `http://localhost:${port}/overlay`;
const obsUrl = "ws://127.0.0.1:4455";
const obsSourceName = "Duck Desk Overlay";
const customAudioToken = randomUUID();

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
const activeAddOns = new Set<AddOnId>();
let soundsEnabled = true;
let soundVolume = 0.75;
let audioTheme: AudioTheme = "neon_pulse";
let customSounds: Partial<Record<SoundKind, CustomSoundSelection>> = {};
let audioNotice = "Ready";
let audioRevision = 0;
let nativeSoundPlayer: ChildProcess | null = null;
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
let hideFooter = false;
let firstRunComplete = false;
const showReadyAddOns: AddOnId[] = ["stream_skins", "noise_machines", "bid_ladder", "activity_feed"];
let obsStatus = "Not connected";
let extensionLastSeenAt = 0;
let whatnotPageReportedActive = false;
let lastRealEventAt = 0;
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

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
  hideFooter: boolean;
  firstRunComplete: boolean;
};

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
  log("app ready");
  nativeTheme.themeSource = "dark";
  loadSettings();
  registerIpc();
  createWindow();
  await startLocalBridge();

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
  stopNativeSound();
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = null;
    saveSettings();
  }
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
      lastRealEventAt = Date.now();
      receiveEvent(event);
      response.status(202).json({ ok: true, event });
    } catch (error) {
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
      lastError = error instanceof Error ? error.message : "Unable to start local bridge.";
      log(`server error: ${lastError}`);
      broadcastStatus();
      resolve();
    });

    server?.listen(port, "127.0.0.1", () => {
      lastError = undefined;
      log(`local bridge listening on ${overlayUrl}`);
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

  ipcMain.handle("duck-desk:reveal-extension", () => {
    void shell.openPath(resolveExtensionPath());
  });

  ipcMain.handle("duck-desk:complete-first-run", () => {
    firstRunComplete = true;
    scheduleSettingsSave();
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:set-hide-footer", (_event, hidden: unknown) => {
    if (typeof hidden !== "boolean") {
      return getStatus();
    }
    hideFooter = hidden;
    broadcast(createOverlayConfig());
    broadcastStatus();
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
    }, true);
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
    }, true);
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
    }, true);
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
    }, true);
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
    }, true);
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

    soundVolume = Math.max(0, Math.min(1, volume));
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
    const selectedUrl = typeof url === "string"
      ? customGifs.find((gif) => gif.id === url)?.url ?? normalizeGifUrl(url)
      : customGifs[0]?.url ?? "/gifs/chat-spark.gif";
    if (!selectedUrl) {
      return getStatus();
    }

    activeAddOns.add("gif_reactions");
    broadcast(createOverlayConfig());
    broadcast(createOverlayGifTrigger(selectedUrl));
    broadcastStatus();
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

    activeAddOns.add("noise_machines");
    if (soundsEnabled) {
      playSoundKind(kind);
      broadcast(createOverlaySoundTrigger(kind));
    }
    broadcast(createOverlayConfig());
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-burst", () => {
    activeAddOns.add("hype_bursts");
    broadcast(createOverlayConfig());
    broadcast(createOverlayBurstTrigger());
    broadcastStatus();
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
    activeAddOns.add("hype_meter");
    broadcast(createOverlayConfig());
    broadcast(createOverlayHypeMeterTrigger(hypeMeterSeconds));
    broadcastStatus();
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

    sceneMode = mode;
    if (mode !== "none") {
      activeAddOns.add("scene_switcher");
    }
    broadcast(createOverlayConfig());
    broadcastStatus();
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
    activeAddOns.add("auction_timer");
    broadcast(createOverlayConfig());
    broadcast(createOverlayAuctionTimerTrigger(auctionTimerSeconds));
    broadcastStatus();
    return getStatus();
  });

  ipcMain.handle("duck-desk:trigger-recap", () => {
    activeAddOns.add("show_recap");
    broadcast(createOverlayConfig());
    broadcast(createOverlayRecapTrigger());
    broadcastStatus();
    return getStatus();
  });
}

function receiveEvent(event: ShowEvent, isDemoEvent = false): void {
  if (!isDemoEvent) {
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

  playEventSound(event);
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send("duck-desk:event", event);
  }
  broadcast(event);
  broadcastStatus();
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

  if ("hideFooter" in input) {
    if (typeof input.hideFooter !== "boolean") {
      throw new Error("Invalid footer setting.");
    }
    hideFooter = input.hideFooter;
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

  playSoundKind(event.type === "audience_action" ? "action" : event.type);
}

function playSoundKind(kind: SoundKind): void {
  const selection = customSounds[kind];
  const soundPath = selection
    ? resolveCustomSoundPath(selection)
    : path.join(resolveOverlayPath(), "audio", audioTheme, `${kind}.wav`);

  try {
    stopNativeSound();
    const player = process.platform === "win32"
      ? spawnWindowsSoundPlayer(soundPath, soundVolume)
      : spawn("/usr/bin/afplay", ["-v", String(soundVolume), soundPath], {
          detached: true,
          stdio: "ignore"
        });
    nativeSoundPlayer = player;
    player.once("exit", () => {
      if (nativeSoundPlayer === player) {
        nativeSoundPlayer = null;
      }
    });
    player.unref();
  } catch (error) {
    log(`unable to play sound: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function stopNativeSound(): void {
  if (nativeSoundPlayer && !nativeSoundPlayer.killed) {
    nativeSoundPlayer.kill();
  }
  nativeSoundPlayer = null;
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
    if (typeof parsed.hideFooter === "boolean") {
      hideFooter = parsed.hideFooter;
    }
    log(`loaded creator settings version ${readNumber(parsed, "version") ?? 1}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      for (const addOn of showReadyAddOns) {
        activeAddOns.add(addOn);
      }
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
    hideFooter,
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
  hideFooter: boolean;
  firstRunComplete: boolean;
  platform: NodeJS.Platform;
  obsStatus: string;
  extensionConnected: boolean;
  whatnotPageActive: boolean;
  lastRealEventAt?: number;
  lastError?: string;
} {
  const extensionConnected = Date.now() - extensionLastSeenAt < 30_000;
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
    hideFooter,
    firstRunComplete,
    platform: process.platform,
    obsStatus,
    extensionConnected,
    whatnotPageActive: extensionConnected && whatnotPageReportedActive,
    lastRealEventAt: lastRealEventAt || undefined,
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
  hideFooter: boolean;
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
    customGifUrls: customGifs.map((gif) => gif.url),
    gifPlacement,
    gifSize,
    milestoneThresholds,
    hypeMeterSeconds,
    jumbotronCameraEnabled,
    promoBanners,
    sceneMode,
    goals,
    auctionTimerSeconds,
    hideFooter,
    timestamp: Date.now()
  };
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
    url,
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
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    const logDir = electronApp.isReady()
      ? electronApp.getPath("logs")
      : path.join(os.homedir(), process.platform === "win32" ? path.join("AppData", "Roaming", "Duck Desk", "logs") : path.join("Library", "Logs"));
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "Duck Desk.log"), line);
  } catch {
    // Logging should never stop the desktop app from launching.
  }
  console.log(line.trim());
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
