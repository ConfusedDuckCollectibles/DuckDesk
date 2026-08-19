<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  isOverlayConfigMessage,
  isShowEvent,
  type AddOnId,
  type BridgeMessage,
  type OverlaySkin,
  type OverlayTheme,
  type ShowEvent
} from "@duck-desk/shared";
import EventAlert from "./components/EventAlert.vue";

const queue = ref<ShowEvent[]>([]);
const activeEvent = ref<ShowEvent | null>(null);
const recentEvents = ref<ShowEvent[]>([]);
const connected = ref(false);
const reconnecting = ref(false);
const theme = ref<OverlayTheme>("neon");
const skin = ref<OverlaySkin>("cyber_market");
const activeAddOns = ref<AddOnId[]>([]);
const soundsEnabled = ref(true);
const buyerTotals = ref<Record<string, number>>({});
const burstKey = ref(0);
const statusLabel = computed(() => (connected.value ? "live" : "offline"));
const themeLabel = computed(() => {
  if (theme.value === "arena") {
    return "Auction Arena";
  }

  if (theme.value === "duck") {
    return "Duck Pop";
  }

  return "Neon Circuit";
});
const latestBid = computed(() => recentEvents.value.find((event) => event.type === "bid"));
const latestEventType = computed(() => recentEvents.value[0]?.type ?? "idle");
const topBuyers = computed(() => (
  Object.entries(buyerTotals.value)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
));
const leaderboardRows = computed<[string, number][]>(() => (
  topBuyers.value.length > 0
    ? topBuyers.value
    : [
      ["Buyer Slot", 0],
      ["Next Sale", 0],
      ["Show Goal", 0]
    ]
));

let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let dismissTimer: number | undefined;
let audioContext: AudioContext | undefined;

onMounted(connect);
onBeforeUnmount(() => {
  window.clearTimeout(reconnectTimer);
  window.clearTimeout(dismissTimer);
  socket?.close();
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

    if (isOverlayConfigMessage(parsed)) {
      theme.value = parsed.theme;
      skin.value = parsed.skin;
      activeAddOns.value = parsed.addOns;
      soundsEnabled.value = parsed.soundsEnabled;
      return;
    }

    if (isShowEvent(parsed)) {
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
    return isShowEvent(parsed) || isOverlayConfigMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
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
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequency = event.type === "sale" ? 660 : event.type === "bid" ? 480 : 320;

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
</script>

<template>
  <main
    class="overlay-shell"
    :class="[`theme-${theme}`, `skin-${skin}`, activeAddOns.map((addOn) => `addon-${addOn}`)]"
    aria-live="polite"
  >
    <div class="overlay-frame" aria-hidden="true" />
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
    <div v-if="hasAddOn('stream_skins')" class="skin-frame" aria-hidden="true">
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
        <span class="hud-live" :class="{ connected }">{{ statusLabel }}</span>
        <strong>DUCK DESK</strong>
        <span>{{ themeLabel }}</span>
      </div>
      <div v-if="activeAddOns.length > 0" class="addon-strip">
        <span v-if="hasAddOn('stream_skins')">skin pack</span>
        <span v-if="hasAddOn('noise_machines')">audio reactive</span>
        <span v-if="hasAddOn('bid_ladder')">bid ladder</span>
        <span v-if="hasAddOn('hype_bursts')">hype bursts</span>
        <span v-if="hasAddOn('leaderboard_deck')">leaderboard</span>
      </div>
      <div class="ticker">
        <span v-if="recentEvents.length === 0">Ready for bids, follows, chat hits, and sales</span>
        <span
          v-for="event in recentEvents"
          v-else
          :key="`${event.type}-${event.timestamp}`"
          class="ticker-item"
        >
          <template v-if="event.type === 'sale'">SOLD @{{ event.buyer }} ${{ event.amount }}</template>
          <template v-else-if="event.type === 'bid'">BID @{{ event.bidder }} ${{ event.amount }}</template>
          <template v-else>{{ event.action.toUpperCase() }} @{{ event.actor }}</template>
        </span>
      </div>
    </section>

    <section class="score-strip">
      <div>
        <span>Hype</span>
        <strong>{{ Math.min(99, recentEvents.length * 18 + (connected ? 10 : 0)) }}</strong>
      </div>
      <div>
        <span>Last</span>
        <strong>{{ recentEvents[0]?.type ?? "idle" }}</strong>
      </div>
      <div>
        <span>Mode</span>
        <strong>{{ theme }}</strong>
      </div>
    </section>

    <section
      v-if="hasAddOn('bid_ladder') || hasAddOn('leaderboard_deck')"
      class="add-on-stack"
    >
      <div v-if="hasAddOn('bid_ladder')" class="bid-ladder">
        <span>Bid Ladder</span>
        <strong v-if="latestBid && latestBid.type === 'bid'">@{{ latestBid.bidder }} ${{ latestBid.amount }}</strong>
        <strong v-else>Ready</strong>
        <small v-if="latestBid && latestBid.type === 'bid'">Next target ${{ latestBid.amount + 1 }}</small>
        <small v-else>Waiting for the first bid</small>
      </div>

      <div v-if="hasAddOn('leaderboard_deck')" class="leaderboard-deck">
        <span>{{ topBuyers.length > 0 ? "Top Buyers" : "Leaderboard Loaded" }}</span>
        <ol>
          <li v-for="[buyer, amount] in leaderboardRows" :key="buyer">
            <strong>@{{ buyer }}</strong>
            <em>{{ amount > 0 ? `$${amount}` : "ready" }}</em>
          </li>
        </ol>
      </div>
    </section>

    <Transition name="sale-alert">
      <EventAlert v-if="activeEvent" :event="activeEvent" />
    </Transition>
  </main>
</template>
