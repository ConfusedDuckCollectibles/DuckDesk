import "./styles.css";
import {
  Activity,
  AudioWaveform,
  CircleDollarSign,
  createIcons,
  ExternalLink,
  Gauge,
  Gavel,
  HandCoins,
  Heart,
  LibraryBig,
  MonitorPlay,
  Palette,
  PanelTop,
  Play,
  PlugZap,
  Radio,
  RefreshCw,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Layers,
  Upload,
  Volume2,
  Package
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
  hideTopBanner: boolean;
  themeEffectsEnabled: boolean;
  firstRunComplete: boolean;
  platform: string;
  obsStatus: string;
  extensionConnected: boolean;
  whatnotPageActive: boolean;
  lastRealEventAt?: number;
  remoteAvailable: boolean;
  remoteUrl?: string;
  remotePairingCode: string;
  remoteQrDataUrl?: string;
  remoteClients: number;
  remoteLastSeenAt?: number;
  lastError?: string;
  rehearsal: RehearsalStatus;
  rehearsals: RehearsalSummary[];
  rehearsalNotice?: string;
  alertVisuals: AlertVisualMap;
  packs: InstalledPackView[];
  pendingPack?: PendingPackReview;
  packUndoAvailable: boolean;
  packNotice?: string;
  showEpoch: number;
  showNotice?: string;
  showProfiles: Array<{ id: string; name: string; updatedAt: number }>;
  activeShowProfileId?: string;
  healthChecks: HealthCheckView[];
  update: UpdateStatusView;
  recoveryNotice?: string;
  rejectedEventCount: number;
  duplicateEventCount: number;
  gameState?: GameThemeProgress;
};

type GameThemeProgress = {
  schemaVersion: number;
  theme: GameThemeId;
  level: number;
  progress: number;
  target: number;
  totalPoints: number;
  wins: number;
  lastGain: number;
  revision: number;
  lastAction: "idle" | "bid" | "audience" | "share" | "tip" | "sale" | "level_up" | "win";
  actionAt?: number;
  celebration: "none" | "level_up" | "win";
};
type GameThemeId =
  | "game_tower_tresses"
  | "game_starship_rally"
  | "game_moon_garden"
  | "game_crystal_quest"
  | "game_neon_grand_prix";

type RehearsalState = "idle" | "playing" | "paused" | "recording";
type RehearsalStatus = {
  state: RehearsalState;
  activeId?: string;
  activeName?: string;
  elapsedMs: number;
  durationMs: number;
  nextActionAtMs?: number;
  nextActionKind?: string;
  recordingActions: number;
};
type RehearsalSummary = {
  id: string;
  name: string;
  durationMs: number;
  actionCount: number;
  builtIn: boolean;
};
type InstalledPackView = {
  id: string;
  name: string;
  author: string;
  packVersion: string;
  description: string;
  license: string;
  projectUrl?: string;
  preview?: string;
  previewUrl?: string;
  installedAt: number;
};
type PendingPackReview = {
  name: string;
  author: string;
  packVersion: string;
  license: string;
  description: string;
  projectUrl?: string;
  review: Array<{ label: string; detail: string }>;
  previewDataUrl?: string;
};
type HealthCheckView = {
  id: string;
  label: string;
  ready: boolean;
  pending?: boolean;
  detail: string;
  action?: string;
};
type UpdateStatusView = {
  currentVersion: string;
  latestVersion?: string;
  notesUrl?: string;
  status: "unknown" | "current" | "available" | "error";
  detail: string;
};
type AlertKind = "sale" | "bid" | "action" | "tip" | "share";
type AlertVisualConfig = {
  enabled: boolean;
  placement: "below_banner" | "upper" | "center" | "lower";
  size: "compact" | "standard" | "large";
  durationMs: number;
  entrance: "rise" | "slide" | "pop" | "broadcast" | "none";
  accent: string;
  typography: "theme" | "modern" | "condensed" | "editorial";
  mediaUrl?: string;
};
type AlertVisualMap = Record<AlertKind, AlertVisualConfig>;

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
  | "sakura_festival"
  | "neon_museum"
  | "chrome_showroom"
  | "prism_arcade"
  | "velvet_casino"
  | "alpine_lodge"
  | "circuit_garden"
  | "gemstone_gallery"
  | "sunset_boardwalk"
  | "midnight_observatory"
  | "tea_house"
  | GameThemeId;
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
  copyRemoteUrl: () => Promise<DesktopStatus>;
  openRemoteDeck: () => Promise<DesktopStatus>;
  rotateRemoteAccess: () => Promise<DesktopStatus>;
  revealExtension: () => Promise<void>;
  completeFirstRun: () => Promise<DesktopStatus>;
  setHideTopBanner: (hidden: boolean) => Promise<DesktopStatus>;
  setThemeEffectsEnabled: (enabled: boolean) => Promise<DesktopStatus>;
  autoAddObsOverlay: (password?: string) => Promise<DesktopStatus>;
  sendTestSale: () => Promise<void>;
  sendTestBid: () => Promise<void>;
  sendTestAction: () => Promise<void>;
  sendTestTip: () => Promise<void>;
  sendTestShare: () => Promise<void>;
  setTheme: (theme: OverlayTheme) => Promise<DesktopStatus>;
  setSkin: (skin: OverlaySkin) => Promise<DesktopStatus>;
  resetGameTheme: () => Promise<DesktopStatus>;
  previewGameProgress: () => Promise<DesktopStatus>;
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
  setAlertVisual: (kind: AlertKind, patch: Partial<AlertVisualConfig> & { mediaUrl?: string | null }) => Promise<DesktopStatus>;
  resetAlertVisual: (kind: AlertKind) => Promise<DesktopStatus>;
  previewAlert: (kind: AlertKind) => Promise<DesktopStatus>;
  startRehearsal: (id: string) => Promise<DesktopStatus>;
  pauseRehearsal: () => Promise<DesktopStatus>;
  resumeRehearsal: () => Promise<DesktopStatus>;
  stopRehearsal: () => Promise<DesktopStatus>;
  startRehearsalRecording: () => Promise<DesktopStatus>;
  saveRehearsalRecording: (name: string) => Promise<DesktopStatus>;
  renameRehearsal: (id: string, name: string) => Promise<DesktopStatus>;
  deleteRehearsal: (id: string) => Promise<DesktopStatus>;
  importPack: () => Promise<DesktopStatus>;
  confirmImportPack: () => Promise<DesktopStatus>;
  cancelImportPack: () => Promise<DesktopStatus>;
  applyPack: (id: string) => Promise<DesktopStatus>;
  exportPack: (id: string) => Promise<DesktopStatus>;
  exportCurrentSetup: () => Promise<DesktopStatus>;
  startNewShow: () => Promise<DesktopStatus>;
  saveShowProfile: (name: string) => Promise<DesktopStatus>;
  loadShowProfile: (id: string) => Promise<DesktopStatus>;
  deleteShowProfile: (id: string) => Promise<DesktopStatus>;
  exportShowProfile: (id: string) => Promise<DesktopStatus>;
  importShowProfile: () => Promise<DesktopStatus>;
  removePack: (id: string) => Promise<DesktopStatus>;
  undoPack: () => Promise<DesktopStatus>;
  restartBridge: () => Promise<DesktopStatus>;
  clearOverlayQueue: () => Promise<DesktopStatus>;
  resetAudioOutput: () => Promise<DesktopStatus>;
  openLogFolder: () => Promise<DesktopStatus>;
  checkForUpdates: () => Promise<DesktopStatus>;
  exportDiagnostics: () => Promise<DesktopStatus>;
  dismissRecoveryNotice: () => Promise<DesktopStatus>;
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
  rehearsal?: boolean;
};

