import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/images");
const overlayUrl = "http://localhost:8741/overlay?audio=off";
const rendererUrl = path.join(root, "apps/desktop/dist/renderer/index.html");
const preloadPath = path.join(root, "scripts/capture-readme-preload.cjs");
const cameraPath = path.join(outDir, "duck-desk-camera-bg.png");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureOverlay(filename, skin, title) {
  if (!fs.existsSync(cameraPath)) {
    console.log(`Skip overlay capture; missing ${cameraPath}`);
    return;
  }
  const cameraDataUrl = `data:image/png;base64,${fs.readFileSync(cameraPath).toString("base64")}`;
  const win = new BrowserWindow({
    width: 540,
    height: 960,
    show: false,
    frame: false,
    useContentSize: true,
    backgroundColor: "#05070a",
    webPreferences: {
      backgroundThrottling: false
    }
  });

  try {
    await win.loadURL(overlayUrl);
  } catch (error) {
    console.log(`Skip overlay capture; overlay is not running (${error instanceof Error ? error.message : String(error)})`);
    win.close();
    return;
  }
  await delay(1400);
  await win.webContents.executeJavaScript(`(() => {
    const shell = document.querySelector(".overlay-shell");
    if (!shell) return "no-shell";
    document.documentElement.style.background = "#05070a";
    document.body.style.background = "#05070a";
    let stage = document.getElementById("readme-camera");
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "readme-camera";
      stage.style.cssText = "position:fixed;inset:0;z-index:0;background:#05070a center/cover no-repeat;";
      document.body.prepend(stage);
      shell.style.position = "relative";
      shell.style.zIndex = "1";
    }
    stage.style.backgroundImage = "url('${cameraDataUrl}')";
    shell.className = "overlay-shell theme-neon skin-${skin} skin-premium addon-stream_skins addon-bid_ladder addon-activity_feed is-production";
    const em = document.querySelector(".brand-stack em");
    if (em) em.textContent = ${JSON.stringify(title)};
    const strong = document.querySelector(".brand-stack strong");
    if (strong) strong.textContent = "DUCK DESK";
    const live = document.querySelector(".hud-live");
    if (live) {
      live.textContent = "LIVE";
      live.classList.add("connected");
    }
    document.querySelector(".live-light")?.classList.add("connected");
    const ticker = document.querySelector(".ticker-track");
    if (ticker) {
      ticker.classList.remove("is-empty");
      ticker.innerHTML = '<div class="ticker-marquee"><span class="ticker-item ticker-sale">SOLD @nova $48</span><span class="ticker-item ticker-bid">BID @kai $22</span><span class="ticker-item ticker-sale">SOLD @miles $75</span><span class="ticker-item ticker-tip">TIP @jess $10</span></div>';
    }
    return shell.className;
  })()`);
  await delay(900);
  fs.writeFileSync(path.join(outDir, filename), (await win.webContents.capturePage()).toPNG());
  win.close();
}

async function captureDesktop(filename, view, tab) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    frame: false,
    backgroundColor: "#071014",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  await win.loadFile(rendererUrl);
  await delay(1200);
  await win.webContents.executeJavaScript(`(() => {
    document.getElementById("first-run")?.setAttribute("hidden", "");
    document.querySelector('[data-desk-view="${view}"]')?.click();
    document.querySelector('[data-desk-tab="${tab}"]')?.click();
    const statusPill = document.getElementById("status-pill");
    if (statusPill) {
      statusPill.textContent = "Running";
      statusPill.classList.add("ok");
    }
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText("titlebar-bridge", "Bridge");
    setText("titlebar-obs", "OBS");
    setText("titlebar-clients", "1 client");
    setText("sales-count", "12");
    setText("gross-sales", "$486");
    setText("client-count", "1");
    setText("bid-count", "31");
    setText("audience-count", "18");
    setText("tip-total", "$40");
    setText("share-count", "9");
    setText("active-theme-label", "Neon Circuit");
    document.querySelectorAll("[data-addon-theme]").forEach((card) => {
      card.hidden = false;
    });
    if ("${tab}" === "live-remote") {
      const qr = document.getElementById("remote-qr");
      if (qr) {
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f4fbff";
          ctx.fillRect(0, 0, 220, 220);
          ctx.fillStyle = "#061016";
          for (let y = 0; y < 11; y += 1) {
            for (let x = 0; x < 11; x += 1) {
              const finder = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
              if (finder || (x + y) % 3 === 0) {
                ctx.fillRect(x * 20, y * 20, 18, 18);
              }
            }
          }
        }
        qr.src = canvas.toDataURL("image/png");
        qr.hidden = false;
      }
      document.getElementById("remote-qr-unavailable")?.setAttribute("hidden", "");
    }
    return document.querySelector(".dashboard")?.dataset.currentView + ":" + document.querySelector(".dashboard")?.dataset.currentTab;
  })()`);
  await delay(800);
  fs.writeFileSync(path.join(outDir, filename), (await win.webContents.capturePage()).toPNG());
  win.close();
}

app.whenReady().then(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  await captureOverlay("duck-desk-overlay.png", "card_shop", "Surprise Sets Live");
  await captureDesktop("duck-desk-dashboard.png", "live", "live-show");
  await captureDesktop("duck-desk-preview.png", "live", "live-preview");
  await captureDesktop("duck-desk-library.png", "library", "library-themes");
  await captureDesktop("duck-desk-remote.png", "live", "live-remote");
  await captureDesktop("duck-desk-studio.png", "library", "library-studio");
  await captureDesktop("duck-desk-packs.png", "library", "library-packs");
  await captureDesktop("duck-desk-health.png", "setup", "setup-preflight");
  app.quit();
});
