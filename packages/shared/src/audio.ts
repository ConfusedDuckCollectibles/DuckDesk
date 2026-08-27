export type AudioPlaybackKind = "sale" | "bid" | "action" | "tip" | "share";

export const AUDIO_PLAYBACK_POLICY = {
  sale: { priority: 5, cooldownMs: 0, durationMs: 840, variants: 1, protected: true },
  tip: { priority: 4, cooldownMs: 0, durationMs: 580, variants: 1, protected: true },
  share: { priority: 3, cooldownMs: 1000, durationMs: 360, variants: 1, protected: false },
  bid: { priority: 2, cooldownMs: 250, durationMs: 170, variants: 3, protected: false },
  action: { priority: 1, cooldownMs: 600, durationMs: 240, variants: 3, protected: false }
} as const satisfies Record<AudioPlaybackKind, {
  priority: number;
  cooldownMs: number;
  durationMs: number;
  variants: number;
  protected: boolean;
}>;

export type AudioPlaybackDecision =
  | { action: "play"; variant: number; interrupt: boolean }
  | { action: "queue"; variant: number; delayMs: number }
  | { action: "drop"; reason: "cooldown" | "protected" | "priority" };

export class AudioPlaybackScheduler {
  private activeKind: AudioPlaybackKind | null = null;
  private activeUntil = 0;
  private readonly lastPlayedAt = new Map<AudioPlaybackKind, number>();
  private readonly lastVariant = new Map<AudioPlaybackKind, number>();
  private sequence = 0;

  request(kind: AudioPlaybackKind, now = Date.now(), eventKey: string | number = this.sequence++): AudioPlaybackDecision {
    const cue = AUDIO_PLAYBACK_POLICY[kind];
    const previousAt = this.lastPlayedAt.get(kind);
    if (!cue.protected && previousAt !== undefined && now - previousAt < cue.cooldownMs) {
      return { action: "drop", reason: "cooldown" };
    }

    const variant = this.selectVariant(kind, eventKey);
    const active = this.activeKind ? AUDIO_PLAYBACK_POLICY[this.activeKind] : null;
    const activeIsCurrent = active !== null && now < this.activeUntil;

    if (activeIsCurrent && active.protected) {
      if (!cue.protected) return { action: "drop", reason: "protected" };
      const delayMs = Math.max(0, this.activeUntil - now);
      this.activeUntil += cue.durationMs;
      this.activeKind = kind;
      this.lastPlayedAt.set(kind, now + delayMs);
      this.lastVariant.set(kind, variant);
      return { action: "queue", variant, delayMs };
    }

    if (activeIsCurrent && active.priority > cue.priority) {
      return { action: "drop", reason: "priority" };
    }

    const interrupt = activeIsCurrent;
    this.activeKind = kind;
    this.activeUntil = now + cue.durationMs;
    this.lastPlayedAt.set(kind, now);
    this.lastVariant.set(kind, variant);
    return { action: "play", variant, interrupt };
  }

  reset(): void {
    this.activeKind = null;
    this.activeUntil = 0;
    this.lastPlayedAt.clear();
    this.lastVariant.clear();
    this.sequence = 0;
  }

  private selectVariant(kind: AudioPlaybackKind, eventKey: string | number): number {
    const count = AUDIO_PLAYBACK_POLICY[kind].variants;
    if (count === 1) return 1;
    let selected = hash(`${kind}:${eventKey}`) % count + 1;
    if (selected === this.lastVariant.get(kind)) selected = selected % count + 1;
    return selected;
  }
}

export function bundledAudioFileName(kind: AudioPlaybackKind, variant: number): string {
  return variant <= 1 ? `${kind}.wav` : `${kind}-${String(variant).padStart(2, "0")}.wav`;
}

export function selectAudioCueSource(kind: AudioPlaybackKind, variant: number, customSource?: string): string {
  return customSource || bundledAudioFileName(kind, variant);
}

export function normalizeAudioVolume(volume: number): number {
  return Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
}

export function isAudioPlaybackEnabled(enabled: boolean, volume: number): boolean {
  return enabled && normalizeAudioVolume(volume) > 0;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