type DeskView = "live" | "setup" | "library";
type DemoAction = "sale" | "bid" | "action" | "tip" | "share";
type DeskTab =
  | "live-show"
  | "live-controls"
  | "live-preview"
  | "live-remote"
  | "live-events"
  | "setup-connection"
  | "setup-preflight"
  | "setup-show"
  | "library-themes"
  | "library-addons"
  | "library-studio"
  | "library-packs";

const DESK_TABS: DeskTab[] = [
  "live-show",
  "live-controls",
  "live-preview",
  "live-remote",
  "live-events",
  "setup-connection",
  "setup-preflight",
  "setup-show",
  "library-themes",
  "library-addons",
  "library-studio",
  "library-packs"
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
const topBannerToggle = readElement<HTMLButtonElement>("top-banner-toggle");
const topBannerToggleLabel = readElement<HTMLElement>("top-banner-toggle-label");
const themeEffectsToggle = readElement<HTMLButtonElement>("theme-effects-toggle");
const themeEffectsToggleLabel = readElement<HTMLElement>("theme-effects-toggle-label");
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
const healthChecks = readElement<HTMLElement>("health-checks");
const recoveryNotice = readElement<HTMLElement>("recovery-notice");
const updateStatusLine = readElement<HTMLElement>("update-status");
const restartBridge = readElement<HTMLButtonElement>("restart-bridge");
const clearOverlayQueue = readElement<HTMLButtonElement>("clear-overlay-queue");
const resetAudioOutput = readElement<HTMLButtonElement>("reset-audio-output");
const openLogFolder = readElement<HTMLButtonElement>("open-log-folder");
const checkForUpdates = readElement<HTMLButtonElement>("check-for-updates");
const exportDiagnostics = readElement<HTMLButtonElement>("export-diagnostics");
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
const addonThemeTitles = Array.from(document.querySelectorAll<HTMLElement>("[data-addon-theme-title]"));
const gameThemeControls = readElement<HTMLElement>("game-theme-controls");
const gameThemeName = readElement<HTMLElement>("game-theme-name");
const gameThemeLevel = readElement<HTMLElement>("game-theme-level");
const gameThemeObjective = readElement<HTMLElement>("game-theme-objective");
const gameThemeProgress = readElement<HTMLElement>("game-theme-progress-fill");
const gameThemePoints = readElement<HTMLElement>("game-theme-points");
const gameThemeWins = readElement<HTMLElement>("game-theme-wins");
const previewGameProgress = readElement<HTMLButtonElement>("preview-game-progress");
const resetGameTheme = readElement<HTMLButtonElement>("reset-game-theme");
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
const remoteConnectionBadge = readElement<HTMLElement>("remote-connection-badge");
const remoteQr = readElement<HTMLImageElement>("remote-qr");
const remoteQrUnavailable = readElement<HTMLElement>("remote-qr-unavailable");
const remotePairingCode = readElement<HTMLElement>("remote-pairing-code");
const remoteUrl = readElement<HTMLInputElement>("remote-url");
const copyRemoteUrl = readElement<HTMLButtonElement>("copy-remote-url");
const openRemoteDeck = readElement<HTMLButtonElement>("open-remote-deck");
const rotateRemoteAccess = readElement<HTMLButtonElement>("rotate-remote-access");
const remoteClientCount = readElement<HTMLElement>("remote-client-count");
const remoteLastSeen = readElement<HTMLElement>("remote-last-seen");
const rehearsalTitlebarBadge = readElement<HTMLElement>("rehearsal-titlebar-badge");
const rehearsalRecordingName = readElement<HTMLInputElement>("rehearsal-recording-name");
const alertKindTabs = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-alert-kind]"));
const alertEnabled = readElement<HTMLInputElement>("alert-enabled");
const alertPlacement = readElement<HTMLSelectElement>("alert-placement");
const alertSize = readElement<HTMLSelectElement>("alert-size");
const alertDuration = readElement<HTMLInputElement>("alert-duration");
const alertEntrance = readElement<HTMLSelectElement>("alert-entrance");
const alertTypography = readElement<HTMLSelectElement>("alert-typography");
const alertAccent = readElement<HTMLInputElement>("alert-accent");
const alertAccentTheme = readElement<HTMLInputElement>("alert-accent-theme");
const alertMedia = readElement<HTMLSelectElement>("alert-media");
const previewAlert = readElement<HTMLButtonElement>("preview-alert");
const resetAlert = readElement<HTMLButtonElement>("reset-alert");
const importPack = readElement<HTMLButtonElement>("import-pack");
const exportCurrentSetup = readElement<HTMLButtonElement>("export-current-setup");
const startNewShow = readElement<HTMLButtonElement>("start-new-show");
const startNewShowSetup = readElement<HTMLButtonElement>("start-new-show-setup");
const showSessionNotice = readElement<HTMLElement>("show-session-notice");
const showProfileNotice = readElement<HTMLElement>("show-profile-notice");
const showProfileName = readElement<HTMLInputElement>("show-profile-name");
const saveShowProfile = readElement<HTMLButtonElement>("save-show-profile");
const loadShowProfile = readElement<HTMLButtonElement>("load-show-profile");
const exportShowProfile = readElement<HTMLButtonElement>("export-show-profile");
const importShowProfile = readElement<HTMLButtonElement>("import-show-profile");
const deleteShowProfile = readElement<HTMLButtonElement>("delete-show-profile");
const showProfilesStatus = readElement<HTMLElement>("show-profiles-status");
const showProfileEmpty = readElement<HTMLElement>("show-profile-empty");
const showProfileList = readElement<HTMLElement>("show-profile-list");
const undoPack = readElement<HTMLButtonElement>("undo-pack");
const packNotice = readElement<HTMLElement>("pack-notice");
const packsStatus = readElement<HTMLElement>("packs-status");
const packReview = readElement<HTMLElement>("pack-review");
const packReviewTitle = readElement<HTMLElement>("pack-review-title");
const packReviewMeta = readElement<HTMLElement>("pack-review-meta");
const packReviewPreview = readElement<HTMLImageElement>("pack-review-preview");
const packReviewChanges = readElement<HTMLElement>("pack-review-changes");
const confirmImportPack = readElement<HTMLButtonElement>("confirm-import-pack");
const cancelImportPack = readElement<HTMLButtonElement>("cancel-import-pack");
const packEmpty = readElement<HTMLElement>("pack-empty");
const packGrid = readElement<HTMLElement>("pack-grid");

