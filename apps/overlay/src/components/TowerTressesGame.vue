<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  GAME_ACTION_CLIP_MS,
  TOWER_LAYOUT,
  TOWER_TRESSES_CLIPS,
  birdRect,
  celebrationActiveUntil,
  celebrationClipAction,
  clipFrameIndex,
  combRect,
  createGameAnimationState,
  enqueueGameAction,
  finishGameAction,
  princeRescueBox,
  princeSaleOffset,
  towerBraidFill,
  towerBraidSegments,
  type GameAction,
  type GameAnimationState,
  type GameThemeProgress
} from "@duck-desk/shared";
import PixelSprite from "./PixelSprite.vue";
import GameHud from "./GameHud.vue";

const props = defineProps<{ state: GameThemeProgress }>();

const animation = ref<GameAnimationState>(createGameAnimationState());
const nowMs = ref(Date.now());
const reducedMotion = ref(false);
let frameLoop = 0;
let clipTimer: number | undefined;
let motionObserver: MutationObserver | undefined;

const assetBase = computed(() => {
  const href = window.location.href;
  return href.endsWith("/") ? href : `${href}/`;
});
const asset = (name: string) => new URL(`./game-themes-v2/tower-tresses/${name}`, assetBase.value).href;

const rescueMs = computed(() => celebrationActiveUntil(props.state, nowMs.value));
const rescueAction = computed(() => (rescueMs.value > 0 ? celebrationClipAction(props.state.celebration) : null));
const queuedAction = computed<GameAction>(() => animation.value.active?.action ?? "idle");
const action = computed<GameAction>(() => rescueAction.value ?? queuedAction.value);
const intensity = computed(() => animation.value.active?.intensity ?? 1);
const clip = computed(() => TOWER_TRESSES_CLIPS[action.value]);
const clipElapsed = computed(() => {
  if (rescueAction.value && props.state.celebrationAt !== undefined) {
    return Math.max(0, nowMs.value - props.state.celebrationAt);
  }
  const command = animation.value.active;
  if (!command || command.action === "idle") {
    return nowMs.value;
  }
  return Math.max(0, nowMs.value - command.startedAt);
});
const frameIndex = computed(() => {
  if (reducedMotion.value) {
    return Math.min(clip.value.holdFrame, clip.value.princessFrames.length - 1);
  }
  return clipFrameIndex(
    clipElapsed.value,
    clip.value.princessFrames.length,
    clip.value.durationMs,
    clip.value.loop
  );
});
const princessFrame = computed(() => clip.value.princessFrames[frameIndex.value] ?? clip.value.princessFrames[0] ?? 0);
const princeFrame = computed(() => {
  const frames = clip.value.princeFrames;
  const index = reducedMotion.value
    ? Math.min(clip.value.holdFrame, frames.length - 1)
    : clipFrameIndex(clipElapsed.value, frames.length, clip.value.durationMs, clip.value.loop);
  return frames[index] ?? frames[0] ?? 0;
});
const extraFrame = computed(() => (reducedMotion.value ? clip.value.holdFrame : frameIndex.value));
const rescuing = computed(() => rescueAction.value !== null);
const rescueProgress = computed(() => {
  if (!rescueAction.value) {
    return 0;
  }
  return Math.min(1, clipElapsed.value / Math.max(1, GAME_ACTION_CLIP_MS[rescueAction.value]));
});
const localPercent = computed(() => Math.round((props.state.progress / Math.max(1, props.state.target)) * 100));
const braidFill = computed(() =>
  rescuing.value ? 1 : towerBraidFill(props.state.progress, props.state.target)
);
const braidSegments = computed(() => towerBraidSegments(braidFill.value));
const braidTiles = computed(() => braidSegments.value.filter((segment) => segment.id.startsWith("braid-tile-")));
const newestTileId = computed(() => braidTiles.value.at(-1)?.id);
const braidRoot = computed(() => braidSegments.value[0]);
const braidTassel = computed(() => braidSegments.value[braidSegments.value.length - 1]);
const birdBox = computed(() => birdRect(extraFrame.value, clip.value.princessFrames.length));
const combBox = computed(() => combRect(extraFrame.value, clip.value.princessFrames.length));
const princeBox = computed(() => {
  if (rescuing.value) {
    return princeRescueBox(rescueProgress.value);
  }
  return {
    ...TOWER_LAYOUT.prince,
    x: TOWER_LAYOUT.prince.x + (action.value === "sale" ? princeSaleOffset(frameIndex.value) : 0)
  };
});
const bandReached = computed(() => [20, 40, 60, 80, 100].map((band) => props.state.level >= band));
const completedTower = computed(() => {
  if (action.value === "win") {
    return 100;
  }
  if (action.value === "level_up") {
    return Math.max(1, props.state.level - 1);
  }
  return props.state.level;
});

watch(
  () => props.state.revision,
  () => {
    const now = nowMs.value;
    if (rescueAction.value) {
      pushAction(rescueAction.value);
      return;
    }
    if (props.state.revision === 0 || (props.state.actionAt && now - props.state.actionAt > 6_000)) {
      return;
    }
    pushAction(props.state.lastAction);
  },
  { immediate: true }
);

watch(
  () => animation.value.active,
  (command, previous) => {
    window.clearTimeout(clipTimer);
    if (!command || command.action === "idle" || command.id === previous?.id) {
      return;
    }
    clipTimer = window.setTimeout(() => {
      if (animation.value.active?.id === command.id) {
        animation.value = finishGameAction(animation.value, Date.now());
      }
    }, command.durationMs);
  },
  { immediate: true }
);

