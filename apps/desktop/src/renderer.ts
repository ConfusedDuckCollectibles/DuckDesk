import "./styles.css";
import {
  Activity,
  AudioWaveform,
  CircleDollarSign,
  createIcons,
  Gauge,
  Gavel,
  HandCoins,
  Heart,
  LibraryBig,
  MonitorPlay,
  Palette,
  Play,
  PlugZap,
  Radio,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Upload,
  Volume2
} from "lucide";

type DesktopStatus = {
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
  platform: string;
  obsStatus: string;
  extensionConnected: boolean;
  whatnotPageActive: boolean;
  lastRealEventAt?: number;
  lastError?: string;
};

type OverlayTheme = "neon" | "arena" | "duck";
type OverlaySkin =
  | "none"
  | "cyber_market"
  | "arcade_drop"
  | "sports_desk"
  | "card_shop"
  | "retro_toy"
  | "midnight_gold"
  | "pastel_pop"
  | "lava_lamp"
  | "icebox"
  | "comic_burst"
  | "luxury_black"
  | "jungle_neon"
  | "cotton_candy"
  | "synthwave"
  | "streetwear"
  | "holiday_spark"
  | "ocean_depth"
  | "pixel_party"
  | "emerald_vault"
  | "storm_front"
  | "cyber_duck_city"
  | "treasure_vault"
  | "boss_battle"
  | "cosmic_auction"
  | "haunted_drop"
  | "sports_broadcast"
  | "anime_powerup"
  | "candy_rush"
  | "luxury_nightclub"
  | "inferno_ring"
  | "deep_reef"
  | "zen_garden"
  | "vinyl_lounge"
  | "blueprint_draft"
  | "aurora_peaks"
  | "solar_flare"
  | "glacier_cavern"
  | "noir_detective"
  | "retro_spaceport"
  | "royal_tournament"
  | "desert_mirage"
  | "enchanted_forest"
  | "steampunk_foundry"
  | "hologram_lab"
  | "stained_glass"
  | "paper_theater"
  | "midnight_library"
  | "carnival_nights"
  | "moonlit_tide"
  | "koi_pond"
  | "crystal_cavern"
  | "racing_grid"
  | "wild_west"
  | "celestial_clockwork"
  | "sakura_festival";
type GifPlacement = "center" | "top" | "bottom" | "left" | "right";
type GifSize = "small" | "medium" | "large";
type SoundKind = "sale" | "bid" | "action" | "tip" | "share";
type AudioTheme =
  | "neon_pulse"
  | "arcade_8bit"
  | "broadcast"
  | "crystal"
  | "duck_party"
  | "luxury"
  | "retro"
  | "stadium"
  | "storm"
  | "zen";
type SceneMode = "none" | "starting" | "auction" | "break" | "winner" | "ending";
type GoalKind = "sales" | "orders" | "hype" | "follows";
type CustomGif = {
  id: string;
  label: string;
  url: string;
};
type GoalConfig = {
  kind: GoalKind;
  target: number;
  label: string;
};
type AddOnId =
  | "stream_skins"
  | "noise_machines"
  | "bid_ladder"
  | "hype_bursts"
  | "leaderboard_deck"
  | "gif_reactions"
  | "milestones"
  | "hype_meter"
  | "jumbotron"
  | "promo_banners"
  | "scene_switcher"
  | "goal_widgets"
  | "activity_feed"
  | "auction_timer"
  | "show_recap";

type DesktopApi = {
  getStatus: () => Promise<DesktopStatus>;
  copyOverlayUrl: () => Promise<void>;
  openOverlay: () => Promise<void>;
  revealExtension: () => Promise<void>;
  completeFirstRun: () => Promise<DesktopStatus>;
  setHideFooter: (hidden: boolean) => Promise<DesktopStatus>;
  autoAddObsOverlay: (password?: string) => Promise<DesktopStatus>;
  sendTestSale: () => Promise<void>;
  sendTestBid: () => Promise<void>;
  sendTestAction: () => Promise<void>;
  sendTestTip: () => Promise<void>;
  sendTestShare: () => Promise<void>;
  setTheme: (theme: OverlayTheme) => Promise<DesktopStatus>;
  setSkin: (skin: OverlaySkin) => Promise<DesktopStatus>;
  setAddOn: (addOn: AddOnId, enabled: boolean) => Promise<DesktopStatus>;
  setSoundsEnabled: (enabled: boolean) => Promise<DesktopStatus>;
  setSoundVolume: (volume: number) => Promise<DesktopStatus>;
  setAudioTheme: (theme: AudioTheme) => Promise<DesktopStatus>;
  selectCustomSound: (kind: SoundKind) => Promise<DesktopStatus>;
  removeCustomSound: (kind: SoundKind) => Promise<DesktopStatus>;
  setDemoMode: (enabled: boolean) => Promise<DesktopStatus>;
  setStreamTitle: (title: string) => Promise<DesktopStatus>;
  addCustomGif: (url: string) => Promise<DesktopStatus>;
  removeCustomGif: (id: string) => Promise<DesktopStatus>;
  setCustomGifLabel: (id: string, label: string) => Promise<DesktopStatus>;
  triggerGif: (url?: string) => Promise<DesktopStatus>;
  setGifSettings: (placement: GifPlacement, size: GifSize) => Promise<DesktopStatus>;
  triggerSound: (kind: SoundKind) => Promise<DesktopStatus>;
  triggerBurst: () => Promise<DesktopStatus>;
  setMilestones: (thresholds: string) => Promise<DesktopStatus>;
  triggerHypeMeter: () => Promise<DesktopStatus>;
  setHypeMeterSeconds: (seconds: number) => Promise<DesktopStatus>;
  setJumbotronCamera: (enabled: boolean) => Promise<DesktopStatus>;
  setPromoBanners: (banners: string) => Promise<DesktopStatus>;
  setSceneMode: (mode: SceneMode) => Promise<DesktopStatus>;
  setGoals: (goals: string) => Promise<DesktopStatus>;
  setAuctionTimerSeconds: (seconds: number) => Promise<DesktopStatus>;
  triggerAuctionTimer: () => Promise<DesktopStatus>;
  triggerRecap: () => Promise<DesktopStatus>;
  onStatus: (callback: (status: DesktopStatus) => void) => void;
  onEvent: (callback: (event: ShowEventLog) => void) => void;
};

