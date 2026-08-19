<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  isOverlayConfigMessage,
  isOverlayClearMessage,
  isOverlayBurstTriggerMessage,
  isOverlayGifTriggerMessage,
  isOverlayHypeMeterTriggerMessage,
  isOverlayMilestoneTriggerMessage,
  isOverlaySoundTriggerMessage,
  isShowEvent,
  type AddOnId,
  type BridgeMessage,
  type GifPlacement,
  type GifSize,
  type OverlaySkin,
  type OverlayTheme,
  type ShowEvent,
  type SoundKind
} from "@duck-desk/shared";
import EventAlert from "./components/EventAlert.vue";

const queue = ref<ShowEvent[]>([]);
const activeEvent = ref<ShowEvent | null>(null);
const recentEvents = ref<ShowEvent[]>([]);
const connected = ref(false);
const reconnecting = ref(false);
const theme = ref<OverlayTheme>("neon");
const skin = ref<OverlaySkin>("none");
const activeAddOns = ref<AddOnId[]>([]);
const soundsEnabled = ref(true);
const streamTitle = ref("");
const customGifUrls = ref<string[]>([]);
const gifPlacement = ref<GifPlacement>("center");
const gifSize = ref<GifSize>("medium");
const milestoneThresholds = ref<number[]>([]);
const hypeMeterSeconds = ref(30);
const jumbotronCameraEnabled = ref(false);
const promoBanners = ref<string[]>([]);
const promoIndex = ref(0);
const milestoneCard = ref<{ amount: number; label: string; timestamp: number } | null>(null);
const hypeMeter = ref<{ startedAt: number; durationSeconds: number; participants: Set<string> } | null>(null);
const manualGifUrl = ref("");
const manualGifTimestamp = ref(0);
const cameraVideo = ref<HTMLVideoElement | null>(null);
const buyerTotals = ref<Record<string, number>>({});
const burstKey = ref(0);
const statusLabel = computed(() => (connected.value ? "live" : "offline"));
const latestBid = computed(() => recentEvents.value.find((event) => event.type === "bid"));
const latestEventType = computed(() => recentEvents.value[0]?.type ?? "idle");
const jumbotronLabel = computed(() => recentEvents.value[0]?.type.toUpperCase() ?? "ROOM READY");
const displayedGif = computed(() => manualGifUrl.value);
const activePromo = computed(() => promoBanners.value[promoIndex.value % Math.max(1, promoBanners.value.length)] ?? "");
const hypeRemaining = ref(0);
const hypeProgress = computed(() => {
  if (!hypeMeter.value) {
    return 0;
  }
  const participantScore = Math.min(70, hypeMeter.value.participants.size * 14);
  const timeScore = Math.min(30, ((hypeMeter.value.durationSeconds - hypeRemaining.value) / hypeMeter.value.durationSeconds) * 30);
  return Math.min(100, Math.round(participantScore + timeScore));
});
const gifPositionClass = computed(() => `gif-position-${gifPlacement.value}`);
const gifSizeClass = computed(() => `gif-size-${gifSize.value}`);
const hypeScore = computed(() => recentEvents.value.length === 0 ? 0 : Math.min(99, recentEvents.value.length * 18));
const topBuyers = computed(() => (
  Object.entries(buyerTotals.value)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
));

let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let dismissTimer: number | undefined;
let manualGifTimer: number | undefined;
let promoTimer: number | undefined;
let milestoneTimer: number | undefined;
let hypeTimer: number | undefined;
let audioContext: AudioContext | undefined;
let cameraStream: MediaStream | null = null;

