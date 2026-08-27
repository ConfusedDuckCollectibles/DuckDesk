import { isAlertVisualMap, type AlertVisualMap } from "./alerts.js";

export interface SaleEvent {
  type: "sale";
  buyer: string;
  amount: number;
  item?: string;
  timestamp: number;
}

export interface BidEvent {
  type: "bid";
  bidder: string;
  amount: number;
  item?: string;
  timestamp: number;
}

export interface AudienceActionEvent {
  type: "audience_action";
  actor: string;
  action: "follow" | "bookmark" | "chat" | "reaction";
  message?: string;
  timestamp: number;
}

export interface TipEvent {
  type: "tip";
  tipper: string;
  amount: number;
  message?: string;
  timestamp: number;
}

export interface ShareEvent {
  type: "share";
  actor?: string;
  shareCount?: number;
  delta?: number;
  timestamp: number;
}

export type OverlayTheme = "neon" | "arena" | "duck";
export type OverlaySkin =
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
export type GifPlacement = "center" | "top" | "bottom" | "left" | "right";
export type GifSize = "small" | "medium" | "large";
export type SoundKind = "sale" | "bid" | "action" | "tip" | "share";
export {
  AUDIO_PLAYBACK_POLICY,
  AudioPlaybackScheduler,
  bundledAudioFileName,
  isAudioPlaybackEnabled,
  normalizeAudioVolume,
  selectAudioCueSource,
  type AudioPlaybackDecision,
  type AudioPlaybackKind
} from "./audio.js";
export {
  ALERT_DURATION_LIMITS,
  ALERT_KINDS,
  DEFAULT_ALERT_VISUALS,
  alertKindFromEventType,
  defaultAlertVisual,
  isAlertEntrance,
  isAlertKind,
  isAlertPlacement,
  isAlertSize,
  isAlertTypography,
  normalizeAlertVisual,
  normalizeAlertVisualMap,
  patchAlertVisual,
  sanitizeAlertMediaUrl,
  usesThemeAlertArt,
  type AlertEntrance,
  type AlertKind,
  type AlertPlacement,
  type AlertSize,
  type AlertTypography,
  type AlertVisualConfig
} from "./alerts.js";
export { isAlertVisualMap, type AlertVisualMap };
export type AudioTheme =
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
export type SceneMode = "none" | "starting" | "auction" | "break" | "winner" | "ending";
export type GoalKind = "sales" | "orders" | "hype" | "follows";
export interface GoalConfig {
  kind: GoalKind;
  target: number;
  label: string;
}
export type AddOnId =
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

export interface OverlayConfigMessage {
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
  hideTopBanner?: boolean;
  themeEffectsEnabled?: boolean;
  alertVisuals?: AlertVisualMap;
  framePreset?: "theme" | "broadcast" | "none";
  reducedMotion?: boolean;
  timestamp: number;
}

export interface ConnectedMessage {
  type: "connected";
  timestamp: number;
}

export interface OverlayClearMessage {
  type: "overlay_clear";
  timestamp: number;
}

export interface OverlayGifTriggerMessage {
  type: "gif_trigger";
  url: string;
  timestamp: number;
}

export interface OverlaySoundTriggerMessage {
  type: "sound_trigger";
  kind: SoundKind;
  timestamp: number;
}

export interface OverlayBurstTriggerMessage {
  type: "burst_trigger";
  timestamp: number;
}

export interface OverlayMilestoneTriggerMessage {
  type: "milestone_trigger";
  amount: number;
  label: string;
  timestamp: number;
}

export interface OverlayHypeMeterTriggerMessage {
  type: "hype_meter_trigger";
  durationSeconds: number;
  timestamp: number;
}

export interface OverlayAuctionTimerTriggerMessage {
  type: "auction_timer_trigger";
  durationSeconds: number;
  timestamp: number;
}

export interface OverlayRecapTriggerMessage {
  type: "recap_trigger";
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  timestamp: number;
}

export type ShowEvent = SaleEvent | BidEvent | AudienceActionEvent | TipEvent | ShareEvent;
export type BridgeMessage =
  | ShowEvent
  | OverlayConfigMessage
  | ConnectedMessage
  | OverlayClearMessage
  | OverlayGifTriggerMessage
  | OverlaySoundTriggerMessage
  | OverlayBurstTriggerMessage
  | OverlayMilestoneTriggerMessage
  | OverlayHypeMeterTriggerMessage
  | OverlayAuctionTimerTriggerMessage
  | OverlayRecapTriggerMessage;

