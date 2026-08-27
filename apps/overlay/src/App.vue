<script setup lang="ts">
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource-variable/manrope/wght.css";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  AudioPlaybackScheduler,
  selectAudioCueSource,
  isOverlayConfigMessage,
  isOverlayClearMessage,
  isOverlayAuctionTimerTriggerMessage,
  isOverlayBurstTriggerMessage,
  isOverlayGifTriggerMessage,
  isOverlayHypeMeterTriggerMessage,
  isOverlayMilestoneTriggerMessage,
  isOverlayRecapTriggerMessage,
  isOverlaySoundTriggerMessage,
  isShowEvent,
  type AddOnId,
  type AudioTheme,
  type BridgeMessage,
  type GifPlacement,
  type GifSize,
  type GoalConfig,
  type OverlaySkin,
  type SceneMode,
  type OverlayTheme,
  type ShowEvent,
  type SoundKind,
  isOverlaySkin
} from "@duck-desk/shared";
import BroadcastFrame from "./components/BroadcastFrame.vue";
import ThemeArt from "./components/ThemeArt.vue";
import EventAlert from "./components/EventAlert.vue";

const queue = ref<ShowEvent[]>([]);
const activeEvent = ref<ShowEvent | null>(null);
const recentEvents = ref<ShowEvent[]>([]);
const activityEvents = ref<ShowEvent[]>([]);
const connected = ref(false);
const reconnecting = ref(false);
const theme = ref<OverlayTheme>("neon");
const skin = ref<OverlaySkin>((() => {
  const value = new URLSearchParams(window.location.search).get("skin");
  return isOverlaySkin(value) ? value : "none";
})());
const activeAddOns = ref<AddOnId[]>([]);
const soundsEnabled = ref(true);
const soundVolume = ref(0.75);
const audioTheme = ref<AudioTheme>("neon_pulse");
const customSoundUrls = ref<Partial<Record<SoundKind, string>>>({});
const streamTitle = ref("");
const customGifUrls = ref<string[]>([]);
const gifPlacement = ref<GifPlacement>("center");
const gifSize = ref<GifSize>("medium");
const milestoneThresholds = ref<number[]>([]);
const hypeMeterSeconds = ref(30);
const jumbotronCameraEnabled = ref(false);
const promoBanners = ref<string[]>([]);
const sceneMode = ref<SceneMode>("none");
const goals = ref<GoalConfig[]>([]);
const auctionTimerSeconds = ref(45);
const hideTopBanner = ref(false);
const themeEffectsEnabled = ref(true);
const promoIndex = ref(0);
const milestoneCard = ref<{ amount: number; label: string; timestamp: number } | null>(null);
const hypeMeter = ref<{ startedAt: number; durationSeconds: number; participants: Set<string> } | null>(null);
const auctionTimer = ref<{ startedAt: number; durationSeconds: number } | null>(null);
const recapCard = ref<{
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  timestamp: number;
} | null>(null);
const manualGifUrl = ref("");
const manualGifTimestamp = ref(0);
const cameraVideo = ref<HTMLVideoElement | null>(null);
const buyerTotals = ref<Record<string, number>>({});
const grossSales = ref(0);
const orderCount = ref(0);
const followCount = ref(0);
const burstKey = ref(0);
const statusLabel = computed(() => (connected.value ? "live" : "offline"));
const latestBid = computed(() => recentEvents.value.find((event) => event.type === "bid"));
const latestEventType = computed(() => recentEvents.value[0]?.type ?? "idle");
const latestEventLabel = computed(() => {
  if (latestEventType.value === "sale") {
    return "SOLD";
  }
  if (latestEventType.value === "bid") {
    return "BID";
  }
  if (latestEventType.value === "tip") {
    return "TIP";
  }
  if (latestEventType.value === "share") {
    return "SHARE";
  }
  return "CHAT";
});
const jumbotronLabel = computed(() => recentEvents.value[0]?.type.toUpperCase() ?? "ROOM READY");
const tickerTape = computed(() => [...recentEvents.value, ...recentEvents.value]);
const displayedGif = computed(() => manualGifUrl.value);
const activePromo = computed(() => promoBanners.value[promoIndex.value % Math.max(1, promoBanners.value.length)] ?? "");
const hypeRemaining = ref(0);
const auctionRemaining = ref(0);
const premiumSkins: ReadonlySet<OverlaySkin> = new Set([
  "storm_front",
  "cyber_duck_city",
  "treasure_vault",
  "boss_battle",
  "cosmic_auction",
  "haunted_drop",
  "sports_broadcast",
  "anime_powerup",
  "candy_rush",
  "luxury_nightclub",
  "inferno_ring",
  "deep_reef",
  "zen_garden",
  "vinyl_lounge",
  "blueprint_draft",
  "aurora_peaks",
  "solar_flare",
  "glacier_cavern",
  "noir_detective",
  "retro_spaceport",
  "royal_tournament",
  "desert_mirage",
  "enchanted_forest",
  "steampunk_foundry",
  "hologram_lab",
  "stained_glass",
  "paper_theater",
  "midnight_library",
  "carnival_nights",
  "moonlit_tide",
  "koi_pond",
  "crystal_cavern",
  "racing_grid",
  "wild_west",
  "celestial_clockwork",
  "sakura_festival"
]);
const premiumSkinActive = computed(() => premiumSkins.has(skin.value));
const hypeProgress = computed(() => {
  if (!hypeMeter.value) {
    return 0;
  }
  const participantScore = Math.min(70, hypeMeter.value.participants.size * 14);
  const timeScore = Math.min(30, ((hypeMeter.value.durationSeconds - hypeRemaining.value) / hypeMeter.value.durationSeconds) * 30);
  return Math.min(100, Math.round(participantScore + timeScore));
});
const auctionProgress = computed(() => {
  if (!auctionTimer.value) {
    return 0;
  }
  const elapsed = auctionTimer.value.durationSeconds - auctionRemaining.value;
  return Math.min(100, Math.round((elapsed / auctionTimer.value.durationSeconds) * 100));
});
const gifPositionClass = computed(() => `gif-position-${gifPlacement.value}`);
const gifSizeClass = computed(() => `gif-size-${gifSize.value}`);
const hypeScore = computed(() => recentEvents.value.length === 0 ? 0 : Math.min(99, recentEvents.value.length * 18));
const activeGoals = computed(() => goals.value.slice(0, 4).map((goal) => ({
  ...goal,
  current: readGoalCurrent(goal),
  progress: Math.min(100, Math.round((readGoalCurrent(goal) / goal.target) * 100))
})));
const sceneContent = computed(() => {
  if (sceneMode.value === "starting") {
    return { eyebrow: "Starting Soon", title: "Show starts soon", detail: "Get ready for the next drop." };
  }
  if (sceneMode.value === "auction") {
    return { eyebrow: "Auction Live", title: "Bids are open", detail: "Watch the ticker for live action." };
  }
  if (sceneMode.value === "break") {
    return { eyebrow: "Be Right Back", title: "Quick break", detail: "The show will resume shortly." };
  }
  if (sceneMode.value === "winner") {
    return { eyebrow: "Winner Moment", title: "Winner!", detail: "Congrats to the latest buyer." };
  }
  if (sceneMode.value === "ending") {
    return { eyebrow: "Ending Soon", title: "Final call", detail: "Last chances before we wrap." };
  }
  return null;
});
const topBuyers = computed(() => (
  Object.entries(buyerTotals.value)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
));
const recapStats = computed(() => {
  const topBuyer = topBuyers.value[0];
  const recap = recapCard.value;
  return [
    { label: "Sales", value: `$${Math.round(recap?.grossSales ?? grossSales.value).toLocaleString()}` },
    { label: "Orders", value: (recap?.salesCount ?? orderCount.value).toLocaleString() },
    { label: "Follows", value: followCount.value.toLocaleString() },
    { label: "Bids", value: (recap?.bidCount ?? 0).toLocaleString() },
    { label: "Audience", value: (recap?.audienceActions ?? 0).toLocaleString() },
    { label: "Top Buyer", value: topBuyer ? `@${topBuyer[0]}` : "-" }
  ];
});