type ShowEventLog = {
  type?: string;
  buyer?: string;
  bidder?: string;
  actor?: string;
  tipper?: string;
  amount?: number;
  shareCount?: number;
  delta?: number;
  item?: string;
  message?: string;
};

type DeskView = "live" | "setup" | "library";
type DemoAction = "sale" | "bid" | "action" | "tip" | "share";
type DeskTab =
  | "live-show"
  | "live-controls"
  | "live-preview"
  | "live-events"
  | "setup-connection"
  | "setup-preflight"
  | "library-themes"
  | "library-addons"
  | "library-studio";

const DESK_TABS: DeskTab[] = [
  "live-show",
  "live-controls",
  "live-preview",
  "live-events",
  "setup-connection",
  "setup-preflight",
  "library-themes",
  "library-addons",
  "library-studio"
];

declare global {
  interface Window {
    duckDesk: DesktopApi;
  }
}

const statusPill = readElement<HTMLSpanElement>("status-pill");
const statusError = readElement<HTMLElement>("status-error");
const titlebarViewLabel = readElement<HTMLElement>("titlebar-view-label");
const titlebarBridge = readElement<HTMLElement>("titlebar-bridge");
const titlebarObs = readElement<HTMLElement>("titlebar-obs");
const titlebarClients = readElement<HTMLElement>("titlebar-clients");
const eventLogEmpty = readElement<HTMLElement>("event-log-empty");
const hideFooter = readElement<HTMLInputElement>("hide-footer");
const firstRun = readElement<HTMLElement>("first-run");
const firstRunObs = readElement<HTMLButtonElement>("first-run-obs");
const firstRunExtension = readElement<HTMLButtonElement>("first-run-extension");
const firstRunDismiss = readElement<HTMLButtonElement>("first-run-dismiss");
const dashboard = document.querySelector<HTMLElement>(".dashboard");
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-desk-view]"));
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-desk-tab]"));
const tabSets = Array.from(document.querySelectorAll<HTMLElement>(".section-tab-set"));
const tabPanels = Array.from(document.querySelectorAll<HTMLElement>(".dashboard > [data-tab]"));
const liveSoundToggle = document.querySelector<HTMLButtonElement>("[data-live-sound]");
const overlayUrl = readElement<HTMLInputElement>("overlay-url");
const streamTitle = readElement<HTMLInputElement>("stream-title");
const saveTitle = readElement<HTMLButtonElement>("save-title");
const clientCount = readElement<HTMLElement>("client-count");
const salesCount = readElement<HTMLElement>("sales-count");
const grossSales = readElement<HTMLElement>("gross-sales");
const bidCount = readElement<HTMLElement>("bid-count");
const audienceCount = readElement<HTMLElement>("audience-count");
const tipTotal = readElement<HTMLElement>("tip-total");
const shareCount = readElement<HTMLElement>("share-count");
const eventLog = readElement<HTMLOListElement>("event-log");
const copyUrl = readElement<HTMLButtonElement>("copy-url");
const openOverlay = readElement<HTMLButtonElement>("open-overlay");
const autoObs = readElement<HTMLButtonElement>("auto-obs");
const obsPassword = readElement<HTMLInputElement>("obs-password");
const obsConnectionStatus = readElement<HTMLElement>("obs-connection-status");
const preflightSummary = readElement<HTMLElement>("preflight-summary");
const preflightBridge = readElement<HTMLElement>("preflight-bridge");
const preflightObs = readElement<HTMLElement>("preflight-obs");
const preflightWhatnot = readElement<HTMLElement>("preflight-whatnot");
const preflightData = readElement<HTMLElement>("preflight-data");
const revealExtension = readElement<HTMLButtonElement>("reveal-extension");
const demoToggle = readElement<HTMLButtonElement>("demo-toggle");
const demoPreviewNotice = readElement<HTMLButtonElement>("demo-preview-notice");
const previewDemoToggle = readElement<HTMLButtonElement>("preview-demo-toggle");
const previewDemoToggleLabel = readElement<HTMLElement>("preview-demo-toggle-label");
const previewDemoPanel = readElement<HTMLElement>("preview-demo-panel");
const previewDemoActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-preview-demo-action]"));
const sendTest = readElement<HTMLButtonElement>("send-test");
const sendBid = readElement<HTMLButtonElement>("send-bid");
const sendAction = readElement<HTMLButtonElement>("send-action");
const sendTip = readElement<HTMLButtonElement>("send-tip");
const sendShare = readElement<HTMLButtonElement>("send-share");
const activeThemeLabel = readElement<HTMLElement>("active-theme-label");
const libraryStatus = readElement<HTMLElement>("library-status");
const activeAddonsStatus = readElement<HTMLElement>("active-addons-status");
const activeAddonsEmpty = readElement<HTMLElement>("active-addons-empty");
const moduleBids = readElement<HTMLElement>("module-bids");
const moduleLeaderboard = readElement<HTMLElement>("module-leaderboard");
const moduleActivityCount = readElement<HTMLElement>("module-activity-count");
const soundStatus = readElement<HTMLElement>("sound-status");
const activeAudioTheme = readElement<HTMLElement>("active-audio-theme");
const soundVolume = readElement<HTMLInputElement>("sound-volume");
const soundVolumeValue = readElement<HTMLOutputElement>("sound-volume-value");
const gifUrl = readElement<HTMLInputElement>("gif-url");
const addGifUrl = readElement<HTMLButtonElement>("add-gif-url");
const gifUrlStatus = readElement<HTMLElement>("gif-url-status");
const triggerGif = readElement<HTMLButtonElement>("trigger-gif");
const customGifList = readElement<HTMLElement>("custom-gif-list");
const soundToggles = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-toggle]"));
const audioThemeActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-audio-theme]"));
const soundPreviewActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-preview]"));
const soundUploadActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-upload]"));
const soundResetActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-reset]"));
const themeCards = Array.from(document.querySelectorAll<HTMLButtonElement>(".theme-card"));
const addonActions = Array.from(document.querySelectorAll<HTMLButtonElement>(".addon-action"));
const addonPanels = Array.from(document.querySelectorAll<HTMLElement>("[data-addon-panel]"));
const addonThemeCards = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-addon-theme]"));
const addonTestActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-addon-test]"));
const skinActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-skin]"));
const gifPlacementActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-gif-placement]"));
const gifSizeActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-gif-size]"));
const milestoneThresholds = readElement<HTMLInputElement>("milestone-thresholds");
const saveMilestones = readElement<HTMLButtonElement>("save-milestones");
const hypeSeconds = readElement<HTMLInputElement>("hype-seconds");
const saveHypeSeconds = readElement<HTMLButtonElement>("save-hype-seconds");
const triggerHypeMeter = readElement<HTMLButtonElement>("trigger-hype-meter");
const toggleJumbotronCamera = readElement<HTMLButtonElement>("toggle-jumbotron-camera");
const promoBanners = readElement<HTMLTextAreaElement>("promo-banners");
const savePromoBanners = readElement<HTMLButtonElement>("save-promo-banners");
const sceneActions = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-scene-mode]"));
const goalConfig = readElement<HTMLTextAreaElement>("goal-config");
const saveGoals = readElement<HTMLButtonElement>("save-goals");
const auctionTimerSeconds = readElement<HTMLInputElement>("auction-timer-seconds");
const saveAuctionTimer = readElement<HTMLButtonElement>("save-auction-timer");
const triggerAuctionTimer = readElement<HTMLButtonElement>("trigger-auction-timer");
const triggerRecap = readElement<HTMLButtonElement>("trigger-recap");

