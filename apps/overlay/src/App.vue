<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  isOverlayConfigMessage,
  isShowEvent,
  type BridgeMessage,
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

let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let dismissTimer: number | undefined;

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
      return;
    }

    if (isShowEvent(parsed)) {
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
</script>

<template>
  <main class="overlay-shell" :class="`theme-${theme}`" aria-live="polite">
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

    <Transition name="sale-alert">
      <EventAlert v-if="activeEvent" :event="activeEvent" />
    </Transition>
  </main>
</template>