let currentStatus: DesktopStatus | undefined;
let volumeSaveTimer: number | undefined;
let renamingRehearsalId: string | undefined;
let renamingRehearsalHost: "events" | "preview" | undefined;
let selectedAlertKind: AlertKind = "sale";
let syncingAlertStudio = false;
let lastShowEpoch: number | undefined;
let selectedShowProfileId = "";
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
    ExternalLink,
    Gauge,
    Gavel,
    HandCoins,
    Heart,
    LibraryBig,
    MonitorPlay,
    Palette,
    PanelTop,
    Play,
    PlugZap,
    Radio,
    RefreshCw,
    RotateCcw,
    Share2,
    SlidersHorizontal,
    Smartphone,
    Sparkles,
    Layers,
    Upload,
    Volume2,
    Package
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

copyRemoteUrl.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.copyRemoteUrl());
  copyRemoteUrl.textContent = "Copied";
  window.setTimeout(() => {
    copyRemoteUrl.textContent = "Copy";
  }, 1200);
});

openRemoteDeck.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.openRemoteDeck());
});

rotateRemoteAccess.addEventListener("click", async () => {
  rotateRemoteAccess.disabled = true;
  try {
    renderStatus(await window.duckDesk.rotateRemoteAccess());
  } finally {
    rotateRemoteAccess.disabled = false;
  }
});

