import "./styles.css";

type DesktopStatus = {
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
  lastError?: string;
};

type OverlayTheme = "neon" | "arena" | "duck";
type OverlaySkin = "none" | "cyber_market" | "arcade_drop" | "sports_desk";
type AddOnId =
  | "stream_skins"
  | "noise_machines"
  | "bid_ladder"
  | "hype_bursts"
  | "leaderboard_deck"
  | "gif_reactions";

type DesktopApi = {
  getStatus: () => Promise<DesktopStatus>;
  copyOverlayUrl: () => Promise<void>;
  openOverlay: () => Promise<void>;
  revealExtension: () => Promise<void>;
  sendTestSale: () => Promise<void>;
  sendTestBid: () => Promise<void>;
  sendTestAction: () => Promise<void>;
  setTheme: (theme: OverlayTheme) => Promise<DesktopStatus>;
  setSkin: (skin: OverlaySkin) => Promise<DesktopStatus>;
  setAddOn: (addOn: AddOnId, enabled: boolean) => Promise<DesktopStatus>;
  setSoundsEnabled: (enabled: boolean) => Promise<DesktopStatus>;
  setDemoMode: (enabled: boolean) => Promise<DesktopStatus>;
  setStreamTitle: (title: string) => Promise<DesktopStatus>;
  addCustomGif: (url: string) => Promise<DesktopStatus>;
  removeCustomGif: (url: string) => Promise<DesktopStatus>;
  onStatus: (callback: (status: DesktopStatus) => void) => void;
  onEvent: (callback: (event: ShowEventLog) => void) => void;
};

type ShowEventLog = {
  type?: string;
  buyer?: string;
  bidder?: string;
  actor?: string;
  amount?: number;
  item?: string;
  message?: string;
};

declare global {
  interface Window {
    duckDesk: DesktopApi;
  }
}

const statusPill = readElement<HTMLSpanElement>("status-pill");
const overlayUrl = readElement<HTMLInputElement>("overlay-url");
const streamTitle = readElement<HTMLInputElement>("stream-title");
const saveTitle = readElement<HTMLButtonElement>("save-title");
const clientCount = readElement<HTMLElement>("client-count");
const salesCount = readElement<HTMLElement>("sales-count");
const grossSales = readElement<HTMLElement>("gross-sales");
const bidCount = readElement<HTMLElement>("bid-count");
const audienceCount = readElement<HTMLElement>("audience-count");
const eventLog = readElement<HTMLOListElement>("event-log");
const copyUrl = readElement<HTMLButtonElement>("copy-url");
const openOverlay = readElement<HTMLButtonElement>("open-overlay");
const revealExtension = readElement<HTMLButtonElement>("reveal-extension");
const demoToggle = readElement<HTMLButtonElement>("demo-toggle");
const sendTest = readElement<HTMLButtonElement>("send-test");
const sendBid = readElement<HTMLButtonElement>("send-bid");
const sendAction = readElement<HTMLButtonElement>("send-action");
const activeThemeLabel = readElement<HTMLElement>("active-theme-label");
const libraryStatus = readElement<HTMLElement>("library-status");
const activeAddonsStatus = readElement<HTMLElement>("active-addons-status");
const activeAddonsEmpty = readElement<HTMLElement>("active-addons-empty");
const moduleBids = readElement<HTMLElement>("module-bids");
const moduleLeaderboard = readElement<HTMLElement>("module-leaderboard");
const soundStatus = readElement<HTMLElement>("sound-status");
const gifUrl = readElement<HTMLInputElement>("gif-url");
const addGifUrl = readElement<HTMLButtonElement>("add-gif-url");
const gifUrlStatus = readElement<HTMLElement>("gif-url-status");
const customGifList = readElement<HTMLElement>("custom-gif-list");
const soundToggles = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-toggle]"));
const themeCards = Array.from(document.querySelectorAll<HTMLButtonElement>(".theme-card"));
const addonActions = Array.from(document.querySelectorAll<HTMLButtonElement>(".addon-action"));
const addonPanels = Array.from(document.querySelectorAll<HTMLElement>("[data-addon-panel]"));
const addonThemeCards = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-addon-theme]"));
const addonTestActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-addon-test]"));
const skinActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-skin]"));