export function normalizeShowEvent(input: unknown): ShowEvent {
  if (!isRecord(input)) {
    throw new Error("Event body must be an object.");
  }

  if (input.type === "sale") {
    return normalizeSaleEvent(input);
  }

  if (input.type === "bid") {
    return normalizeBidEvent(input);
  }

  if (input.type === "audience_action") {
    return normalizeAudienceActionEvent(input);
  }

  if (input.type === "tip") {
    return normalizeTipEvent(input);
  }

  if (input.type === "share") {
    return normalizeShareEvent(input);
  }

  throw new Error("Unsupported event type.");
}

export function normalizeSaleEvent(input: unknown): SaleEvent {
  if (!isRecord(input) || input.type !== "sale") {
    throw new Error("Event must be a sale.");
  }

  const buyer = readString(input.buyer, "buyer");
  const amount = readAmount(input.amount);
  const timestamp = readTimestamp(input.timestamp);
  const item = typeof input.item === "string" && input.item.trim().length > 0
    ? input.item.trim()
    : undefined;

  return {
    type: "sale",
    buyer,
    amount,
    item,
    timestamp
  };
}

export function isShowEvent(value: unknown): value is ShowEvent {
  try {
    normalizeShowEvent(value);
    return true;
  } catch {
    return false;
  }
}

export function isOverlayConfigMessage(value: unknown): value is OverlayConfigMessage {
  return (
    isRecord(value) &&
    value.type === "overlay_config" &&
    isOverlayTheme(value.theme) &&
    isOverlaySkin(value.skin) &&
    Array.isArray(value.addOns) &&
    value.addOns.every(isAddOnId) &&
    typeof value.soundsEnabled === "boolean" &&
    typeof value.soundVolume === "number" &&
    Number.isFinite(value.soundVolume) &&
    value.soundVolume >= 0 &&
    value.soundVolume <= 1 &&
    isAudioTheme(value.audioTheme) &&
    isCustomSoundUrls(value.customSoundUrls) &&
    typeof value.streamTitle === "string" &&
    Array.isArray(value.customGifUrls) &&
    value.customGifUrls.every((url) => typeof url === "string") &&
    isGifPlacement(value.gifPlacement) &&
    isGifSize(value.gifSize) &&
    Array.isArray(value.milestoneThresholds) &&
    value.milestoneThresholds.every((amount) => typeof amount === "number" && Number.isFinite(amount)) &&
    typeof value.hypeMeterSeconds === "number" &&
    typeof value.jumbotronCameraEnabled === "boolean" &&
    Array.isArray(value.promoBanners) &&
    value.promoBanners.every((banner) => typeof banner === "string") &&
    isSceneMode(value.sceneMode) &&
    Array.isArray(value.goals) &&
    value.goals.every(isGoalConfig) &&
    typeof value.auctionTimerSeconds === "number" &&
    Number.isFinite(value.auctionTimerSeconds) &&
    (!("hideTopBanner" in value) || typeof value.hideTopBanner === "boolean") &&
    (!("themeEffectsEnabled" in value) || typeof value.themeEffectsEnabled === "boolean") &&
    (!("alertVisuals" in value) || isAlertVisualMap(value.alertVisuals)) &&
    (!("framePreset" in value) || value.framePreset === "theme" || value.framePreset === "broadcast" || value.framePreset === "none") &&
    (!("reducedMotion" in value) || typeof value.reducedMotion === "boolean")
  );
}

export function isOverlayTheme(value: unknown): value is OverlayTheme {
  return value === "neon" || value === "arena" || value === "duck";
}

export function isOverlayClearMessage(value: unknown): value is OverlayClearMessage {
  return isRecord(value) && value.type === "overlay_clear";
}

export function isOverlayGifTriggerMessage(value: unknown): value is OverlayGifTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "gif_trigger" &&
    typeof value.url === "string" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlaySoundTriggerMessage(value: unknown): value is OverlaySoundTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "sound_trigger" &&
    isSoundKind(value.kind) &&
    typeof value.timestamp === "number"
  );
}

export function isOverlayBurstTriggerMessage(value: unknown): value is OverlayBurstTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "burst_trigger" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlayMilestoneTriggerMessage(value: unknown): value is OverlayMilestoneTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "milestone_trigger" &&
    typeof value.amount === "number" &&
    typeof value.label === "string" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlayHypeMeterTriggerMessage(value: unknown): value is OverlayHypeMeterTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "hype_meter_trigger" &&
    typeof value.durationSeconds === "number" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlayAuctionTimerTriggerMessage(value: unknown): value is OverlayAuctionTimerTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "auction_timer_trigger" &&
    typeof value.durationSeconds === "number" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlayRecapTriggerMessage(value: unknown): value is OverlayRecapTriggerMessage {
  return (
    isRecord(value) &&
    value.type === "recap_trigger" &&
    typeof value.salesCount === "number" &&
    typeof value.grossSales === "number" &&
    typeof value.bidCount === "number" &&
    typeof value.audienceActions === "number" &&
    typeof value.timestamp === "number"
  );
}