onMounted(connect);
onBeforeUnmount(() => {
  window.clearTimeout(reconnectTimer);
  window.clearTimeout(dismissTimer);
  window.clearTimeout(manualGifTimer);
  window.clearInterval(promoTimer);
  window.clearTimeout(milestoneTimer);
  window.clearInterval(hypeTimer);
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
      skin.value = parsed.skin;
      activeAddOns.value = parsed.addOns;
      soundsEnabled.value = parsed.soundsEnabled;
      streamTitle.value = parsed.streamTitle;
      customGifUrls.value = parsed.customGifUrls;
      gifPlacement.value = parsed.gifPlacement;
      gifSize.value = parsed.gifSize;
      milestoneThresholds.value = parsed.milestoneThresholds;
      hypeMeterSeconds.value = parsed.hypeMeterSeconds;
      jumbotronCameraEnabled.value = parsed.jumbotronCameraEnabled;
      promoBanners.value = parsed.promoBanners;
      return;
    }

    if (isOverlayGifTriggerMessage(parsed)) {
      triggerManualGif(parsed.url, parsed.timestamp);
      return;
    }

    if (isOverlaySoundTriggerMessage(parsed)) {
      if (hasAddOn("noise_machines") && soundsEnabled.value) {
        playSoundKind(parsed.kind);
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

    if (isShowEvent(parsed)) {
      applyHypeEvent(parsed);
      applyEventStats(parsed);
      if (hasAddOn("noise_machines") && soundsEnabled.value) {
        playEventTone(parsed);
      }
      if (hasAddOn("hype_bursts")) {
        burstKey.value += 1;
      }
      queue.value.push(parsed);
      recentEvents.value.unshift(parsed);
      recentEvents.value = recentEvents.value.slice(0, 5);
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

  activeEvent.value = queue.value.shift() ?? null;
  dismissTimer = window.setTimeout(() => {
    activeEvent.value = null;
    window.setTimeout(showNextEvent, 350);
  }, 4200);
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
  buyerTotals.value = {};
  burstKey.value = 0;
  manualGifUrl.value = "";
  manualGifTimestamp.value = 0;
  milestoneCard.value = null;
  hypeMeter.value = null;
  hypeRemaining.value = 0;
  window.clearTimeout(dismissTimer);
  window.clearTimeout(manualGifTimer);
  window.clearTimeout(milestoneTimer);
  window.clearInterval(hypeTimer);
}

function hasAddOn(addOn: AddOnId): boolean {
  return activeAddOns.value.includes(addOn);
}

function applyEventStats(event: ShowEvent): void {
  if (event.type !== "sale") {
    return;
  }

  buyerTotals.value = {
    ...buyerTotals.value,
    [event.buyer]: (buyerTotals.value[event.buyer] ?? 0) + event.amount
  };
}

function playEventTone(event: ShowEvent): void {
  playSoundKind(event.type === "sale" ? "sale" : event.type === "bid" ? "bid" : "action");
}

function playSoundKind(kind: SoundKind): void {
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequency = kind === "sale" ? 660 : kind === "bid" ? 480 : 320;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioContext.currentTime + 0.14);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.26);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.28);
  } catch {
    // OBS or the browser preview can block audio until user interaction.
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
    :class="[`theme-${theme}`, `skin-${skin}`, activeAddOns.map((addOn) => `addon-${addOn}`)]"
    aria-live="polite"
  >
    <div class="overlay-frame" aria-hidden="true" />
    <div class="sparkle-field" aria-hidden="true">
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
      <span>{{ latestEventType === "sale" ? "SOLD" : latestEventType === "bid" ? "BID" : "CHAT" }}</span>
      <span>{{ latestEventType === "sale" ? "SOLD" : latestEventType === "bid" ? "BID" : "CHAT" }}</span>
      <span>{{ latestEventType === "sale" ? "SOLD" : latestEventType === "bid" ? "BID" : "CHAT" }}</span>
    </div>
    <div v-if="hasAddOn('stream_skins') && skin !== 'none'" class="skin-frame" aria-hidden="true">
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
    <div class="arena-bars" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <section class="show-hud">
      <div class="hud-brand">
        <span class="live-cluster">
          <i class="live-light" :class="{ connected }" />
          <span class="hud-live" :class="{ connected }">{{ statusLabel }}</span>
        </span>
        <span class="brand-stack">
          <strong>DUCK DESK</strong>
          <em v-if="streamTitle">{{ streamTitle }}</em>
        </span>
      </div>
      <div v-if="hasAddOn('promo_banners') && activePromo" class="promo-banner">
        {{ activePromo }}
      </div>
      <div class="ticker">
        <span
          v-for="event in recentEvents"
          :key="`${event.type}-${event.timestamp}`"
          class="ticker-item"
        >
          <template v-if="event.type === 'sale'">SOLD @{{ event.buyer }} ${{ event.amount }}</template>
          <template v-else-if="event.type === 'bid'">BID @{{ event.bidder }} ${{ event.amount }}</template>
          <template v-else>{{ event.action.toUpperCase() }} @{{ event.actor }}</template>
        </span>
      </div>
    </section>

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

    <section v-if="recentEvents.length > 0" class="score-strip">
      <div>
        <span>Hype</span>
        <strong>{{ hypeScore }}</strong>
      </div>
      <div>
        <span>Last</span>
        <strong>{{ recentEvents[0]?.type ?? "-" }}</strong>
      </div>
    </section>

    <section
      v-if="hasAddOn('bid_ladder') || hasAddOn('leaderboard_deck')"
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

    <Transition name="sale-alert">
      <EventAlert v-if="activeEvent" :event="activeEvent" />
    </Transition>
  </main>
</template>