let audioContext: AudioContext | undefined;
let currentStatus: DesktopStatus | undefined;

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

copyUrl.addEventListener("click", async () => {
  await window.duckDesk.copyOverlayUrl();
  copyUrl.textContent = "Copied";
  window.setTimeout(() => {
    copyUrl.textContent = "Copy";
  }, 1200);
});

saveTitle.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setStreamTitle(streamTitle.value));
});

streamTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void window.duckDesk.setStreamTitle(streamTitle.value).then(renderStatus);
  }
});

addGifUrl.addEventListener("click", () => {
  void addGifFromInput();
});

gifUrl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void addGifFromInput();
  }
});

openOverlay.addEventListener("click", () => {
  void window.duckDesk.openOverlay();
});

revealExtension.addEventListener("click", () => {
  void window.duckDesk.revealExtension();
});

sendTest.addEventListener("click", () => {
  void window.duckDesk.sendTestSale();
});

sendBid.addEventListener("click", () => {
  void window.duckDesk.sendTestBid();
});

sendAction.addEventListener("click", () => {
  void window.duckDesk.sendTestAction();
});

for (const card of themeCards) {
  card.addEventListener("click", async () => {
    const theme = card.dataset.theme;
    if (theme === "neon" || theme === "arena" || theme === "duck") {
      renderStatus(await window.duckDesk.setTheme(theme));
    }
  });
}

for (const action of addonActions) {
  action.addEventListener("click", async () => {
    const card = action.closest<HTMLElement>(".addon-card");
    const addOn = card?.dataset.addon;
    if (!card || !isAddOnId(addOn)) {
      return;
    }

    const enabled = !card.classList.contains("is-added");
    const status = await window.duckDesk.setAddOn(addOn, enabled);
    renderStatus(status);
    if (addOn === "noise_machines" && enabled && status.soundsEnabled) {
      void resumeAudio();
      playLocalTone("action");
    }
  });
  action.dataset.defaultLabel = action.textContent ?? "Add";
}

for (const action of addonTestActions) {
  action.addEventListener("click", () => {
    if (action.dataset.addonTest === "sale") {
      void window.duckDesk.sendTestSale();
      return;
    }

    if (action.dataset.addonTest === "bid") {
      void window.duckDesk.sendTestBid();
      return;
    }

    void window.duckDesk.sendTestAction();
  });
}

for (const action of skinActions) {
  action.addEventListener("click", async () => {
    const skin = action.dataset.skin;
    if (isOverlaySkin(skin)) {
      renderStatus(await window.duckDesk.setSkin(skin));
    }
  });
}

for (const soundToggle of soundToggles) {
  soundToggle.addEventListener("click", async () => {
    const enabled = !(currentStatus?.soundsEnabled ?? true);
    const status = await window.duckDesk.setSoundsEnabled(enabled);
    renderStatus(status);
    if (enabled) {
      await resumeAudio();
      playLocalTone("action");
    }
  });
}

demoToggle.addEventListener("click", async () => {
  const enabled = !(currentStatus?.demoMode ?? false);
  renderStatus(await window.duckDesk.setDemoMode(enabled));
});

window.duckDesk.onStatus(renderStatus);
window.duckDesk.onEvent((event) => {
  const item = document.createElement("li");
  item.textContent = formatEventLog(event);
  eventLog.prepend(item);

  while (eventLog.children.length > 8) {
    eventLog.lastElementChild?.remove();
  }
});

void window.duckDesk.getStatus().then(renderStatus);