export function isOverlaySkin(value: unknown): value is OverlaySkin {
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

export function isGifPlacement(value: unknown): value is GifPlacement {
  return value === "center" || value === "top" || value === "bottom" || value === "left" || value === "right";
}

export function isGifSize(value: unknown): value is GifSize {
  return value === "small" || value === "medium" || value === "large";
}

export function isSoundKind(value: unknown): value is SoundKind {
  return value === "sale" || value === "bid" || value === "action" || value === "tip" || value === "share";
}

export function isAudioTheme(value: unknown): value is AudioTheme {
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

function isCustomSoundUrls(value: unknown): value is Partial<Record<SoundKind, string>> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([kind, url]) => isSoundKind(kind) && typeof url === "string");
}

export function isSceneMode(value: unknown): value is SceneMode {
  return (
    value === "none" ||
    value === "starting" ||
    value === "auction" ||
    value === "break" ||
    value === "winner" ||
    value === "ending"
  );
}

export function isGoalKind(value: unknown): value is GoalKind {
  return value === "sales" || value === "orders" || value === "hype" || value === "follows";
}

export function isGoalConfig(value: unknown): value is GoalConfig {
  return (
    isRecord(value) &&
    isGoalKind(value.kind) &&
    typeof value.target === "number" &&
    Number.isFinite(value.target) &&
    value.target > 0 &&
    typeof value.label === "string"
  );
}

export function isAddOnId(value: unknown): value is AddOnId {
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

function normalizeBidEvent(input: Record<string, unknown>): BidEvent {
  const bidder = readString(input.bidder, "bidder");
  const amount = readAmount(input.amount);
  const timestamp = readTimestamp(input.timestamp);
  const item = typeof input.item === "string" && input.item.trim().length > 0
    ? input.item.trim()
    : undefined;

  return {
    type: "bid",
    bidder,
    amount,
    item,
    timestamp
  };
}

function normalizeAudienceActionEvent(input: Record<string, unknown>): AudienceActionEvent {
  const actor = readString(input.actor, "actor");
  const action = readAudienceAction(input.action);
  const timestamp = readTimestamp(input.timestamp);
  const message = typeof input.message === "string" && input.message.trim().length > 0
    ? input.message.trim()
    : undefined;

  return {
    type: "audience_action",
    actor,
    action,
    message,
    timestamp
  };
}

function normalizeTipEvent(input: Record<string, unknown>): TipEvent {
  const tipper = readString(input.tipper, "tipper");
  const amount = readAmount(input.amount);
  const timestamp = readTimestamp(input.timestamp);
  const message = readOptionalString(input.message);

  return {
    type: "tip",
    tipper,
    amount,
    message,
    timestamp
  };
}

function normalizeShareEvent(input: Record<string, unknown>): ShareEvent {
  const actor = readOptionalString(input.actor)?.replace(/^@/, "");
  const shareCount = readOptionalWholeNumber(input.shareCount, "shareCount", true);
  const delta = readOptionalWholeNumber(input.delta, "delta", false);
  if (!actor && shareCount === undefined && delta === undefined) {
    throw new Error('A share event must include "actor", "shareCount", or "delta".');
  }

  return {
    type: "share",
    actor,
    shareCount,
    delta,
    timestamp: readTimestamp(input.timestamp)
  };
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, 160)
    : undefined;
}

function readOptionalWholeNumber(value: unknown, field: string, allowZero: boolean): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    (allowZero ? value < 0 : value <= 0)
  ) {
    throw new Error(`Event field "${field}" must be a positive whole number.`);
  }

  return value;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Event field "${field}" must be a non-empty string.`);
  }

  return value.trim().replace(/^@/, "");
}

function readAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const amount = Number(value.replace(/[$,]/g, ""));
    if (Number.isFinite(amount)) {
      return amount;
    }
  }

  throw new Error('Event field "amount" must be a number.');
}

function readTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}

function readAudienceAction(value: unknown): AudienceActionEvent["action"] {
  if (value === "follow" || value === "bookmark" || value === "chat" || value === "reaction") {
    return value;
  }

  throw new Error('Event field "action" must be follow, bookmark, chat, or reaction.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