let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let dismissTimer: number | undefined;
let manualGifTimer: number | undefined;
let promoTimer: number | undefined;
let milestoneTimer: number | undefined;
let hypeTimer: number | undefined;
let auctionTimerInterval: number | undefined;
let recapTimer: number | undefined;
let activeAudioPlayer: HTMLAudioElement | null = null;
const overlayAudioScheduler = new AudioPlaybackScheduler();
const audioPlaybackTimers = new Set<number>();
let cameraStream: MediaStream | null = null;
const audioOutputEnabled = new URLSearchParams(window.location.search).get("audio") !== "off";
const previewSkin = (() => {
  const value = new URLSearchParams(window.location.search).get("skin");
  return isOverlaySkin(value) ? value : null;
})();

const eventDisplayDurations: Record<ShowEvent["type"], number> = {
  bid: 1600,
  sale: 3400,
  audience_action: 2200,
  tip: 3200,
  share: 2400
};

onMounted(connect);
onBeforeUnmount(() => {
  window.clearTimeout(reconnectTimer);
  window.clearTimeout(dismissTimer);
  window.clearTimeout(manualGifTimer);
  window.clearInterval(promoTimer);
  window.clearTimeout(milestoneTimer);
  window.clearInterval(hypeTimer);
  window.clearInterval(auctionTimerInterval);
  window.clearTimeout(recapTimer);
  stopAudioPlayback();
  stopCamera();
  socket?.close();
});