dashboard?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const commandButton = target.closest<HTMLButtonElement>("[data-rehearsal-command]");
  if (commandButton) {
    const command = commandButton.dataset.rehearsalCommand;
    if (command === "pause") {
      renderStatus(await window.duckDesk.pauseRehearsal());
      return;
    }
    if (command === "resume") {
      renderStatus(await window.duckDesk.resumeRehearsal());
      return;
    }
    if (command === "stop") {
      renderStatus(await window.duckDesk.stopRehearsal());
      return;
    }
    if (command === "record") {
      renderStatus(await window.duckDesk.startRehearsalRecording());
      return;
    }
    if (command === "save") {
      renderStatus(await window.duckDesk.saveRehearsalRecording(rehearsalRecordingNameValue()));
    }
    return;
  }
  const button = target.closest("button");
  if (!(button instanceof HTMLButtonElement) || !button.dataset.rehearsalAction) {
    return;
  }
  const card = button.closest<HTMLElement>("[data-rehearsal-id]");
  const id = card?.dataset.rehearsalId;
  if (!id) {
    return;
  }
  if (button.dataset.rehearsalAction === "play") {
    renderStatus(await window.duckDesk.startRehearsal(id));
    return;
  }
  if (button.dataset.rehearsalAction === "rename") {
    renamingRehearsalHost = button.closest(".preview-rehearsal") ? "preview" : "events";
    const input = card.querySelector("input");
    if (input instanceof HTMLInputElement && renamingRehearsalId === id) {
      renamingRehearsalId = undefined;
      renamingRehearsalHost = undefined;
      renderStatus(await window.duckDesk.renameRehearsal(id, input.value));
      return;
    }
    renamingRehearsalId = id;
    if (currentStatus) {
      renderStatus(currentStatus);
    }
    return;
  }
  if (button.dataset.rehearsalAction === "delete") {
    renamingRehearsalId = undefined;
    renamingRehearsalHost = undefined;
    renderStatus(await window.duckDesk.deleteRehearsal(id));
  }
});

dashboard?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.closest(".rehearsal-timelines")) {
    return;
  }
  const id = target.closest<HTMLElement>("[data-rehearsal-id]")?.dataset.rehearsalId;
  if (!id) {
    return;
  }
  renamingRehearsalId = undefined;
  renamingRehearsalHost = undefined;
  void window.duckDesk.renameRehearsal(id, target.value).then(renderStatus);
});

for (const input of rehearsalNameInputs()) {
  input.addEventListener("input", () => {
    const value = input.value;
    for (const other of rehearsalNameInputs()) {
      if (other !== input) {
        other.value = value;
      }
    }
  });
}

importPack.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.importPack());
});
exportCurrentSetup.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.exportCurrentSetup());
});

startNewShow.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.startNewShow());
});
startNewShowSetup.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.startNewShow());
});
saveShowProfile.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.saveShowProfile(showProfileName.value));
});
loadShowProfile.addEventListener("click", async () => {
  if (!selectedShowProfileId) {
    return;
  }
  renderStatus(await window.duckDesk.loadShowProfile(selectedShowProfileId));
});
exportShowProfile.addEventListener("click", async () => {
  if (!selectedShowProfileId) {
    return;
  }
  renderStatus(await window.duckDesk.exportShowProfile(selectedShowProfileId));
});
importShowProfile.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.importShowProfile());
});
deleteShowProfile.addEventListener("click", async () => {
  if (!selectedShowProfileId) {
    return;
  }
  renderStatus(await window.duckDesk.deleteShowProfile(selectedShowProfileId));
});
showProfileList.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-show-profile-id]");
  if (!button?.dataset.showProfileId) {
    return;
  }
  selectedShowProfileId = button.dataset.showProfileId;
  for (const row of showProfileList.querySelectorAll<HTMLButtonElement>("[data-show-profile-id]")) {
    row.classList.toggle("is-active", row.dataset.showProfileId === selectedShowProfileId);
  }
});
undoPack.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.undoPack());
});
confirmImportPack.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.confirmImportPack());
});
cancelImportPack.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.cancelImportPack());
});
restartBridge.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.restartBridge());
});
clearOverlayQueue.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.clearOverlayQueue());
});
resetAudioOutput.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.resetAudioOutput());
});
openLogFolder.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.openLogFolder());
});
checkForUpdates.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.checkForUpdates());
});
exportDiagnostics.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.exportDiagnostics());
});

for (const tab of alertKindTabs) {
  tab.addEventListener("click", () => {
    const kind = tab.dataset.alertKind;
    if (!isAlertKind(kind)) {
      return;
    }
    selectedAlertKind = kind;
    if (currentStatus) {
      renderAlertStudio(currentStatus);
    }
  });
}

