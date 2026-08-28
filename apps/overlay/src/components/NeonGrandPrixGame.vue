<script setup lang="ts">
import { RACE_CLIPS, RACE_PATH, lanePoint, type GameThemeProgress } from "@duck-desk/shared";
import GamePlayback from "./GamePlayback.vue";
import GameHud from "./GameHud.vue";
import PixelSprite from "./PixelSprite.vue";

const props = defineProps<{ state: GameThemeProgress }>();
const asset = (name: string) => {
  const href = window.location.href;
  return new URL(`./game-themes-v2/neon-grand-prix/${name}`, href.endsWith("/") ? href : `${href}/`).href;
};
const carBox = (fill: number) => lanePoint(fill, RACE_PATH);
const boosting = (action: string) => action === "sale" || action === "tip" || action === "level_up" || action === "win";
</script>

<template>
  <GamePlayback :state="state" :clips="RACE_CLIPS" v-slot="{ action, heroFrame, celebrating, fill, frameIndex }">
    <div class="edge-game race-v2" :data-action="action">
      <i class="race-v2-rail race-v2-rail-left" :style="{ backgroundImage: `url(${asset('road.png')})` }" />
      <i class="race-v2-road" :style="{ backgroundImage: `url(${asset('road.png')})` }" />
      <i class="race-v2-finish" :class="{ lit: fill >= 0.85 || celebrating }" :style="{ backgroundImage: `url(${asset('finish.png')})` }" />
      <PixelSprite
        class="race-v2-car"
        :src="boosting(action) ? asset('boost.png') : asset('car.png')"
        :frame="boosting(action) ? (celebrating ? 3 : Math.min(5, heroFrame % 6)) : (heroFrame % 7)"
        :frames="boosting(action) ? 6 : 7"
        :frame-width="boosting(action) ? 160 : 144"
        :frame-height="boosting(action) ? 80 : 64"
        :x="carBox(fill).x"
        :y="carBox(fill).y"
        :width="128"
        :height="56"
      />
      <PixelSprite
        v-if="action === 'share' || action === 'audience' || fill > 0.4"
        :src="asset('drone.png')"
        :frame="frameIndex % 4"
        :frames="4"
        :frame-width="80"
        :frame-height="80"
        :x="180 + ((frameIndex % 9) * 76)"
        :y="236"
        :width="64"
        :height="64"
      />
      <PixelSprite
        v-if="action === 'tip' || action === 'audience'"
        :src="asset('crew.png')"
        :frame="frameIndex % 4"
        :frames="4"
        :frame-width="96"
        :frame-height="128"
        :x="16"
        :y="1472"
        :width="80"
        :height="112"
      />
      <GameHud noun="Lap" :level="state.level" objective="RACE THE CIRCUIT TO THE GANTRY." :progress="state.progress" :target="state.target" :won="celebrating" />
    </div>
  </GamePlayback>
</template>
