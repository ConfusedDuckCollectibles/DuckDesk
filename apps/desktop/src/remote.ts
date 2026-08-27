import { randomBytes, timingSafeEqual } from "node:crypto";
import os from "node:os";
import {
  isSceneMode,
  isSoundKind,
  type SceneMode,
  type SoundKind
} from "@duck-desk/shared";

const remoteClientTtlMs = 15_000;
const actionWindowMs = 2_000;
const maxActionsPerWindow = 12;

export type RemoteAction =
  | { type: "clear" }
  | { type: "set_scene"; scene: SceneMode }
  | { type: "set_banner"; visible: boolean }
  | { type: "set_effects"; enabled: boolean }
  | { type: "trigger_sound"; kind: SoundKind }
  | { type: "trigger_gif"; id: string }
  | { type: "trigger_burst" }
  | { type: "trigger_hype" }
  | { type: "trigger_timer" }
  | { type: "trigger_recap" };

export interface RemoteConnectionInfo {
  available: boolean;
  address?: string;
  url?: string;
  pairingCode: string;
}

export class RemotePairingSession {
  private token = "";
  private pairingCode = "";
  private readonly clientActivity = new Map<string, number>();
  private readonly actionActivity = new Map<string, number[]>();

  constructor(private readonly port: number) {
    this.rotate();
  }

  rotate(): void {
    this.token = randomBytes(24).toString("base64url");
    this.pairingCode = randomBytes(3).toString("hex").toUpperCase();
    this.clientActivity.clear();
    this.actionActivity.clear();
  }

  getConnectionInfo(address = findPrivateLanAddress()): RemoteConnectionInfo {
    return {
      available: Boolean(address),
      address,
      url: address ? `http://${address}:${this.port}/remote?token=${encodeURIComponent(this.token)}` : undefined,
      pairingCode: this.pairingCode
    };
  }

  authorize(candidate: unknown, remoteAddress: string | undefined): boolean {
    if (typeof candidate !== "string" || !isPrivateNetworkAddress(remoteAddress)) {
      return false;
    }
    const expected = Buffer.from(this.token);
    const received = Buffer.from(candidate);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  touchClient(candidate: unknown, now = Date.now()): string | null {
    if (typeof candidate !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(candidate)) {
      return null;
    }
    this.prune(now);
    this.clientActivity.set(candidate, now);
    return candidate;
  }

  allowAction(clientId: string, now = Date.now()): boolean {
    this.prune(now);
    const recent = (this.actionActivity.get(clientId) ?? []).filter((timestamp) => now - timestamp < actionWindowMs);
    if (recent.length >= maxActionsPerWindow) {
      this.actionActivity.set(clientId, recent);
      return false;
    }
    recent.push(now);
    this.actionActivity.set(clientId, recent);
    this.clientActivity.set(clientId, now);
    return true;
  }

  activeClientCount(now = Date.now()): number {
    this.prune(now);
    return this.clientActivity.size;
  }

  lastSeenAt(): number | undefined {
    const values = [...this.clientActivity.values()];
    return values.length > 0 ? Math.max(...values) : undefined;
  }

  private prune(now: number): void {
    for (const [clientId, timestamp] of this.clientActivity) {
      if (now - timestamp >= remoteClientTtlMs) {
        this.clientActivity.delete(clientId);
        this.actionActivity.delete(clientId);
      }
    }
  }
}

export function normalizeRemoteAction(input: unknown): RemoteAction | null {
  if (!isRecord(input) || typeof input.type !== "string") {
    return null;
  }
  if (input.type === "clear" || input.type === "trigger_burst" || input.type === "trigger_hype"
    || input.type === "trigger_timer" || input.type === "trigger_recap") {
    return { type: input.type };
  }
  if (input.type === "set_scene" && isSceneMode(input.scene)) {
    return { type: "set_scene", scene: input.scene };
  }
  if (input.type === "set_banner" && typeof input.visible === "boolean") {
    return { type: "set_banner", visible: input.visible };
  }
  if (input.type === "set_effects" && typeof input.enabled === "boolean") {
    return { type: "set_effects", enabled: input.enabled };
  }
  if (input.type === "trigger_sound" && isSoundKind(input.kind)) {
    return { type: "trigger_sound", kind: input.kind };
  }
  if (input.type === "trigger_gif" && typeof input.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(input.id)) {
    return { type: "trigger_gif", id: input.id };
  }
  return null;
}

export function isPrivateNetworkAddress(address: string | undefined): boolean {
  if (!address) {
    return false;
  }
  const normalized = address.startsWith("::ffff:") ? address.slice(7) : address;
  if (normalized === "::1" || normalized === "127.0.0.1" || normalized.startsWith("127.")) {
    return true;
  }
  if (normalized.startsWith("10.") || normalized.startsWith("192.168.")) {
    return true;
  }
  const match = /^172\.(\d{1,3})\./.exec(normalized);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  const ipv6 = normalized.toLowerCase();
  return ipv6.startsWith("fc") || ipv6.startsWith("fd") || ipv6.startsWith("fe80:");
}

export function findPrivateLanAddress(): string | undefined {
  const candidates: Array<{ address: string; score: number }> = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.internal || entry.family !== "IPv4" || !isPrivateNetworkAddress(entry.address)) {
        continue;
      }
      const preferredInterface = /^(en|eth|wi-?fi)/i.test(name) ? 10 : 0;
      const preferredRange = entry.address.startsWith("192.168.") ? 3 : entry.address.startsWith("10.") ? 2 : 1;
      candidates.push({ address: entry.address, score: preferredInterface + preferredRange });
    }
  }
  return candidates.sort((left, right) => right.score - left.score)[0]?.address;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