alertEnabled.addEventListener("change", () => {
  void persistAlertPatch({ enabled: alertEnabled.checked });
});
alertPlacement.addEventListener("change", () => {
  void persistAlertPatch({ placement: alertPlacement.value as AlertVisualConfig["placement"] });
});
alertSize.addEventListener("change", () => {
  void persistAlertPatch({ size: alertSize.value as AlertVisualConfig["size"] });
});
alertDuration.addEventListener("change", () => {
  void persistAlertPatch({ durationMs: Number(alertDuration.value) });
});
alertEntrance.addEventListener("change", () => {
  void persistAlertPatch({ entrance: alertEntrance.value as AlertVisualConfig["entrance"] });
});
alertTypography.addEventListener("change", () => {
  void persistAlertPatch({ typography: alertTypography.value as AlertVisualConfig["typography"] });
});
alertAccent.addEventListener("input", () => {
  if (alertAccentTheme.checked) {
    return;
  }
  void persistAlertPatch({ accent: alertAccent.value });
});
alertAccentTheme.addEventListener("change", () => {
  void persistAlertPatch({ accent: alertAccentTheme.checked ? "theme" : alertAccent.value });
});
alertMedia.addEventListener("change", () => {
  void persistAlertPatch({ mediaUrl: alertMedia.value || undefined });
});
previewAlert.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.previewAlert(selectedAlertKind));
});
resetAlert.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.resetAlertVisual(selectedAlertKind));
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

topBannerToggle.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setHideTopBanner(!(currentStatus?.hideTopBanner ?? false)));
});

themeEffectsToggle.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.setThemeEffectsEnabled(!(currentStatus?.themeEffectsEnabled ?? true)));
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

previewGameProgress.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.previewGameProgress());
});

resetGameTheme.addEventListener("click", async () => {
  renderStatus(await window.duckDesk.resetGameTheme());
});

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
  item.classList.toggle("is-rehearsal", Boolean(event.rehearsal));
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
  const topBannerVisible = !status.hideTopBanner;
  topBannerToggleLabel.textContent = `Top Banner ${topBannerVisible ? "On" : "Off"}`;
  topBannerToggle.classList.toggle("is-on", topBannerVisible);
  topBannerToggle.setAttribute("aria-pressed", String(topBannerVisible));
  topBannerToggle.title = topBannerVisible
    ? "Hide the top banner from viewers"
    : "Show the top banner to viewers";
  themeEffectsToggleLabel.textContent = `Theme Effects ${status.themeEffectsEnabled ? "On" : "Off"}`;
  themeEffectsToggle.classList.toggle("is-on", status.themeEffectsEnabled);
  themeEffectsToggle.setAttribute("aria-pressed", String(status.themeEffectsEnabled));
  themeEffectsToggle.title = status.themeEffectsEnabled
    ? "Hide theme borders and ambient animation"
    : "Show theme borders and ambient animation";
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
  renderHealthChecks(status);
  const readyChecks = (status.healthChecks ?? []).filter((check) => check.ready).length;
  const totalChecks = Math.max(1, (status.healthChecks ?? []).length);
  preflightSummary.textContent = readyChecks === totalChecks ? "Ready to stream" : `${readyChecks} of ${totalChecks} ready`;
  recoveryNotice.hidden = !status.recoveryNotice;
  recoveryNotice.textContent = status.recoveryNotice ?? "";
  updateStatusLine.textContent = status.update
    ? `${status.update.currentVersion} · ${status.update.detail}`
    : "Version check has not run yet.";
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
  remoteConnectionBadge.textContent = status.remoteClients > 0
    ? `${status.remoteClients} connected`
    : status.remoteAvailable ? "Ready to pair" : "Network unavailable";
  remoteConnectionBadge.classList.toggle("is-ready", status.remoteClients > 0);
  remotePairingCode.textContent = status.remotePairingCode;
  remoteUrl.value = status.remoteUrl ?? "";
  copyRemoteUrl.disabled = !status.remoteAvailable;
  openRemoteDeck.disabled = !status.remoteAvailable;
  remoteClientCount.textContent = `${status.remoteClients} connected`;
  remoteLastSeen.textContent = status.remoteLastSeenAt ? formatRelativeTime(status.remoteLastSeenAt) : "None yet";
  const qrReady = Boolean(status.remoteQrDataUrl);
  remoteQr.hidden = !qrReady;
  remoteQrUnavailable.hidden = qrReady;
  if (status.remoteQrDataUrl && remoteQr.src !== status.remoteQrDataUrl) {
    remoteQr.src = status.remoteQrDataUrl;
  }
  renderRehearsal(status);
  renderAlertStudio(status);
  renderShowProfiles(status);
  if (lastShowEpoch === undefined) {
    lastShowEpoch = status.showEpoch ?? 0;
  } else if (status.showEpoch !== lastShowEpoch) {
    lastShowEpoch = status.showEpoch;
    eventLog.replaceChildren();
    eventLogEmpty.hidden = false;
  }
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

  renderGameThemeStatus(status.gameState);

  renderAddOns(status.addOns);
  renderCustomGifs(status.customGifs);
  renderPacks(status);
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

