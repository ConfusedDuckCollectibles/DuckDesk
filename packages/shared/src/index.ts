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
  | "luxury_nightclub";
export type GifPlacement = "center" | "top" | "bottom" | "left" | "right";
export type GifSize = "small" | "medium" | "large";
export type SoundKind = "sale" | "bid" | "action";
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

export type ShowEvent = SaleEvent | BidEvent | AudienceActionEvent;
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
    Number.isFinite(value.auctionTimerSeconds)
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
    value === "luxury_nightclub"
  );
}

export function isGifPlacement(value: unknown): value is GifPlacement {
  return value === "center" || value === "top" || value === "bottom" || value === "left" || value === "right";
}

export function isGifSize(value: unknown): value is GifSize {
  return value === "small" || value === "medium" || value === "large";
}

export function isSoundKind(value: unknown): value is SoundKind {
  return value === "sale" || value === "bid" || value === "action";
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