onMounted(() => {
  syncReducedMotion();
  const shell = document.querySelector(".overlay-shell");
  if (shell) {
    motionObserver = new MutationObserver(syncReducedMotion);
    motionObserver.observe(shell, { attributes: true, attributeFilter: ["class"] });
  }
  const tick = () => {
    nowMs.value = Date.now();
    frameLoop = window.requestAnimationFrame(tick);
  };
  frameLoop = window.requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameLoop);
  window.clearTimeout(clipTimer);
  motionObserver?.disconnect();
});

function syncReducedMotion(): void {
  reducedMotion.value = Boolean(document.querySelector(".pack-reduced-motion"));
}

function pushAction(nextAction: GameAction): void {
  animation.value = enqueueGameAction(animation.value, nextAction, nowMs.value);
}

function boxStyle(box: { x: number; y: number; width: number; height: number }, image?: string) {
  return {
    left: `calc(${box.x} * var(--u))`,
    top: `calc(${box.y} * var(--u))`,
    width: `calc(${box.width} * var(--u))`,
    height: `calc(${box.height} * var(--u))`,
    backgroundImage: image ? `url(${image})` : undefined
  };
}
</script>

<template>
  <div
    class="tower-v2"
    :class="`tower-action-${action}`"
    :style="{ '--tower-level-progress': `${localPercent}%` }"
    :data-action="action"
    :data-intensity="intensity"
    :data-journey="braidFill.toFixed(3)"
    :data-rescuing="rescuing ? '1' : '0'"
  >
    <div class="tower-v2-wall" :style="boxStyle(TOWER_LAYOUT.wall, asset('tower-wall-tile.png'))" aria-hidden="true" />
    <i class="tower-v2-roof" :style="boxStyle(TOWER_LAYOUT.roof, asset('tower-roof.png'))" />
    <PixelSprite
      :src="asset('princess-window.png')"
      :frame="princessFrame"
      :frames="7"
      :frame-width="144"
      :frame-height="224"
      :x="TOWER_LAYOUT.princess.x"
      :y="TOWER_LAYOUT.princess.y"
      :width="TOWER_LAYOUT.princess.width"
      :height="TOWER_LAYOUT.princess.height"
    />
    <i class="tower-v2-braid-root" :style="boxStyle(braidRoot, asset('braid-root.png'))" />
    <i
      v-for="tile in braidTiles"
      :key="tile.id"
      class="tower-v2-braid-tile"
      :class="{ 'tower-v2-braid-tile-new': tile.id === newestTileId && (action === 'bid' || action === 'tip' || action === 'sale') }"
      :style="boxStyle(tile, asset('braid-tile.png'))"
    />
    <i class="tower-v2-braid-tassel" :style="boxStyle(braidTassel, asset('braid-tassel.png'))" />

    <div class="tower-v2-courtyard" :style="boxStyle(TOWER_LAYOUT.courtyard, asset('courtyard-stone-tile.png'))" aria-hidden="true">
      <i class="tower-v2-rail" :style="{ backgroundImage: `url(${asset('courtyard-rail.png')})` }" />
    </div>
    <PixelSprite
      class="tower-v2-prince"
      :src="asset('prince.png')"
      :frame="princeFrame"
      :frames="8"
      :frame-width="128"
      :frame-height="224"
      :x="princeBox.x"
      :y="princeBox.y"
      :width="princeBox.width"
      :height="princeBox.height"
    />

    <div class="tower-v2-goal" :style="boxStyle(TOWER_LAYOUT.goal)" aria-hidden="true">
      <span>100</span>
      <i
        v-for="(reached, index) in bandReached"
        :key="index"
        :class="{ reached }"
        :style="{ backgroundImage: `url(${asset('band-gem.png')})` }"
      />
    </div>

    <PixelSprite
      v-if="clip.extra === 'bird'"
      :src="asset('bird.png')"
      :frame="extraFrame % 5"
      :frames="5"
      :frame-width="160"
      :frame-height="112"
      :x="birdBox.x"
      :y="birdBox.y"
      :width="birdBox.width"
      :height="birdBox.height"
    />
    <PixelSprite
      v-if="clip.extra === 'comb'"
      :src="asset('comb.png')"
      :frame="extraFrame % 3"
      :frames="3"
      :frame-width="96"
      :frame-height="96"
      :x="combBox.x"
      :y="combBox.y"
      :width="combBox.width"
      :height="combBox.height"
    />
    <GameHud
      noun="Tower"
      :level="state.level"
      objective="GROW THE BRAID. RESCUE THE PRINCESS."
      :progress="state.progress"
      :target="state.target"
      :won="rescuing"
      :won-label="`TOWER ${completedTower} WON`"
    />

    <div v-if="action === 'win'" class="tower-v2-win">
      <PixelSprite :src="asset('prince.png')" :frame="7" :frames="8" :frame-width="128" :frame-height="224" />
      <div>
        <span>THE BRAID REACHED THE COURTYARD</span>
        <strong>RESCUE COMPLETE</strong>
        <em>Win {{ state.wins }}</em>
      </div>
      <PixelSprite :src="asset('princess-celebrate.png')" :frame="2" :frames="3" :frame-width="160" :frame-height="208" />
    </div>
  </div>
</template>