function renderHealthChecks(status: DesktopStatus): void {
  const checks = status.healthChecks ?? [];
  healthChecks.replaceChildren();
  for (const check of checks) {
    const row = document.createElement("div");
    row.className = "preflight-check";
    row.classList.toggle("is-ready", check.ready);
    row.classList.toggle("is-pending", !check.ready && Boolean(check.pending));
    row.classList.toggle("is-warning", !check.ready && !check.pending);
    const label = document.createElement("span");
    label.textContent = check.label;
    const detail = document.createElement("strong");
    detail.textContent = check.detail;
    row.append(label, detail);
    healthChecks.append(row);
  }
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
  const prefix = event.rehearsal ? "REHEARSAL " : "";
  if (event.type === "sale") {
    return `${prefix}SOLD @${event.buyer} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "bid") {
    return `${prefix}BID @${event.bidder} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "tip") {
    return `${prefix}TIP @${event.tipper} ${dollars.format(event.amount ?? 0)}${event.message ? ` - ${event.message}` : ""}`;
  }

  if (event.type === "share") {
    const actor = event.actor ? ` @${event.actor}` : "";
    const count = event.delta && event.delta > 1 ? ` +${event.delta}` : event.shareCount ? ` (${event.shareCount} total)` : "";
    return `${prefix}SHARE${actor}${count}`;
  }

  return `${prefix}AUDIENCE @${event.actor}${event.message ? ` - ${event.message}` : ""}`;
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function rehearsalStateLabel(state: RehearsalState): string {
  if (state === "playing") {
    return "Playing";
  }
  if (state === "paused") {
    return "Paused";
  }
  if (state === "recording") {
    return "Recording";
  }
  return "Idle";
}

function nextActionLabel(kind?: string): string {
  if (kind === "event") {
    return "event";
  }
  if (kind === "gif") {
    return "GIF";
  }
  if (kind === "sound") {
    return "sound";
  }
  if (kind === "scene") {
    return "scene";
  }
  if (kind === "burst") {
    return "burst";
  }
  if (kind === "hype") {
    return "hype meter";
  }
  if (kind === "timer") {
    return "timer";
  }
  if (kind === "recap") {
    return "recap";
  }
  if (kind === "clear") {
    return "clear";
  }
  return "action";
}

function renderRehearsal(status: DesktopStatus): void {
  const rehearsal = status.rehearsal;
  if (!rehearsal) {
    return;
  }
  const active = rehearsal.state === "playing" || rehearsal.state === "paused" || rehearsal.state === "recording";
  rehearsalTitlebarBadge.hidden = !active;
  for (const badge of rehearsalElements("rehearsal-state-badge")) {
    badge.textContent = rehearsalStateLabel(rehearsal.state);
    badge.classList.toggle("is-active", active);
  }
  for (const notice of rehearsalElements("rehearsal-notice")) {
    notice.hidden = !status.rehearsalNotice;
    notice.textContent = status.rehearsalNotice ?? "";
  }
  const progress = rehearsal.durationMs > 0 ? Math.min(100, (rehearsal.elapsedMs / rehearsal.durationMs) * 100) : 0;
  for (const fill of rehearsalElements("rehearsal-progress-fill")) {
    fill.style.width = `${progress}%`;
  }
  let progressCopy = "Choose a scenario to start.";
  if (rehearsal.state === "recording") {
    progressCopy = `Recording ${formatClock(rehearsal.elapsedMs)} · ${rehearsal.recordingActions} captured`;
  } else if (rehearsal.state === "playing" || rehearsal.state === "paused") {
    const next = rehearsal.nextActionAtMs == null
      ? "Finishing"
      : `Next ${nextActionLabel(rehearsal.nextActionKind)} at ${formatClock(rehearsal.nextActionAtMs)}`;
    progressCopy = `${rehearsal.activeName ?? "Rehearsal"} · ${formatClock(rehearsal.elapsedMs)} / ${formatClock(rehearsal.durationMs)} · ${next}`;
  }
  for (const copy of rehearsalElements("rehearsal-progress-copy")) {
    copy.textContent = progressCopy;
  }
  for (const button of rehearsalCommandButtons("pause")) {
    button.disabled = rehearsal.state !== "playing";
  }
  for (const button of rehearsalCommandButtons("resume")) {
    button.disabled = rehearsal.state !== "paused";
  }
  for (const button of rehearsalCommandButtons("stop")) {
    button.disabled = rehearsal.state === "idle";
  }
  for (const button of rehearsalCommandButtons("record")) {
    button.disabled = rehearsal.state === "recording";
  }
  for (const button of rehearsalCommandButtons("save")) {
    button.disabled = rehearsal.state !== "recording" || rehearsal.recordingActions === 0;
  }
  const focused = document.activeElement;
  const keepRenameFocus = focused instanceof HTMLInputElement && focused.closest(".rehearsal-timelines");
  if (!keepRenameFocus) {
    const lists = Array.from(document.querySelectorAll<HTMLElement>(".rehearsal-timelines"));
    for (const list of lists) {
      list.replaceChildren(...status.rehearsals.map((timeline) => buildRehearsalCard(timeline, rehearsal.activeId)));
    }
    if (renamingRehearsalId) {
      const host = renamingRehearsalHost === "preview"
        ? document.querySelector(".preview-rehearsal .rehearsal-timelines")
        : document.getElementById("rehearsal-timelines");
      host?.querySelector("input")?.focus();
    }
  }
}

function buildRehearsalCard(timeline: RehearsalSummary, activeId?: string): HTMLElement {
  const card = document.createElement("article");
  card.className = "rehearsal-card";
  card.classList.toggle("is-active", timeline.id === activeId);
  card.dataset.rehearsalId = timeline.id;
  const copy = document.createElement("div");
  copy.className = "rehearsal-card-copy";
  if (renamingRehearsalId === timeline.id && !timeline.builtIn) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 60;
    input.value = timeline.name;
    copy.append(input);
  } else {
    const title = document.createElement("strong");
    title.textContent = timeline.name;
    copy.append(title);
  }
  const meta = document.createElement("span");
  meta.textContent = `${timeline.builtIn ? "Built-in" : "Saved"} · ${formatClock(timeline.durationMs)} · ${timeline.actionCount} actions`;
  copy.append(meta);
  const actions = document.createElement("div");
  actions.className = "rehearsal-card-actions";
  const play = document.createElement("button");
  play.type = "button";
  play.dataset.rehearsalAction = "play";
  play.textContent = "Play";
  actions.append(play);
  if (!timeline.builtIn) {
    const rename = document.createElement("button");
    rename.type = "button";
    rename.dataset.rehearsalAction = "rename";
    rename.textContent = renamingRehearsalId === timeline.id ? "Save" : "Rename";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.rehearsalAction = "delete";
    remove.textContent = "Delete";
    actions.append(rename, remove);
  }
  card.append(copy, actions);
  return card;
}

