<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  celebrationActiveUntil,
  celebrationClipAction,
  clipFrameIndex,
  createGameAnimationState,
  enqueueGameAction,
  finishGameAction,
  type GameAction,
  type GameAnimationState,
  type GameThemeProgress
} from "@duck-desk/shared";

const props = defineProps<{
  state: GameThemeProgress;
  clips: Record<GameAction, { heroFrames: readonly number[]; durationMs: number; loop: boolean; holdFrame: number }>;
}>();

const animation = ref<GameAnimationState>(createGameAnimationState());
const nowMs = ref(Date.now());
const reducedMotion = ref(false);
let frameLoop = 0;
let clipTimer: number | undefined;
let motionObserver: MutationObserver | undefined;

const rescueMs = computed(() => celebrationActiveUntil(props.state, nowMs.value));
const rescueAction = computed(() => (rescueMs.value > 0 ? celebrationClipAction(props.state.celebration) : null));
const queuedAction = computed<GameAction>(() => animation.value.active?.action ?? "idle");
const action = computed<GameAction>(() => rescueAction.value ?? queuedAction.value);
const clip = computed(() => props.clips[action.value]);
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
    return Math.min(clip.value.holdFrame, clip.value.heroFrames.length - 1);
  }
  return clipFrameIndex(clipElapsed.value, clip.value.heroFrames.length, clip.value.durationMs, clip.value.loop);
});
const heroFrame = computed(() => clip.value.heroFrames[frameIndex.value] ?? clip.value.heroFrames[0] ?? 0);
const celebrating = computed(() => rescueAction.value !== null);
const fill = computed(() => celebrating.value ? 1 : Math.min(1, props.state.progress / Math.max(1, props.state.target)));
const intensity = computed(() => animation.value.active?.intensity ?? 1);

watch(
  () => props.state.revision,
  () => {
    if (rescueAction.value) {
      animation.value = enqueueGameAction(animation.value, rescueAction.value, nowMs.value);
      return;
    }
    if (props.state.revision === 0 || (props.state.actionAt && nowMs.value - props.state.actionAt > 6_000)) {
      return;
    }
    animation.value = enqueueGameAction(animation.value, props.state.lastAction, nowMs.value);
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
  reducedMotion.value = Boolean(document.querySelector(".pack-reduced-motion"));
  const shell = document.querySelector(".overlay-shell");
  if (shell) {
    motionObserver = new MutationObserver(() => {
      reducedMotion.value = Boolean(document.querySelector(".pack-reduced-motion"));
    });
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

defineExpose({ action, heroFrame, frameIndex, celebrating, fill, clipElapsed, intensity });
</script>

<template>
  <slot
    :action="action"
    :hero-frame="heroFrame"
    :frame-index="frameIndex"
    :celebrating="celebrating"
    :fill="fill"
    :intensity="intensity"
    :clip-elapsed="clipElapsed"
  />
</template>