let currentStatus: DesktopStatus | undefined;
let volumeSaveTimer: number | undefined;
const lastDeskTabs: Record<DeskView, DeskTab> = {
  live: "live-show",
  setup: "setup-connection",
  library: "library-themes"
};

createIcons({
  icons: {
    Activity,
    AudioWaveform,
    CircleDollarSign,
    Gauge,
    Gavel,
    HandCoins,
    Heart,
    LibraryBig,
    MonitorPlay,
    Palette,
    Play,
    PlugZap,
    Radio,
    RotateCcw,
    Share2,
    SlidersHorizontal,
    Upload,
    Volume2
  }
});

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

triggerGif.addEventListener("click", async () => {
  const status = await window.duckDesk.triggerGif();
  renderStatus(status);
  setGifStatus("Triggered on the overlay.", "ok");
});

openOverlay.addEventListener("click", () => {
  void window.duckDesk.openOverlay();
});

for (const button of viewButtons) {
  button.addEventListener("click", () => {
    const view = button.dataset.deskView;
    if (view === "live" || view === "setup" || view === "library") {
      setDeskView(view);
    }
  });
}

for (const button of tabButtons) {
  button.addEventListener("click", () => {
    const tab = button.dataset.deskTab;
    if (isDeskTab(tab)) {
      setDeskTab(tab);
    }
  });
}

hideFooter.addEventListener("change", async () => {
  renderStatus(await window.duckDesk.setHideFooter(hideFooter.checked));
});

firstRunObs.addEventListener("click", async () => {
  setDeskView("setup", "setup-connection");
  renderStatus(await window.duckDesk.autoAddObsOverlay(obsPassword.value.trim()));
});

