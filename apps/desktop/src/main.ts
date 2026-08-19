import { createServer, type Server } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
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
  type AddOnId,
  type GifPlacement,
  type GifSize,
  type OverlaySkin,
  normalizeShowEvent,
  type OverlayTheme,
  type ShowEvent
} from "@duck-desk/shared";

const port = 8741;
const overlayUrl = `http://localhost:${port}/overlay`;

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

type CustomGif = {
  id: string;
  label: string;
  url: string;
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
  wss?.close();
  server?.close();
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 820,
    minWidth: 900,
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
      receiveEvent(event);
      response.status(202).json({ ok: true, event });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid event.";
      response.status(400).json({ ok: false, error: message });
    }
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
}

function receiveEvent(event: ShowEvent): void {
  if (event.type === "sale") {
    stats.salesCount += 1;
    stats.grossSales += event.amount;
  } else if (event.type === "bid") {
    stats.bidCount += 1;
  } else if (event.type === "audience_action") {
    stats.audienceActions += 1;
  }

  playEventSound(event);
  mainWindow?.webContents.send("duck-desk:event", event);
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
}

function playEventSound(event: ShowEvent): void {
  if (!soundsEnabled) {
    return;
  }

  const soundFile = event.type === "sale"
    ? "Glass.aiff"
    : event.type === "bid"
      ? "Pop.aiff"
      : "Ping.aiff";
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
): void {
  const payload = JSON.stringify(event);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastStatus(): void {
  mainWindow?.webContents.send("duck-desk:status", getStatus());
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
  lastError?: string;
} {
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
    timestamp: Date.now()
  };
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