function renderStatus(status: DesktopStatus): void {
  currentStatus = status;
  statusPill.textContent = status.ok ? "Running" : "Needs Attention";
  statusPill.classList.toggle("ok", status.ok);
  overlayUrl.value = status.overlayUrl;
  streamTitle.value = status.streamTitle;
  clientCount.textContent = String(status.clients);
  salesCount.textContent = String(status.salesCount);
  grossSales.textContent = dollars.format(status.grossSales);
  bidCount.textContent = String(status.bidCount);
  audienceCount.textContent = String(status.audienceActions);
  moduleBids.textContent = String(status.bidCount);
  moduleLeaderboard.textContent = `${status.salesCount} / ${dollars.format(status.grossSales)}`;
  activeThemeLabel.textContent = status.skin === "none" ? themeName(status.theme) : skinName(status.skin);
  for (const soundToggle of soundToggles) {
    const prefix = soundToggle.closest(".actions") ? "Event " : "";
    soundToggle.textContent = status.soundsEnabled ? `${prefix}Sound On` : `${prefix}Sound Off`;
    soundToggle.classList.toggle("is-on", status.soundsEnabled);
    soundToggle.setAttribute("aria-pressed", String(status.soundsEnabled));
  }
  soundStatus.textContent = status.soundsEnabled
    ? "Armed for bids, sales, and audience actions."
    : "Muted. Event sounds are paused.";
  demoToggle.textContent = status.demoMode ? "Demo Mode On" : "Demo Mode Off";
  demoToggle.classList.toggle("is-on", status.demoMode);
  demoToggle.setAttribute("aria-pressed", String(status.demoMode));
  for (const action of [sendTest, sendBid, sendAction]) {
    action.disabled = !status.demoMode;
    action.title = status.demoMode ? "" : "Turn on Demo Mode to send test events to the overlay.";
  }
  for (const action of addonTestActions) {
    action.disabled = !status.demoMode;
    action.title = status.demoMode ? "" : "Turn on Demo Mode to preview this effect.";
  }

  for (const card of themeCards) {
    const isBaseTheme = card.dataset.theme === status.theme && !card.dataset.skin && status.skin === "none";
    const isSkinTheme = card.dataset.skin === status.skin && status.addOns.includes("stream_skins");
    card.classList.toggle("is-active", isBaseTheme || isSkinTheme);
  }

  for (const action of skinActions) {
    action.classList.toggle("is-active", action.dataset.skin === status.skin);
  }

  renderAddOns(status.addOns);
  renderCustomGifs(status.customGifUrls);
}