function isAlertKind(value: unknown): value is AlertKind {
  return value === "sale" || value === "bid" || value === "action" || value === "tip" || value === "share";
}

async function persistAlertPatch(patch: Partial<AlertVisualConfig>): Promise<void> {
  if (syncingAlertStudio) {
    return;
  }
  renderStatus(await window.duckDesk.setAlertVisual(selectedAlertKind, patch));
}

function renderAlertStudio(status: DesktopStatus): void {
  if (!status.alertVisuals) {
    return;
  }
  const visual = status.alertVisuals[selectedAlertKind];
  syncingAlertStudio = true;
  for (const tab of alertKindTabs) {
    const active = tab.dataset.alertKind === selectedAlertKind;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  alertEnabled.checked = visual.enabled;
  alertPlacement.value = visual.placement;
  alertSize.value = visual.size;
  alertDuration.value = String(visual.durationMs);
  alertEntrance.value = visual.entrance;
  alertTypography.value = visual.typography;
  const themeAccent = !visual.accent || visual.accent === "theme";
  alertAccentTheme.checked = themeAccent;
  alertAccent.disabled = themeAccent;
  if (!themeAccent) {
    alertAccent.value = visual.accent;
  }
  const mediaOptions = [
    ["", "No extra media"],
    ...status.customGifs.map((gif) => [gif.url, gif.label] as const)
  ];
  if (visual.mediaUrl && !mediaOptions.some(([url]) => url === visual.mediaUrl)) {
    mediaOptions.push([visual.mediaUrl, "Current media"]);
  }
  alertMedia.replaceChildren(...mediaOptions.map(([url, label]) => {
    const option = document.createElement("option");
    option.value = url;
    option.textContent = label;
    return option;
  }));
  alertMedia.value = visual.mediaUrl ?? "";
  syncingAlertStudio = false;
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
    sakura_festival: "Sakura Festival",
    neon_museum: "Neon Museum",
    chrome_showroom: "Chrome Showroom",
    prism_arcade: "Prism Arcade",
    velvet_casino: "Velvet Casino",
    alpine_lodge: "Alpine Lodge",
    circuit_garden: "Circuit Garden",
    gemstone_gallery: "Gemstone Gallery",
    sunset_boardwalk: "Sunset Boardwalk",
    midnight_observatory: "Midnight Observatory",
    tea_house: "Tea House",
    game_tower_tresses: "Tower Tresses",
    game_starship_rally: "Starship Rally",
    game_moon_garden: "Moon Garden",
    game_crystal_quest: "Crystal Quest",
    game_neon_grand_prix: "Neon Grand Prix"
  };
  return names[skin];
}

