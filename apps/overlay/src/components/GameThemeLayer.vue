<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { type GameCelebration, type GameThemeProgress } from "@duck-desk/shared";
import TowerTressesGame from "./TowerTressesGame.vue";
import StarshipRallyGame from "./StarshipRallyGame.vue";
import MoonGardenGame from "./MoonGardenGame.vue";
import CrystalQuestGame from "./CrystalQuestGame.vue";
import NeonGrandPrixGame from "./NeonGrandPrixGame.vue";

const props = defineProps<{
  state: GameThemeProgress;
}>();

const celebration = ref<GameCelebration>("none");
let celebrationTimer: number | undefined;
const layerStyle = computed(() => ({
  "--game-progress": String(Math.min(1, props.state.progress / Math.max(1, props.state.target))),
  "--game-progress-percent": `${Math.round((props.state.progress / Math.max(1, props.state.target)) * 100)}%`,
  "--game-level": String(props.state.level)
}));

watch(
  () => props.state.revision,
  () => {
    window.clearTimeout(celebrationTimer);
    const recent = props.state.celebrationAt !== undefined && Date.now() - props.state.celebrationAt < 6_000;
    celebration.value = recent ? props.state.celebration : "none";
    if (celebration.value !== "none") {
      celebrationTimer = window.setTimeout(() => {
        celebration.value = "none";
      }, celebration.value === "win" ? 3_800 : 1_800);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => window.clearTimeout(celebrationTimer));
</script>

<template>
  <section
    class="game-theme-layer"
    :class="[`game-${state.theme}`, `game-celebration-${celebration}`]"
    :style="layerStyle"
    aria-label="Audience game progress"
  >
    <TowerTressesGame v-if="state.theme === 'game_tower_tresses'" :state="state" />
    <StarshipRallyGame v-else-if="state.theme === 'game_starship_rally'" :state="state" />
    <MoonGardenGame v-else-if="state.theme === 'game_moon_garden'" :state="state" />
    <CrystalQuestGame v-else-if="state.theme === 'game_crystal_quest'" :state="state" />
    <NeonGrandPrixGame v-else :state="state" />
  </section>
</template>