watch(jumbotronCameraEnabled, () => {
  void syncCamera();
});

function connect(): void {
  window.clearTimeout(reconnectTimer);
  socket = new WebSocket("ws://localhost:8741/ws");

  socket.addEventListener("open", () => {
    connected.value = true;
    reconnecting.value = false;
  });

  socket.addEventListener("message", (message) => {
    const parsed = parseMessage(message.data);
    if (!parsed) {
      return;
    }

    if (parsed.type === "connected" || isOverlayClearMessage(parsed)) {
      clearOverlayData();
      return;
    }

    if (isOverlayConfigMessage(parsed)) {
      theme.value = parsed.theme;
      skin.value = previewSkin ?? parsed.skin;
      activeAddOns.value = parsed.addOns;
      soundsEnabled.value = parsed.soundsEnabled;
      soundVolume.value = parsed.soundVolume;
      audioTheme.value = parsed.audioTheme;
      customSoundUrls.value = parsed.customSoundUrls;
      streamTitle.value = parsed.streamTitle;
      customGifUrls.value = parsed.customGifUrls;
      gifPlacement.value = parsed.gifPlacement;
      gifSize.value = parsed.gifSize;
      milestoneThresholds.value = parsed.milestoneThresholds;
      hypeMeterSeconds.value = parsed.hypeMeterSeconds;
      jumbotronCameraEnabled.value = parsed.jumbotronCameraEnabled;
      promoBanners.value = parsed.promoBanners;
      sceneMode.value = parsed.sceneMode;
      goals.value = parsed.goals;
      auctionTimerSeconds.value = parsed.auctionTimerSeconds;
      hideTopBanner.value = parsed.hideTopBanner === true;
      themeEffectsEnabled.value = parsed.themeEffectsEnabled !== false;
      if (!soundsEnabled.value || soundVolume.value === 0) {
        stopAudioPlayback();
      } else if (activeAudioPlayer) {
        activeAudioPlayer.volume = soundVolume.value;
      }
      return;
    }

    if (isOverlayGifTriggerMessage(parsed)) {
      triggerManualGif(parsed.url, parsed.timestamp);
      return;
    }

    if (isOverlaySoundTriggerMessage(parsed)) {
      if (audioOutputEnabled && soundsEnabled.value && soundVolume.value > 0) {
        playSoundKind(parsed.kind, parsed.timestamp);
      }
      return;
    }

    if (isOverlayBurstTriggerMessage(parsed)) {
      if (hasAddOn("hype_bursts")) {
        burstKey.value += 1;
      }
      return;
    }

    if (isOverlayMilestoneTriggerMessage(parsed)) {
      if (hasAddOn("milestones")) {
        showMilestone(parsed);
      }
      return;
    }

    if (isOverlayHypeMeterTriggerMessage(parsed)) {
      if (hasAddOn("hype_meter")) {
        startHypeMeter(parsed.durationSeconds);
      }
      return;
    }

    if (isOverlayAuctionTimerTriggerMessage(parsed)) {
      if (hasAddOn("auction_timer")) {
        startAuctionTimer(parsed.durationSeconds);
      }
      return;
    }

    if (isOverlayRecapTriggerMessage(parsed)) {
      if (hasAddOn("show_recap")) {
        showRecap(parsed);
      }
      return;
    }

    if (isShowEvent(parsed)) {
      applyHypeEvent(parsed);
      applyEventStats(parsed);
      if (audioOutputEnabled && soundsEnabled.value && soundVolume.value > 0) {
        playEventTone(parsed);
      }
      if (hasAddOn("hype_bursts")) {
        burstKey.value += 1;
      }
      if (parsed.type === "bid") {
        queue.value = queue.value.filter((event) => event.type !== "bid");
      }
      queue.value.push(parsed);
      recentEvents.value.unshift(parsed);
      recentEvents.value = recentEvents.value.slice(0, 5);
      activityEvents.value.unshift(parsed);
      activityEvents.value = activityEvents.value.slice(0, 12);
      showNextEvent();
    }
  });

  socket.addEventListener("close", scheduleReconnect);
  socket.addEventListener("error", scheduleReconnect);
}