function renderGameThemeStatus(game: GameThemeProgress | undefined): void {
  gameThemeControls.hidden = !game;
  if (!game) {
    return;
  }
  const names: Record<GameThemeId, string> = {
    game_tower_tresses: "Tower Tresses",
    game_starship_rally: "Starship Rally",
    game_moon_garden: "Moon Garden",
    game_crystal_quest: "Crystal Quest",
    game_neon_grand_prix: "Neon Grand Prix"
  };
  const objectives: Record<GameThemeId, string> = {
    game_tower_tresses: "Each level, grow the braid to the courtyard so the prince can climb it and rescue her. Tower 1 takes one bid.",
    game_starship_rally: "Fuel the ship along the bottom lane and jump to the next orbit. Orbit 1 takes one bid.",
    game_moon_garden: "Grow the planter and border vines. Moon 1 takes one bid.",
    game_crystal_quest: "Fill the mine cart and open the chamber. Depth 1 takes one bid.",
    game_neon_grand_prix: "Race the circuit to the finish gantry. Lap 1 takes one bid."
  };
  const maxLevel = 100;
  const percent = Math.min(100, Math.round((game.progress / Math.max(1, game.target)) * 100));
  gameThemeName.textContent = names[game.theme];
  gameThemeLevel.textContent = `Level ${game.level} of ${maxLevel}`;
  gameThemeObjective.textContent = objectives[game.theme];
  gameThemeProgress.style.width = `${percent}%`;
  gameThemeProgress.parentElement?.setAttribute("aria-valuenow", String(percent));
  gameThemePoints.textContent = `${Math.round(game.progress)} / ${game.target} points`;
  gameThemeWins.textContent = `${game.wins} ${game.wins === 1 ? "win" : "wins"}`;
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

  for (const title of addonThemeTitles) {
    title.hidden = !addOns.includes("stream_skins");
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
    value === "sakura_festival" ||
    value === "neon_museum" ||
    value === "chrome_showroom" ||
    value === "prism_arcade" ||
    value === "velvet_casino" ||
    value === "alpine_lodge" ||
    value === "circuit_garden" ||
    value === "gemstone_gallery" ||
    value === "sunset_boardwalk" ||
    value === "midnight_observatory" ||
    value === "tea_house" ||
    value === "game_tower_tresses" ||
    value === "game_starship_rally" ||
    value === "game_moon_garden" ||
    value === "game_crystal_quest" ||
    value === "game_neon_grand_prix"
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

function renderShowProfiles(status: DesktopStatus): void {
  const profiles = status.showProfiles ?? [];
  const notice = status.showNotice ?? "";
  showSessionNotice.hidden = !notice;
  showSessionNotice.textContent = notice;
  showProfileNotice.hidden = !notice;
  showProfileNotice.textContent = notice;
  showProfilesStatus.textContent = profiles.length === 0
    ? "No saved looks"
    : `${profiles.length} saved look${profiles.length === 1 ? "" : "s"}`;
  showProfileEmpty.hidden = profiles.length > 0;
  if (!selectedShowProfileId || !profiles.some((profile) => profile.id === selectedShowProfileId)) {
    selectedShowProfileId = status.activeShowProfileId || profiles[0]?.id || "";
  }
  if (status.activeShowProfileId && !showProfileName.value) {
    const active = profiles.find((profile) => profile.id === status.activeShowProfileId);
    if (active) {
      showProfileName.value = active.name;
    }
  }
  showProfileList.replaceChildren();
  for (const profile of profiles) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "show-profile-row";
    row.dataset.showProfileId = profile.id;
    row.classList.toggle("is-active", profile.id === selectedShowProfileId);
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(profile.id === selectedShowProfileId));
    const title = document.createElement("strong");
    title.textContent = profile.name;
    const meta = document.createElement("span");
    meta.textContent = new Date(profile.updatedAt).toLocaleString();
    row.append(title, meta);
    showProfileList.append(row);
  }
}

function renderPacks(status: DesktopStatus): void {
  const packs = status.packs ?? [];
  packsStatus.textContent = `${packs.length} Installed`;
  packNotice.hidden = !status.packNotice;
  packNotice.textContent = status.packNotice ?? "";
  undoPack.hidden = !status.packUndoAvailable;
  packEmpty.hidden = packs.length > 0 || Boolean(status.pendingPack);

  const pending = status.pendingPack;
  packReview.hidden = !pending;
  if (pending) {
    packReviewTitle.textContent = pending.name;
    packReviewMeta.textContent = `${pending.author} · ${pending.packVersion} · ${pending.license}`;
    packReviewPreview.hidden = !pending.previewDataUrl;
    packReviewPreview.src = pending.previewDataUrl ?? "";
    packReviewChanges.replaceChildren();
    for (const change of pending.review) {
      const item = document.createElement("li");
      item.textContent = `${change.label}: ${change.detail}`;
      packReviewChanges.append(item);
    }
    if (pending.review.length === 0) {
      const item = document.createElement("li");
      item.textContent = "Preview and media only. Overlay settings stay as they are until you apply this pack.";
      packReviewChanges.append(item);
    }
  }

  packGrid.replaceChildren();
  for (const pack of packs) {
    const card = document.createElement("article");
    card.className = "pack-card";
    if (pack.previewUrl) {
      const preview = document.createElement("img");
      preview.src = pack.previewUrl;
      preview.alt = "";
      card.append(preview);
    }
    const title = document.createElement("h3");
    title.textContent = pack.name;
    const meta = document.createElement("p");
    meta.className = "pack-meta";
    meta.textContent = `${pack.author} · ${pack.packVersion} · ${pack.license}`;
    const description = document.createElement("p");
    description.textContent = pack.description || "No description.";
    const actions = document.createElement("div");
    actions.className = "pack-card-actions";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "module-command";
    apply.textContent = "Apply";
    apply.addEventListener("click", () => {
      void window.duckDesk.applyPack(pack.id).then(renderStatus);
    });
    const exportPack = document.createElement("button");
    exportPack.type = "button";
    exportPack.textContent = "Export";
    exportPack.addEventListener("click", () => {
      void window.duckDesk.exportPack(pack.id).then(renderStatus);
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      void window.duckDesk.removePack(pack.id).then(renderStatus);
    });
    actions.append(apply, exportPack, remove);
    card.append(title, meta, description, actions);
    packGrid.append(card);
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

function rehearsalElements<T extends HTMLElement>(id: string): T[] {
  return Array.from(document.querySelectorAll<T>(`#${id}, [data-mirror="${id}"]`));
}

function rehearsalCommandButtons(command: string): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-rehearsal-command="${command}"]`));
}

function rehearsalNameInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("#rehearsal-recording-name, [data-mirror='rehearsal-recording-name']"));
}

function rehearsalRecordingNameValue(): string {
  const focused = document.activeElement;
  if (focused instanceof HTMLInputElement && rehearsalNameInputs().includes(focused)) {
    return focused.value;
  }
  return rehearsalRecordingName.value;
}