firstRunExtension.addEventListener("click", () => {
  setDeskView("setup", "setup-connection");
  void window.duckDesk.revealExtension();
});

firstRunDismiss.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.completeFirstRun());
});

async function connectObs(): Promise<void> {
  autoObs.disabled = true;
  autoObs.textContent = "Connecting...";
  obsConnectionStatus.textContent = "Authenticating with OBS and checking the current scene...";
  obsConnectionStatus.className = "obs-status-line is-connecting";
  try {
    const status = await window.duckDesk.autoAddObsOverlay(obsPassword.value);
    renderStatus(status);
    if (isObsReady(status.obsStatus)) {
      obsPassword.value = "";
    }
  } catch {
    obsConnectionStatus.textContent = "Duck Desk could not complete the OBS setup. Try again.";
    obsConnectionStatus.className = "obs-status-line is-error";
  } finally {
    autoObs.disabled = false;
  }
}

autoObs.addEventListener("click", () => {
  void connectObs();
});

obsPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void connectObs();
  }
});

revealExtension.addEventListener("click", () => {
  void window.duckDesk.revealExtension();
});

sendTest.addEventListener("click", () => void triggerDemoEvent("sale"));
sendBid.addEventListener("click", () => void triggerDemoEvent("bid"));
sendAction.addEventListener("click", () => void triggerDemoEvent("action"));
sendTip.addEventListener("click", () => void triggerDemoEvent("tip"));
sendShare.addEventListener("click", () => void triggerDemoEvent("share"));

for (const action of previewDemoActions) {
  action.addEventListener("click", () => {
    const kind = action.dataset.previewDemoAction;
    if (isDemoAction(kind)) {
      void triggerDemoEvent(kind);
    }
  });
}

demoPreviewNotice.addEventListener("click", () => {
  setDeskView("live", "live-preview");
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
  });
  action.dataset.defaultLabel = action.textContent ?? "Add";
}

for (const action of addonTestActions) {
  action.addEventListener("click", async () => {
    const effect = action.dataset.addonTest;
    if (!isSoundKind(effect)) {
      return;
    }

    if (action.closest(".module-audio")) {
      renderStatus(await window.duckDesk.triggerSound(effect));
      return;
    }

    if (action.closest(".module-hype")) {
      renderStatus(await window.duckDesk.triggerBurst());
    }
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

for (const action of gifPlacementActions) {
  action.addEventListener("click", async () => {
    const placement = action.dataset.gifPlacement;
    const size = currentStatus?.gifSize ?? "medium";
    if (isGifPlacement(placement)) {
      renderStatus(await window.duckDesk.setGifSettings(placement, size));
    }
  });
}

for (const action of gifSizeActions) {
  action.addEventListener("click", async () => {
    const size = action.dataset.gifSize;
    const placement = currentStatus?.gifPlacement ?? "center";
    if (isGifSize(size)) {
      renderStatus(await window.duckDesk.setGifSettings(placement, size));
    }
  });
}

for (const soundToggle of soundToggles) {
  soundToggle.addEventListener("click", async () => {
    const enabled = !(currentStatus?.soundsEnabled ?? true);
    const status = await window.duckDesk.setSoundsEnabled(enabled);
    renderStatus(status);
  });
}

soundVolume.addEventListener("input", () => {
  const volume = Math.max(0, Math.min(100, Number(soundVolume.value)));
  soundVolumeValue.value = `${Math.round(volume)}%`;
  window.clearTimeout(volumeSaveTimer);
  volumeSaveTimer = window.setTimeout(() => {
    void window.duckDesk.setSoundVolume(volume / 100).then(renderStatus);
  }, 90);
});

soundVolume.addEventListener("change", () => {
  window.clearTimeout(volumeSaveTimer);
  const volume = Math.max(0, Math.min(100, Number(soundVolume.value)));
  void window.duckDesk.setSoundVolume(volume / 100).then(renderStatus);
});

for (const action of audioThemeActions) {
  action.addEventListener("click", async () => {
    const theme = action.dataset.audioTheme;
    if (!isAudioTheme(theme)) {
      return;
    }

    let status = await window.duckDesk.setAudioTheme(theme);
    renderStatus(status);
    if (status.soundsEnabled) {
      status = await window.duckDesk.triggerSound("action");
      renderStatus(status);
    }
  });
}

for (const action of soundPreviewActions) {
  action.addEventListener("click", async () => {
    const kind = action.dataset.soundPreview;
    if (isSoundKind(kind)) {
      renderStatus(await window.duckDesk.triggerSound(kind));
    }
  });
}

for (const action of soundUploadActions) {
  action.addEventListener("click", async () => {
    const kind = action.dataset.soundUpload;
    if (!isSoundKind(kind)) {
      return;
    }

    const beforeRevision = currentStatus?.audioRevision;
    let status = await window.duckDesk.selectCustomSound(kind);
    renderStatus(status);
    if (status.soundsEnabled && status.audioRevision !== beforeRevision && status.customSounds[kind]) {
      status = await window.duckDesk.triggerSound(kind);
      renderStatus(status);
    }
  });
}

for (const action of soundResetActions) {
  action.addEventListener("click", async () => {
    const kind = action.dataset.soundReset;
    if (isSoundKind(kind)) {
      renderStatus(await window.duckDesk.removeCustomSound(kind));
    }
  });
}

saveMilestones.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setMilestones(milestoneThresholds.value));
});