function scheduleReconnect(): void {
  clearOverlayData();
  if (reconnecting.value) {
    return;
  }

  connected.value = false;
  reconnecting.value = true;
  reconnectTimer = window.setTimeout(() => {
    reconnecting.value = false;
    connect();
  }, 1200);
}

function showNextEvent(): void {
  if (activeEvent.value || queue.value.length === 0) {
    return;
  }

  const nextEvent = queue.value.shift();
  if (!nextEvent) {
    return;
  }

  activeEvent.value = nextEvent;
  dismissTimer = window.setTimeout(() => {
    activeEvent.value = null;
    window.setTimeout(showNextEvent, 180);
  }, eventDisplayDurations[nextEvent.type]);
}

function parseMessage(data: unknown): BridgeMessage | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as unknown;
    if (
      isShowEvent(parsed) ||
      isOverlayConfigMessage(parsed) ||
      isOverlayClearMessage(parsed) ||
      isOverlayGifTriggerMessage(parsed) ||
      isOverlaySoundTriggerMessage(parsed) ||
      isOverlayBurstTriggerMessage(parsed) ||
      isOverlayMilestoneTriggerMessage(parsed) ||
      isOverlayHypeMeterTriggerMessage(parsed) ||
      isOverlayAuctionTimerTriggerMessage(parsed) ||
      isOverlayRecapTriggerMessage(parsed) ||
      (typeof parsed === "object" && parsed !== null && "type" in parsed && parsed.type === "connected")
    ) {
      return parsed as BridgeMessage;
    }
    return null;
  } catch {
    return null;
  }
}

function clearOverlayData(): void {
  queue.value = [];
  activeEvent.value = null;
  recentEvents.value = [];
  activityEvents.value = [];
  buyerTotals.value = {};
  grossSales.value = 0;
  orderCount.value = 0;
  followCount.value = 0;
  burstKey.value = 0;
  manualGifUrl.value = "";
  manualGifTimestamp.value = 0;
  milestoneCard.value = null;
  hypeMeter.value = null;
  auctionTimer.value = null;
  recapCard.value = null;
  hypeRemaining.value = 0;
  auctionRemaining.value = 0;
  window.clearTimeout(dismissTimer);
  window.clearTimeout(manualGifTimer);
  window.clearTimeout(milestoneTimer);
  window.clearInterval(hypeTimer);
  window.clearInterval(auctionTimerInterval);
  window.clearTimeout(recapTimer);
}

function hasAddOn(addOn: AddOnId): boolean {
  return activeAddOns.value.includes(addOn);
}

function applyEventStats(event: ShowEvent): void {
  if (event.type !== "sale") {
    if (event.type === "audience_action" && event.action === "follow") {
      followCount.value += 1;
    }
    return;
  }

  grossSales.value += event.amount;
  orderCount.value += 1;
  buyerTotals.value = {
    ...buyerTotals.value,
    [event.buyer]: (buyerTotals.value[event.buyer] ?? 0) + event.amount
  };
}

