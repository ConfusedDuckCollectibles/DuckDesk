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
export type OverlaySkin = "none" | "cyber_market" | "arcade_drop" | "sports_desk";
export type AddOnId =
  | "stream_skins"
  | "noise_machines"
  | "bid_ladder"
  | "hype_bursts"
  | "leaderboard_deck"
  | "gif_reactions";

export interface OverlayConfigMessage {
  type: "overlay_config";
  theme: OverlayTheme;
  skin: OverlaySkin;
  addOns: AddOnId[];
  soundsEnabled: boolean;
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

export type ShowEvent = SaleEvent | BidEvent | AudienceActionEvent;
export type BridgeMessage = ShowEvent | OverlayConfigMessage | ConnectedMessage | OverlayClearMessage;

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
    typeof value.soundsEnabled === "boolean"
  );
}

export function isOverlayTheme(value: unknown): value is OverlayTheme {
  return value === "neon" || value === "arena" || value === "duck";
}

export function isOverlayClearMessage(value: unknown): value is OverlayClearMessage {
  return isRecord(value) && value.type === "overlay_clear";
}

export function isOverlaySkin(value: unknown): value is OverlaySkin {
  return value === "none" || value === "cyber_market" || value === "arcade_drop" || value === "sports_desk";
}

export function isAddOnId(value: unknown): value is AddOnId {
  return (
    value === "stream_skins" ||
    value === "noise_machines" ||
    value === "bid_ladder" ||
    value === "hype_bursts" ||
    value === "leaderboard_deck" ||
    value === "gif_reactions"
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