function formatEventLog(event: ShowEventLog): string {
  if (event.type === "sale") {
    return `SOLD @${event.buyer} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "bid") {
    return `BID @${event.bidder} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  return `AUDIENCE @${event.actor}${event.message ? ` - ${event.message}` : ""}`;
}

function themeName(theme: OverlayTheme): string {
  if (theme === "arena") {
    return "Auction Arena";
  }

  if (theme === "duck") {
    return "Duck Pop";
  }

  return "Neon Circuit";
}

function skinName(skin: OverlaySkin): string {
  if (skin === "arcade_drop") {
    return "Arcade Drop";
  }

  if (skin === "sports_desk") {
    return "Sports Desk";
  }

  if (skin === "cyber_market") {
    return "Cyber Market";
  }

  return "No Skin";
}

function updateLibraryStatus(): void {
  const added = document.querySelectorAll(".addon-card.is-added").length;
  const total = addonActions.length;
  libraryStatus.textContent = added === 0 ? `${total} Available` : `${added} Added`;
  activeAddonsStatus.textContent = added === 0 ? "None Loaded" : `${added} Loaded`;
  activeAddonsEmpty.hidden = added > 0;
}

function renderAddOns(addOns: AddOnId[]): void {
  for (const action of addonActions) {
    const card = action.closest<HTMLElement>(".addon-card");
    const addOn = card?.dataset.addon;
    if (!card || !isAddOnId(addOn)) {
      continue;
    }

    const isAdded = addOns.includes(addOn);
    card.classList.toggle("is-added", isAdded);
    action.textContent = isAdded ? "Added" : action.dataset.defaultLabel ?? "Add";
  }

  for (const panel of addonPanels) {
    const addOn = panel.dataset.addonPanel;
    panel.hidden = !isAddOnId(addOn) || !addOns.includes(addOn);
  }

  for (const card of addonThemeCards) {
    card.hidden = !addOns.includes("stream_skins");
  }

  updateLibraryStatus();
}

function isAddOnId(value: unknown): value is AddOnId {
  return (
    value === "stream_skins" ||
    value === "noise_machines" ||
    value === "bid_ladder" ||
    value === "hype_bursts" ||
    value === "leaderboard_deck" ||
    value === "gif_reactions"
  );
}

function isOverlaySkin(value: unknown): value is OverlaySkin {
  return value === "none" || value === "cyber_market" || value === "arcade_drop" || value === "sports_desk";
}

function renderCustomGifs(urls: string[]): void {
  customGifList.replaceChildren();

  if (urls.length === 0) {
    const empty = document.createElement("span");
    empty.className = "custom-gif-empty";
    empty.textContent = "No saved GIFs yet.";
    customGifList.append(empty);
    return;
  }

  for (const url of urls) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "custom-gif-chip";
    chip.textContent = compactUrl(url);
    chip.title = url;
    chip.addEventListener("click", () => {
      void window.duckDesk.removeCustomGif(url).then(renderStatus);
    });
    customGifList.append(chip);
  }
}

async function addGifFromInput(): Promise<void> {
  const rawUrl = gifUrl.value.trim();
  if (!rawUrl) {
    setGifStatus("Paste a GIF, WebP, or Giphy URL first.", "error");
    return;
  }

  const previousUrls = currentStatus?.customGifUrls ?? [];
  const status = await window.duckDesk.addCustomGif(rawUrl);
  const addedOrMatched = status.customGifUrls.some((url) => (
    !previousUrls.includes(url) || url === rawUrl || isLikelySameGiphyUrl(rawUrl, url)
  ));

  renderStatus(status);

  if (addedOrMatched) {
    gifUrl.value = "";
    setGifStatus("Saved. It will pop on the next bid, sale, or audience event.", "ok");
    return;
  }

  setGifStatus("That URL was not accepted. Use a direct .gif/.webp link or a Giphy page URL.", "error");
}

function setGifStatus(message: string, tone: "ok" | "error" | "neutral"): void {
  gifUrlStatus.textContent = message;
  gifUrlStatus.classList.toggle("is-ok", tone === "ok");
  gifUrlStatus.classList.toggle("is-error", tone === "error");
}

function isLikelySameGiphyUrl(input: string, normalizedUrl: string): boolean {
  try {
    const source = new URL(input);
    const normalized = new URL(normalizedUrl);
    if (!/(^|\.)giphy\.com$/i.test(source.hostname) || normalized.hostname !== "media.giphy.com") {
      return false;
    }

    const sourceParts = source.pathname.split("/").filter(Boolean);
    const normalizedParts = normalized.pathname.split("/").filter(Boolean);
    const sourceId = sourceParts[sourceParts.length - 1]?.split("-").pop();
    return Boolean(sourceId && normalizedParts.includes(sourceId));
  } catch {
    return false;
  }
}

function compactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 28);
  }
}

function playLocalTone(kind: "sale" | "bid" | "action"): void {
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequency = kind === "sale" ? 740 : kind === "bid" ? 520 : 360;

    oscillator.type = kind === "action" ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.4, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.26);
  } catch {
    // Some system audio routes can block Web Audio.
  }
}

async function resumeAudio(): Promise<void> {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state !== "running") {
      await audioContext.resume();
    }
  } catch {
    // Native app sounds still play from the main process.
  }
}

function readElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }

  return element as T;
}
