import { createServer, type Server } from "node:http";
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
  isOverlayTheme,
  type AddOnId,
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
const activeAddOns = new Set<AddOnId>();

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

  expressApp.use("/overlay", express.static(overlayPath));
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
    receiveEvent({
      type: "sale",
      buyer: "TestBuyer",
      amount: 28,
      item: "Desktop Test Sale",
      timestamp: Date.now()
    });
  });

  ipcMain.handle("duck-desk:send-test-bid", () => {
    receiveEvent({
      type: "bid",
      bidder: "BidBoss",
      amount: 34,
      item: "Live Auction Demo",
      timestamp: Date.now()
    });
  });

  ipcMain.handle("duck-desk:send-test-action", () => {
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

  mainWindow?.webContents.send("duck-desk:event", event);
  broadcast(event);
  broadcastStatus();
}

function broadcast(event: ShowEvent | ReturnType<typeof createOverlayConfig>): void {
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
  addOns: AddOnId[];
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
    addOns: [...activeAddOns],
    lastError
  };
}

function createOverlayConfig(): {
  type: "overlay_config";
  theme: OverlayTheme;
  addOns: AddOnId[];
  timestamp: number;
} {
  return {
    type: "overlay_config",
    theme: activeTheme,
    addOns: [...activeAddOns],
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