function readGoalCurrent(goal: GoalConfig): number {
  if (goal.kind === "sales") {
    return grossSales.value;
  }
  if (goal.kind === "orders") {
    return orderCount.value;
  }
  if (goal.kind === "hype") {
    return hypeScore.value;
  }
  return followCount.value;
}

function formatGoalValue(goal: GoalConfig, value: number): string {
  if (goal.kind === "sales") {
    return `$${Math.round(value).toLocaleString()} / $${Math.round(goal.target).toLocaleString()}`;
  }
  return `${Math.round(value).toLocaleString()} / ${Math.round(goal.target).toLocaleString()}`;
}

function formatActivityAction(event: ShowEvent): string {
  if (event.type === "sale") {
    return "Sold";
  }
  if (event.type === "bid") {
    return "Bid";
  }
  if (event.type === "tip") {
    return "Tip";
  }
  if (event.type === "share") {
    return "Share";
  }
  if (event.action === "follow") {
    return "Follow";
  }
  if (event.action === "bookmark") {
    return "Bookmark";
  }
  if (event.action === "chat") {
    return "Chat";
  }
  return "Reaction";
}

function formatActivityActor(event: ShowEvent): string {
  if (event.type === "sale") {
    return `@${event.buyer}`;
  }
  if (event.type === "bid") {
    return `@${event.bidder}`;
  }
  if (event.type === "tip") {
    return `@${event.tipper}`;
  }
  if (event.type === "share") {
    return event.actor ? `@${event.actor}` : "Viewers";
  }
  return `@${event.actor}`;
}

function formatActivityMeta(event: ShowEvent): string {
  if (event.type === "sale" || event.type === "bid") {
    return `$${event.amount.toLocaleString()}${event.item ? ` - ${event.item}` : ""}`;
  }
  if (event.type === "tip") {
    return `$${event.amount.toLocaleString()}${event.message ? ` - ${event.message}` : ""}`;
  }
  if (event.type === "share") {
    if (event.delta && event.delta > 1) {
      return `+${event.delta} new shares`;
    }
    return event.shareCount === undefined ? "Shared the show" : `${event.shareCount.toLocaleString()} total shares`;
  }
  return event.message ?? "Audience action";
}

function playEventTone(event: ShowEvent): void {
  playSoundKind(event.type === "audience_action" ? "action" : event.type, event.timestamp);
}

function playSoundKind(kind: SoundKind, eventKey: string | number = Date.now()): void {
  const decision = overlayAudioScheduler.request(kind, Date.now(), eventKey);
  if (decision.action === "drop") {
    return;
  }

  if (decision.action === "queue") {
    const timer = window.setTimeout(() => {
      audioPlaybackTimers.delete(timer);
      if (audioOutputEnabled && soundsEnabled.value && soundVolume.value > 0) {
        startAudioPlayback(kind, decision.variant, true);
      }
    }, decision.delayMs);
    audioPlaybackTimers.add(timer);
    return;
  }

  startAudioPlayback(kind, decision.variant, decision.interrupt);
}

function startAudioPlayback(kind: SoundKind, variant: number, interrupt: boolean): void {
  if (interrupt) {
    stopActiveAudioPlayer();
  }
  const customUrl = customSoundUrls.value[kind];
  const selectedSource = selectAudioCueSource(kind, variant, customUrl);
  const selectedUrl = customUrl ? selectedSource : `/overlay/audio/${audioTheme.value}/${selectedSource}`;
  const audio = new Audio(new URL(selectedUrl, window.location.origin).href);
  audio.volume = soundVolume.value;
  activeAudioPlayer = audio;
  const release = () => {
    if (activeAudioPlayer === audio) {
      activeAudioPlayer = null;
    }
  };
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", () => {
    release();
    console.error(`[Duck Desk Audio] Missing or invalid ${kind} cue: ${selectedUrl}`);
  }, { once: true });
  void audio.play().catch((error: unknown) => {
    release();
    console.error(`[Duck Desk Audio] Could not play ${kind} cue`, error);
  });
}

function stopAudioPlayback(): void {
  for (const timer of audioPlaybackTimers) {
    window.clearTimeout(timer);
  }
  audioPlaybackTimers.clear();
  overlayAudioScheduler.reset();
  stopActiveAudioPlayer();
}