saveHypeSeconds.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setHypeMeterSeconds(Number(hypeSeconds.value)));
});

triggerHypeMeter.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.triggerHypeMeter());
});

toggleJumbotronCamera.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setJumbotronCamera(!(currentStatus?.jumbotronCameraEnabled ?? false)));
});

savePromoBanners.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setPromoBanners(promoBanners.value));
});

for (const action of sceneActions) {
  action.addEventListener("click", async () => {
    const mode = action.dataset.sceneMode;
    if (isSceneMode(mode)) {
      renderStatus(await window.duckDesk.setSceneMode(mode));
    }
  });
}

saveGoals.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setGoals(goalConfig.value));
});

saveAuctionTimer.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setAuctionTimerSeconds(Number(auctionTimerSeconds.value)));
});

triggerAuctionTimer.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.triggerAuctionTimer());
});

triggerRecap.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.triggerRecap());
});

async function toggleDemoMode(): Promise<void> {
  const enabled = !(currentStatus?.demoMode ?? false);
  renderStatus(await window.duckDesk.setDemoMode(enabled));
}

demoToggle.addEventListener("click", () => void toggleDemoMode());
previewDemoToggle.addEventListener("click", () => void toggleDemoMode());

window.duckDesk.onStatus(renderStatus);
window.duckDesk.onEvent((event) => {
  const item = document.createElement("li");
  item.textContent = formatEventLog(event);
  eventLog.prepend(item);
  eventLogEmpty.hidden = true;

  while (eventLog.children.length > 8) {
    eventLog.lastElementChild?.remove();
  }
});

setDeskView("live");
void window.duckDesk.getStatus().then(renderStatus);
window.setInterval(() => {
  void window.duckDesk.getStatus().then(renderStatus);
}, 5_000);

