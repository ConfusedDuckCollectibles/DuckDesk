<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  src: string;
  frame: number;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  coverBottom?: boolean;
}>();

const displayWidth = computed(() => props.width ?? props.frameWidth);
const displayHeight = computed(() => props.height ?? props.frameHeight);
const sheetHeight = computed(() => props.coverBottom ? Math.round(displayHeight.value * 1.45) : displayHeight.value);
const positionY = computed(() => props.coverBottom ? "bottom" : "0");
</script>

<template>
  <i
    class="pixel-sprite"
    :style="{
      left: x === undefined ? undefined : `calc(${x} * var(--u))`,
      top: y === undefined ? undefined : `calc(${y} * var(--u))`,
      width: `calc(${displayWidth} * var(--u))`,
      height: `calc(${displayHeight} * var(--u))`,
      backgroundImage: `url(${src})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `calc(${-Math.max(0, frame) * displayWidth} * var(--u)) ${positionY}`,
      backgroundSize: `calc(${frames * displayWidth} * var(--u)) calc(${sheetHeight} * var(--u))`
    }"
    aria-hidden="true"
  />
</template>