function stopActiveAudioPlayer(): void {
  if (activeAudioPlayer) {
    activeAudioPlayer.pause();
    activeAudioPlayer.currentTime = 0;
    activeAudioPlayer = null;
  }
}

function triggerManualGif(url: string, timestamp: number): void {
  if (!hasAddOn("gif_reactions")) {
    return;
  }

  manualGifUrl.value = url;
  manualGifTimestamp.value = timestamp;
  window.clearTimeout(manualGifTimer);
  manualGifTimer = window.setTimeout(() => {
    manualGifUrl.value = "";
    manualGifTimestamp.value = 0;
  }, 3600);
}

function showMilestone(message: { amount: number; label: string; timestamp: number }): void {
  milestoneCard.value = message;
  burstKey.value += 1;
  window.clearTimeout(milestoneTimer);
  milestoneTimer = window.setTimeout(() => {
    milestoneCard.value = null;
  }, 5200);
}

function startHypeMeter(durationSeconds: number): void {
  hypeMeter.value = {
    startedAt: Date.now(),
    durationSeconds,
    participants: new Set()
  };
  hypeRemaining.value = durationSeconds;
  window.clearInterval(hypeTimer);
  hypeTimer = window.setInterval(() => {
    if (!hypeMeter.value) {
      return;
    }
    const elapsed = Math.floor((Date.now() - hypeMeter.value.startedAt) / 1000);
    hypeRemaining.value = Math.max(0, hypeMeter.value.durationSeconds - elapsed);
    if (hypeRemaining.value === 0) {
      window.clearInterval(hypeTimer);
      window.setTimeout(() => {
        hypeMeter.value = null;
      }, 2400);
    }
  }, 250);
}

function startAuctionTimer(durationSeconds: number): void {
  auctionTimer.value = {
    startedAt: Date.now(),
    durationSeconds
  };
  auctionRemaining.value = durationSeconds;
  window.clearInterval(auctionTimerInterval);
  auctionTimerInterval = window.setInterval(() => {
    if (!auctionTimer.value) {
      return;
    }
    const elapsed = Math.floor((Date.now() - auctionTimer.value.startedAt) / 1000);
    auctionRemaining.value = Math.max(0, auctionTimer.value.durationSeconds - elapsed);
    if (auctionRemaining.value === 0) {
      window.clearInterval(auctionTimerInterval);
      window.setTimeout(() => {
        auctionTimer.value = null;
      }, 2600);
    }
  }, 200);
}

function showRecap(message: {
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  timestamp: number;
}): void {
  recapCard.value = message;
  window.clearTimeout(recapTimer);
  recapTimer = window.setTimeout(() => {
    recapCard.value = null;
  }, 9000);
}

function applyHypeEvent(event: ShowEvent): void {
  if (!hypeMeter.value) {
    return;
  }
  if (event.type === "audience_action") {
    hypeMeter.value.participants.add(event.actor);
  }
  if (event.type === "bid") {
    hypeMeter.value.participants.add(event.bidder);
  }
  if (event.type === "sale") {
    hypeMeter.value.participants.add(event.buyer);
  }
  if (event.type === "tip") {
    hypeMeter.value.participants.add(event.tipper);
  }
  if (event.type === "share" && event.actor) {
    hypeMeter.value.participants.add(event.actor);
  }
}

async function syncCamera(): Promise<void> {
  if (!jumbotronCameraEnabled.value) {
    stopCamera();
    return;
  }

  await nextTick();
  if (!cameraVideo.value || cameraStream) {
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cameraVideo.value.srcObject = cameraStream;
  } catch {
    stopCamera();
  }
}

function stopCamera(): void {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  if (cameraVideo.value) {
    cameraVideo.value.srcObject = null;
  }
}

onMounted(() => {
  promoTimer = window.setInterval(() => {
    if (promoBanners.value.length > 0) {
      promoIndex.value += 1;
    }
  }, 7000);
});
</script>