function renderStatus(status: DesktopStatus): void {
  currentStatus = status;
  document.body.classList.toggle("platform-darwin", status.platform === "darwin");
  document.body.classList.toggle("platform-win32", status.platform === "win32");
  statusPill.textContent = status.ok ? "Running" : "Needs attention";
  statusPill.classList.toggle("ok", status.ok);
  statusError.hidden = !status.lastError;
  statusError.textContent = status.lastError ?? "";
  firstRun.hidden = status.firstRunComplete;
  hideFooter.checked = status.hideFooter;
  if (liveSoundToggle) {
    liveSoundToggle.hidden = status.addOns.includes("noise_machines");
  }
  overlayUrl.value = status.overlayUrl;
  const obsReady = isObsReady(status.obsStatus);
  const obsConnecting = status.obsStatus.startsWith("Connecting");
  autoObs.textContent = obsReady ? "Repair + Refresh" : obsConnecting ? "Connecting..." : "Connect + Add";
  autoObs.title = status.obsStatus;
  obsConnectionStatus.textContent = status.obsStatus;
  obsConnectionStatus.className = `obs-status-line${obsReady ? " is-ready" : obsConnecting ? " is-connecting" : status.obsStatus === "Not connected" ? "" : " is-error"}`;
  titlebarBridge.textContent = status.ok ? "Bridge on" : "Bridge";
  titlebarObs.textContent = obsReady ? "OBS ready" : "OBS";
  titlebarClients.textContent = `${status.clients} client${status.clients === 1 ? "" : "s"}`;
  renderPreflightCheck(preflightBridge, status.ok, status.ok ? "Online" : "Needs attention");
  renderPreflightCheck(preflightObs, obsReady, obsReady ? "Ready" : obsConnecting ? "Connecting" : "Setup needed", obsConnecting);
  renderPreflightCheck(
    preflightWhatnot,
    status.whatnotPageActive,
    status.whatnotPageActive ? "Seller page connected" : status.extensionConnected ? "Open seller page" : "Extension waiting"
  );
  renderPreflightCheck(
    preflightData,
    Boolean(status.lastRealEventAt),
    status.lastRealEventAt ? `Received ${formatRelativeTime(status.lastRealEventAt)}` : "No real events yet",
    !status.lastRealEventAt
  );
  const readyChecks = [status.ok, obsReady, status.whatnotPageActive, Boolean(status.lastRealEventAt)].filter(Boolean).length;
  preflightSummary.textContent = readyChecks === 4 ? "Ready to stream" : `${readyChecks} of 4 ready`;
  streamTitle.value = status.streamTitle;
  milestoneThresholds.value = status.milestoneThresholds.join(", ");
  hypeSeconds.value = String(status.hypeMeterSeconds);
  toggleJumbotronCamera.textContent = status.jumbotronCameraEnabled ? "Camera On" : "Camera Off";
  toggleJumbotronCamera.classList.toggle("is-on", status.jumbotronCameraEnabled);
  promoBanners.value = status.promoBanners.join("\n");
  goalConfig.value = formatGoals(status.goals);
  auctionTimerSeconds.value = String(status.auctionTimerSeconds);
  clientCount.textContent = String(status.clients);
  salesCount.textContent = String(status.salesCount);
  grossSales.textContent = dollars.format(status.grossSales);
  bidCount.textContent = String(status.bidCount);
  audienceCount.textContent = String(status.audienceActions);
  tipTotal.textContent = dollars.format(status.tipTotal);
  shareCount.textContent = String(status.shareCount);
  moduleBids.textContent = String(status.bidCount);
  moduleLeaderboard.textContent = `${status.salesCount} / ${dollars.format(status.grossSales)}`;
  moduleActivityCount.textContent = `${status.salesCount + status.bidCount + status.audienceActions + status.tipCount + status.shareCount} events`;
  activeThemeLabel.textContent = status.skin === "none" ? themeName(status.theme) : skinName(status.skin);
  for (const soundToggle of soundToggles) {
    const prefix = soundToggle.closest(".actions") ? "Event " : "";
    soundToggle.textContent = status.soundsEnabled ? `${prefix}Sound On` : `${prefix}Sound Off`;
    soundToggle.classList.toggle("is-on", status.soundsEnabled);
    soundToggle.setAttribute("aria-pressed", String(status.soundsEnabled));
  }
  if (document.activeElement !== soundVolume) {
    soundVolume.value = String(Math.round(status.soundVolume * 100));
  }
  soundVolumeValue.value = `${Math.round(status.soundVolume * 100)}%`;
  activeAudioTheme.textContent = audioThemeName(status.audioTheme);
  soundStatus.textContent = status.soundsEnabled ? status.audioNotice : "Muted. Event sounds are paused.";
  for (const action of audioThemeActions) {
    const isActive = action.dataset.audioTheme === status.audioTheme;
    action.classList.toggle("is-active", isActive);
    action.setAttribute("aria-pressed", String(isActive));
  }
  for (const kind of ["sale", "bid", "action", "tip", "share"] as const) {
    const fileLabel = readElement<HTMLElement>(`sound-file-${kind}`);
    const customFile = status.customSounds[kind];
    fileLabel.textContent = customFile ?? `${audioThemeName(status.audioTheme)} default`;
    fileLabel.title = customFile ?? "";
    const row = document.querySelector<HTMLElement>(`[data-custom-sound="${kind}"]`);
    row?.classList.toggle("has-custom-sound", Boolean(customFile));
    const reset = soundResetActions.find((action) => action.dataset.soundReset === kind);
    if (reset) {
      reset.hidden = !customFile;
    }
  }
  demoToggle.textContent = status.demoMode ? "Demo Mode On" : "Demo Mode Off";
  demoToggle.classList.toggle("is-on", status.demoMode);
  demoToggle.setAttribute("aria-pressed", String(status.demoMode));
  previewDemoToggleLabel.textContent = status.demoMode ? "Demo Mode On" : "Demo Mode Off";
  previewDemoToggle.classList.toggle("is-on", status.demoMode);
  previewDemoToggle.setAttribute("aria-pressed", String(status.demoMode));
  demoPreviewNotice.hidden = !status.demoMode;
  previewDemoPanel.hidden = !status.demoMode;
  for (const action of [sendTest, sendBid, sendAction, sendTip, sendShare]) {
    action.disabled = !status.demoMode;
    action.title = status.demoMode ? "" : "Turn on Demo Mode to send test events to the overlay.";
  }
  for (const action of previewDemoActions) {
    action.disabled = !status.demoMode;
  }
  for (const action of addonTestActions) {
    action.disabled = false;
    action.title = "";
  }
  for (const action of gifPlacementActions) {
    action.classList.toggle("is-active", action.dataset.gifPlacement === status.gifPlacement);
  }
  for (const action of gifSizeActions) {
    action.classList.toggle("is-active", action.dataset.gifSize === status.gifSize);
  }
  for (const action of sceneActions) {
    action.classList.toggle("is-active", action.dataset.sceneMode === status.sceneMode);
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
  renderCustomGifs(status.customGifs);
}

function isObsReady(status: string): boolean {
  return status.startsWith("Added") || status.startsWith("Updated");
}

function setDeskView(view: DeskView, tab?: DeskTab): void {
  const nextTab = tab ?? lastDeskTabs[view];
  lastDeskTabs[view] = nextTab;
  dashboard?.setAttribute("data-current-view", view);
  dashboard?.setAttribute("data-current-tab", nextTab);
  titlebarViewLabel.textContent = view === "live" ? "Live" : view === "setup" ? "Setup" : "Library";
  for (const button of viewButtons) {
    const active = button.dataset.deskView === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const tabSet of tabSets) {
    tabSet.hidden = tabSet.dataset.tabsFor !== view;
  }
  for (const button of tabButtons) {
    const active = button.dataset.deskTab === nextTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }
  for (const panel of tabPanels) {
    const tabs = panel.dataset.tab?.split(/\s+/) ?? [];
    panel.classList.toggle("is-tab-hidden", !tabs.includes(nextTab));
  }
}

function setDeskTab(tab: DeskTab): void {
  const view = deskViewForTab(tab);
  lastDeskTabs[view] = tab;
  setDeskView(view, tab);
}

function deskViewForTab(tab: DeskTab): DeskView {
  if (tab.startsWith("setup-")) {
    return "setup";
  }
  if (tab.startsWith("library-")) {
    return "library";
  }
  return "live";
}

function isDeskTab(value: string | undefined): value is DeskTab {
  return DESK_TABS.includes(value as DeskTab);
}

function isDemoAction(value: string | undefined): value is DemoAction {
  return value === "sale" || value === "bid" || value === "action" || value === "tip" || value === "share";
}

async function triggerDemoEvent(action: DemoAction): Promise<void> {
  if (action === "sale") {
    await window.duckDesk.sendTestSale();
  } else if (action === "bid") {
    await window.duckDesk.sendTestBid();
  } else if (action === "action") {
    await window.duckDesk.sendTestAction();
  } else if (action === "tip") {
    await window.duckDesk.sendTestTip();
  } else {
    await window.duckDesk.sendTestShare();
  }
}

function renderPreflightCheck(element: HTMLElement, ready: boolean, detail: string, pending = false): void {
  const detailElement = element.querySelector("strong");
  if (detailElement) {
    detailElement.textContent = detail;
  }
  element.classList.toggle("is-ready", ready);
  element.classList.toggle("is-pending", !ready && pending);
  element.classList.toggle("is-warning", !ready && !pending);
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  return `${Math.floor(seconds / 60)}m ago`;
}

function formatEventLog(event: ShowEventLog): string {
  if (event.type === "sale") {
    return `SOLD @${event.buyer} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "bid") {
    return `BID @${event.bidder} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "tip") {
    return `TIP @${event.tipper} ${dollars.format(event.amount ?? 0)}${event.message ? ` - ${event.message}` : ""}`;
  }

  if (event.type === "share") {
    const actor = event.actor ? ` @${event.actor}` : "";
    const count = event.delta && event.delta > 1 ? ` +${event.delta}` : event.shareCount ? ` (${event.shareCount} total)` : "";
    return `SHARE${actor}${count}`;
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
  const names: Record<OverlaySkin, string> = {
    none: "No Skin",
    cyber_market: "Cyber Market",
    arcade_drop: "Arcade Drop",
    sports_desk: "Sports Desk",
    card_shop: "Card Shop",
    retro_toy: "Retro Toy",
    midnight_gold: "Midnight Gold",
    pastel_pop: "Pastel Pop",
    lava_lamp: "Lava Lamp",
    icebox: "Icebox",
    comic_burst: "Comic Burst",
    luxury_black: "Luxury Black",
    jungle_neon: "Jungle Neon",
    cotton_candy: "Cotton Candy",
    synthwave: "Synthwave",
    streetwear: "Streetwear",
    holiday_spark: "Holiday Spark",
    ocean_depth: "Ocean Depth",
    pixel_party: "Pixel Party",
    emerald_vault: "Emerald Vault",
    storm_front: "Thunderstorm Arena",
    cyber_duck_city: "Cyber Duck City",
    treasure_vault: "Treasure Vault",
    boss_battle: "Arcade Boss Battle",
    cosmic_auction: "Cosmic Auction",
    haunted_drop: "Haunted Drop",
    sports_broadcast: "Sports Broadcast",
    anime_powerup: "Anime Power-Up",
    candy_rush: "Candy Rush",
    luxury_nightclub: "Luxury Nightclub",
    inferno_ring: "Inferno Ring",
    deep_reef: "Deep Reef",
    zen_garden: "Zen Garden",
    vinyl_lounge: "Vinyl Lounge",
    blueprint_draft: "Blueprint Studio",
    aurora_peaks: "Aurora Peaks",
    solar_flare: "Solar Flare",
    glacier_cavern: "Glacier Cavern",
    noir_detective: "Noir After Dark",
    retro_spaceport: "Retro Spaceport",
    royal_tournament: "Royal Tournament",
    desert_mirage: "Desert Mirage",
    enchanted_forest: "Enchanted Forest",
    steampunk_foundry: "Clockwork Foundry",
    hologram_lab: "Hologram Lab",
    stained_glass: "Stained Glass",
    paper_theater: "Paper Theater",
    midnight_library: "Midnight Library",
    carnival_nights: "Carnival Nights",
    moonlit_tide: "Moonlit Tide",
    koi_pond: "Koi Pond",
    crystal_cavern: "Crystal Cavern",
    racing_grid: "Racing Grid",
    wild_west: "Wild West",
    celestial_clockwork: "Celestial Clockwork",
    sakura_festival: "Sakura Festival"
  };
  return names[skin];
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
    value === "gif_reactions" ||
    value === "milestones" ||
    value === "hype_meter" ||
    value === "jumbotron" ||
    value === "promo_banners" ||
    value === "scene_switcher" ||
    value === "goal_widgets" ||
    value === "activity_feed" ||
    value === "auction_timer" ||
    value === "show_recap"
  );
}

function isSceneMode(value: unknown): value is SceneMode {
  return (
    value === "none" ||
    value === "starting" ||
    value === "auction" ||
    value === "break" ||
    value === "winner" ||
    value === "ending"
  );
}

function formatGoals(goals: GoalConfig[]): string {
  return goals
    .map((goal) => `${goal.kind}|${goal.target}|${goal.label}`)
    .join("\n");
}

function isOverlaySkin(value: unknown): value is OverlaySkin {
  return (
    value === "none" ||
    value === "cyber_market" ||
    value === "arcade_drop" ||
    value === "sports_desk" ||
    value === "card_shop" ||
    value === "retro_toy" ||
    value === "midnight_gold" ||
    value === "pastel_pop" ||
    value === "lava_lamp" ||
    value === "icebox" ||
    value === "comic_burst" ||
    value === "luxury_black" ||
    value === "jungle_neon" ||
    value === "cotton_candy" ||
    value === "synthwave" ||
    value === "streetwear" ||
    value === "holiday_spark" ||
    value === "ocean_depth" ||
    value === "pixel_party" ||
    value === "emerald_vault" ||
    value === "storm_front" ||
    value === "cyber_duck_city" ||
    value === "treasure_vault" ||
    value === "boss_battle" ||
    value === "cosmic_auction" ||
    value === "haunted_drop" ||
    value === "sports_broadcast" ||
    value === "anime_powerup" ||
    value === "candy_rush" ||
    value === "luxury_nightclub" ||
    value === "inferno_ring" ||
    value === "deep_reef" ||
    value === "zen_garden" ||
    value === "vinyl_lounge" ||
    value === "blueprint_draft" ||
    value === "aurora_peaks" ||
    value === "solar_flare" ||
    value === "glacier_cavern" ||
    value === "noir_detective" ||
    value === "retro_spaceport" ||
    value === "royal_tournament" ||
    value === "desert_mirage" ||
    value === "enchanted_forest" ||
    value === "steampunk_foundry" ||
    value === "hologram_lab" ||
    value === "stained_glass" ||
    value === "paper_theater" ||
    value === "midnight_library" ||
    value === "carnival_nights" ||
    value === "moonlit_tide" ||
    value === "koi_pond" ||
    value === "crystal_cavern" ||
    value === "racing_grid" ||
    value === "wild_west" ||
    value === "celestial_clockwork" ||
    value === "sakura_festival"
  );
}

function isGifPlacement(value: unknown): value is GifPlacement {
  return value === "center" || value === "top" || value === "bottom" || value === "left" || value === "right";
}

function isGifSize(value: unknown): value is GifSize {
  return value === "small" || value === "medium" || value === "large";
}

function isSoundKind(value: unknown): value is SoundKind {
  return value === "sale" || value === "bid" || value === "action" || value === "tip" || value === "share";
}

function isAudioTheme(value: unknown): value is AudioTheme {
  return (
    value === "neon_pulse" ||
    value === "arcade_8bit" ||
    value === "broadcast" ||
    value === "crystal" ||
    value === "duck_party" ||
    value === "luxury" ||
    value === "retro" ||
    value === "stadium" ||
    value === "storm" ||
    value === "zen"
  );
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

function renderCustomGifs(gifs: CustomGif[]): void {
  customGifList.replaceChildren();

  if (gifs.length === 0) {
    const empty = document.createElement("span");
    empty.className = "custom-gif-empty";
    empty.textContent = "No saved GIFs yet.";
    customGifList.append(empty);
    return;
  }

  for (const gif of gifs) {
    const row = document.createElement("article");
    row.className = "custom-gif-row";

    const preview = document.createElement("img");
    preview.src = gif.url;
    preview.alt = "";
    preview.referrerPolicy = "no-referrer";

    const details = document.createElement("div");
    details.className = "custom-gif-details";

    const label = document.createElement("input");
    label.value = gif.label;
    label.maxLength = 42;
    label.setAttribute("aria-label", `Name for ${compactUrl(gif.url)}`);
    label.addEventListener("change", () => {
      void window.duckDesk.setCustomGifLabel(gif.id, label.value).then(renderStatus);
    });
    label.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        label.blur();
      }
    });

    const source = document.createElement("span");
    source.textContent = compactUrl(gif.url);
    source.title = gif.url;
    details.append(label, source);

    const actions = document.createElement("div");
    actions.className = "custom-gif-actions";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = "Trigger";
    trigger.title = `Trigger ${gif.label}`;
    trigger.addEventListener("click", () => {
      void window.duckDesk.triggerGif(gif.id).then((status) => {
        renderStatus(status);
        setGifStatus(`Triggered ${gif.label}.`, "ok");
      });
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-gif";
    remove.textContent = "Remove";
    remove.title = `Remove ${gif.label}`;
    remove.addEventListener("click", () => {
      void window.duckDesk.removeCustomGif(gif.id).then(renderStatus);
    });

    actions.append(trigger, remove);
    row.append(preview, details, actions);
    customGifList.append(row);
  }
}

async function addGifFromInput(): Promise<void> {
  const rawUrl = gifUrl.value.trim();
  if (!rawUrl) {
    setGifStatus("Paste a GIF, WebP, or Giphy URL first.", "error");
    return;
  }

  const previousIds = currentStatus?.customGifs.map((gif) => gif.id) ?? [];
  const status = await window.duckDesk.addCustomGif(rawUrl);
  const addedOrMatched = status.customGifs.some((gif) => (
    !previousIds.includes(gif.id) || gif.url === rawUrl || isLikelySameGiphyUrl(rawUrl, gif.url)
  ));

  renderStatus(status);

  if (addedOrMatched) {
    gifUrl.value = "";
    setGifStatus("Saved. Use Trigger Latest GIF or a row Trigger button to fire it.", "ok");
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

function readElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }

  return element as T;
}
