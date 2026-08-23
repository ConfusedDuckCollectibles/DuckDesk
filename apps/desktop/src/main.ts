import { createServer, type Server } from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import {
  app as electronApp,
  BrowserWindow,
  clipboard,
  ipcMain,
  shell
} from "electron";
import { WebSocket, WebSocketServer } from "ws";
import {
  isAddOnId,
  isGifPlacement,
  isGifSize,
  isOverlaySkin,
  isOverlayTheme,
  isSceneMode,
  isSoundKind,
  type AddOnId,
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

let mainWindow: BrowserWindow | null = null;
let server: Server | null = null;
let wss: WebSocketServer | null = null;
let lastError: string | undefined;

const clients = new Set<WebSocket>();
const stats = {
  salesCount: 0,
  grossSales: 0,
  bidCount: 0,
  audienceActions: 0
};
let activeTheme: OverlayTheme = "neon";
let activeSkin: OverlaySkin = "none";
const activeAddOns = new Set<AddOnId>();
let soundsEnabled = true;
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

type PersistedSettings = {
  version: 1;
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
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
    minWidth: 1100,
    minHeight: 720,
    title: "Duck Desk",
    backgroundColor: "#f7f4e7",
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

  expressApp.use(cors({ origin: true }));
  expressApp.use(express.json({ limit: "256kb" }));

  expressApp.get("/health", (_request, response) => {
    response.json(getStatus());
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
  wss = new WebSocketServer({ server, path: "/ws" });

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
    void shell.openExternal(overlayUrl);
  });

  ipcMain.handle("duck-desk:reveal-extension", () => {
    void shell.openPath(resolveExtensionPath());
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
    });
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
    });
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
    });
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
    broadcast(createOverlayConfig());
    broadcastStatus();
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

function receiveEvent(event: ShowEvent): void {
  if (event.type === "sale") {
    stats.salesCount += 1;
    stats.grossSales += event.amount;
    checkMilestones();
  } else if (event.type === "bid") {
    stats.bidCount += 1;
  } else if (event.type === "audience_action") {
    stats.audienceActions += 1;
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
      playSoundKind("sale");
    }
  }
}

function playEventSound(event: ShowEvent): void {
  if (!soundsEnabled) {
    return;
  }

  playSoundKind(event.type === "sale" ? "sale" : event.type === "bid" ? "bid" : "action");
}

function playSoundKind(kind: SoundKind): void {
  const soundFile = kind === "sale" ? "Glass.aiff" : kind === "bid" ? "Pop.aiff" : "Ping.aiff";
  const soundPath = path.join("/System/Library/Sounds", soundFile);

  try {
    const player = spawn("/usr/bin/afplay", [soundPath], {
      detached: true,
      stdio: "ignore"
    });
    player.unref();
  } catch (error) {
    log(`unable to play sound: ${error instanceof Error ? error.message : String(error)}`);
  }
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
    log(`loaded creator settings version ${readNumber(parsed, "version") ?? 1}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
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
    auctionTimerSeconds
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
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
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
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
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
  timestamp: number;
} {
  return {
    type: "overlay_config",
    theme: activeTheme,
    skin: activeSkin,
    addOns: [...activeAddOns],
    soundsEnabled,
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
  const logPath = path.join(os.homedir(), "Library", "Logs", "Duck Desk.log");
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line);
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
  const configPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "obs-studio",
    "plugin_config",
    "obs-websocket",
    "config.json"
  );
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