<template>
  <main
    class="overlay-shell"
    :class="[
      `theme-${theme}`,
      `skin-${skin}`,
      {
        'skin-premium': premiumSkinActive,
        'is-alert-active': Boolean(activeEvent),
        'theme-effects-off': !themeEffectsEnabled
      },
      activeAddOns.map((addOn) => `addon-${addOn}`)
    ]"
    aria-live="polite"
  >
    <div v-if="themeEffectsEnabled" class="overlay-frame" aria-hidden="true" />
    <ThemeArt v-if="themeEffectsEnabled" :skin="skin" />
    <BroadcastFrame v-if="themeEffectsEnabled" :skin="skin" />
    <div
      v-if="themeEffectsEnabled && hasAddOn('stream_skins') && premiumSkinActive"
      class="premium-atmosphere"
      aria-hidden="true"
    >
      <div class="premium-sky" />
      <div class="premium-motion">
        <span v-for="particle in 12" :key="particle" />
      </div>
      <div class="premium-foreground">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
    <div v-if="themeEffectsEnabled" class="sparkle-field" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
    <img
      v-if="hasAddOn('gif_reactions') && displayedGif"
      :key="`gif-img-${manualGifTimestamp || recentEvents[0]?.timestamp}`"
      class="reaction-gif"
      :class="[gifPositionClass, gifSizeClass]"
      :src="displayedGif"
      alt=""
      referrerpolicy="no-referrer"
      aria-hidden="true"
    />
    <div
      v-if="hasAddOn('hype_bursts') && recentEvents.length > 0"
      :key="`gif-${recentEvents[0]?.timestamp}`"
      class="gif-lane"
      :class="`gif-${latestEventType}`"
      aria-hidden="true"
    >
      <span>{{ latestEventLabel }}</span>
      <span>{{ latestEventLabel }}</span>
      <span>{{ latestEventLabel }}</span>
    </div>
    <div
      v-if="themeEffectsEnabled && hasAddOn('stream_skins') && skin !== 'none'"
      class="skin-frame"
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
    </div>
    <div
      v-if="hasAddOn('hype_bursts') && burstKey > 0"
      :key="burstKey"
      class="burst-ring"
      aria-hidden="true"
    />
    <div v-if="themeEffectsEnabled" class="arena-bars" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <div class="top-stack">
      <section v-if="!hideTopBanner" class="show-hud">
        <div class="hud-chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="hud-brand">
          <div class="brand-lockup">
            <span class="brand-index" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="13.5" cy="16.5" r="9" fill="currentColor" />
                <circle cx="16.5" cy="13.5" r="1.7" fill="#071014" />
                <path d="M22 13.5 L30.5 11.2 L22 18.2 Z" fill="#ffcf61" />
              </svg>
            </span>
            <span class="brand-stack">
              <strong>DUCK DESK</strong>
              <em v-if="streamTitle">{{ streamTitle }}</em>
            </span>
          </div>
          <span class="live-cluster">
            <i class="live-light" :class="{ connected }" />
            <span class="hud-live" :class="{ connected }">{{ statusLabel }}</span>
          </span>
        </div>
        <div v-if="hasAddOn('promo_banners') && activePromo" class="promo-banner">
          {{ activePromo }}
        </div>
        <div class="ticker">
          <span class="ticker-label"><i /> Live activity</span>
          <div class="ticker-track" :class="{ 'is-empty': recentEvents.length === 0 }">
            <div v-if="recentEvents.length > 0" class="ticker-marquee">
              <span
                v-for="(event, index) in tickerTape"
                :key="`${event.type}-${event.timestamp}-${index}`"
                class="ticker-item"
                :class="`ticker-${event.type}`"
              >
                <template v-if="event.type === 'sale'">SOLD @{{ event.buyer }} ${{ event.amount }}</template>
                <template v-else-if="event.type === 'bid'">BID @{{ event.bidder }} ${{ event.amount }}</template>
                <template v-else-if="event.type === 'tip'">TIP @{{ event.tipper }} ${{ event.amount }}</template>
                <template v-else-if="event.type === 'share'">
                  SHARED<template v-if="event.actor"> @{{ event.actor }}</template><template v-else-if="event.delta"> +{{ event.delta }}</template>
                </template>
                <template v-else>{{ event.action.toUpperCase() }} @{{ event.actor }}</template>
              </span>
            </div>
          </div>
        </div>
      </section>

      <Transition name="sale-alert">
        <EventAlert v-if="activeEvent" :event="activeEvent" />
      </Transition>
    </div>

    <section v-if="hasAddOn('jumbotron')" class="jumbotron-stage">
      <div class="jumbotron-screen">
        <span>LIVE JUMBOTRON</span>
        <strong>{{ jumbotronLabel }}</strong>
      </div>
      <video
        v-if="jumbotronCameraEnabled"
        ref="cameraVideo"
        class="jumbotron-camera"
        autoplay
        muted
        playsinline
      />
    </section>

    <section
      v-if="hasAddOn('scene_switcher') && sceneContent"
      class="scene-state"
      :class="`scene-${sceneMode}`"
    >
      <span>{{ sceneContent.eyebrow }}</span>
      <strong>{{ sceneContent.title }}</strong>
      <em>{{ sceneContent.detail }}</em>
    </section>

    <section v-if="hasAddOn('goal_widgets') && activeGoals.length > 0" class="goal-stack">
      <article v-for="goal in activeGoals" :key="`${goal.kind}-${goal.label}`" class="goal-widget">
        <div>
          <span>{{ goal.label }}</span>
          <strong>{{ formatGoalValue(goal, goal.current) }}</strong>
        </div>
        <i><b :style="{ width: `${goal.progress}%` }" /></i>
      </article>
    </section>

    <section v-if="auctionTimer" class="auction-timer">
      <div>
        <span>Final Call</span>
        <strong>{{ auctionRemaining }}</strong>
      </div>
      <i><b :style="{ width: `${auctionProgress}%` }" /></i>
    </section>

    <section v-if="hasAddOn('activity_feed') && activityEvents.length > 0" class="activity-feed">
      <header>
        <span>Live Activity</span>
        <strong>{{ activityEvents.length }}</strong>
      </header>
      <ol>
        <li
          v-for="event in activityEvents.slice(0, 6)"
          :key="`activity-${event.type}-${event.timestamp}`"
          :class="`activity-${event.type}`"
        >
          <i>{{ formatActivityAction(event) }}</i>
          <strong>{{ formatActivityActor(event) }}</strong>
          <em>{{ formatActivityMeta(event) }}</em>
        </li>
      </ol>
    </section>

    <section v-if="hasAddOn('show_recap') && recapCard" class="show-recap">
      <span>Show Recap</span>
      <div>
        <article v-for="stat in recapStats" :key="stat.label">
          <em>{{ stat.label }}</em>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>
    </section>

    <section v-if="hypeMeter" class="hype-meter">
      <div class="hype-meter-head">
        <strong>HYPE METER</strong>
        <span>{{ hypeRemaining }}s</span>
      </div>
      <div class="hype-meter-track">
        <i :style="{ width: `${hypeProgress}%` }" />
      </div>
      <small>{{ hypeMeter.participants.size }} active viewers</small>
    </section>

    <section v-if="milestoneCard" class="milestone-card">
      <span>Milestone Hit</span>
      <strong>${{ milestoneCard.amount }}</strong>
      <em>{{ milestoneCard.label }}</em>
    </section>

    <section
      v-if="(hasAddOn('bid_ladder') || hasAddOn('leaderboard_deck')) && !hasAddOn('jumbotron')"
      class="add-on-stack"
    >
      <div v-if="hasAddOn('bid_ladder')" class="bid-ladder">
        <span>Bid Ladder</span>
        <strong v-if="latestBid && latestBid.type === 'bid'">@{{ latestBid.bidder }} ${{ latestBid.amount }}</strong>
        <strong v-else>-</strong>
        <small v-if="latestBid && latestBid.type === 'bid'">Next target ${{ latestBid.amount + 1 }}</small>
        <small v-else>No live bids detected</small>
      </div>

      <div v-if="hasAddOn('leaderboard_deck')" class="leaderboard-deck">
        <span>Top Buyers</span>
        <ol v-if="topBuyers.length > 0">
          <li v-for="[buyer, amount] in topBuyers" :key="buyer">
            <strong>@{{ buyer }}</strong>
            <em>${{ amount }}</em>
          </li>
        </ol>
        <p v-else>No buyer data yet</p>
      </div>
    </section>

    <footer class="open-source-banner">
      <span>Get the free open source Duck Desk at</span>
      <strong>https://github.com/ConfusedDuckCollectibles/DuckDesk</strong>
    </footer>

  </main>
</template>
