<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  noun: string;
  level: number;
  objective: string;
  progress: number;
  target: number;
  won?: boolean;
  wonLabel?: string;
}>();

const label = computed(() => {
  if (!props.won) {
    return `${props.noun.toUpperCase()} ${props.level}/100`;
  }
  const cleared = props.level <= 1 ? 100 : props.level - 1;
  return props.wonLabel ?? `${props.noun.toUpperCase()} ${cleared} WON`;
});
</script>

<template>
  <div class="game-v2-hud" :class="{ 'game-v2-hud-won': won }">
    <span>{{ label }}</span>
    <strong>{{ won ? "LEVEL CLEAR" : objective }}</strong>
    <i class="game-v2-track"><b :style="{ width: won ? '100%' : `${Math.round((progress / Math.max(1, target)) * 100)}%` }" /></i>
    <em>{{ won ? "WON" : `${Math.round(progress)} / ${target}` }}</em>
  </div>
</template>
