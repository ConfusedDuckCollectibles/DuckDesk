<script setup lang="ts">
import { STARSHIP_CLIPS, STARSHIP_PATH, lanePoint, type GameThemeProgress } from "@duck-desk/shared";
import GamePlayback from "./GamePlayback.vue";
import GameHud from "./GameHud.vue";
import PixelSprite from "./PixelSprite.vue";

const props = defineProps<{ state: GameThemeProgress }>();
const asset = (name: string) => {
  const href = window.location.href;
  return new URL(`./game-themes-v2/starship-rally/${name}`, href.endsWith("/") ? href : `${href}/`).href;
};
const shipBox = (fill: number) => lanePoint(fill, STARSHIP_PATH);
const fuelCount = (fill: number) => Math.max(0, Math.round(fill * 5));
const shipFrame = (action: string, frameIndex: number) => {
  if (action === "sale" || action === "level_up" || action === "win") {
    return 3 + (frameIndex % 3);
  }
  if (action === "bid" || action === "tip") {
    return 2 + (frameIndex % 3);
  }
  return frameIndex % 3;
};
const thrustFrame = (action: string, frameIndex: number) => {
  if (action === "sale" || action === "level_up" || action === "win") {
    return 4 + (frameIndex % 2 === 0 ? 0 : 1);
  }
  if (action === "bid" || action === "tip") {
    return 2 + (frameIndex % 3);
  }
  return frameIndex % 3;
};
</script>

<template>
  <GamePlayback :state="state" :clips="STARSHIP_CLIPS" v-slot="{ action, heroFrame, celebrating, fill, frameIndex }">
    <div class="edge-game starship-v2" :data-action="action">
      <i class="starship-v2-station" :style="{ backgroundImage: `url(${asset('station.png')})` }" />
      <PixelSprite
        :src="asset('pilot.png')"
        :frame="heroFrame % 8"
        :frames="8"
        :frame-width="96"
        :frame-height="128"
        :x="12"
        :y="1388"
        :width="96"
        :height="160"
      />
      <div class="starship-v2-fuel">
        <PixelSprite
          v-for="cell in 5"
          :key="cell"
          :src="asset('satellite.png')"
          :frame="cell <= fuelCount(fill) ? Math.min(4, cell - 1) : 0"
          :frames="5"
          :frame-width="64"
          :frame-height="96"
          :x="18"
          :y="640 + (cell - 1) * 72"
          :width="40"
          :height="56"
        />
      </div>
      <PixelSprite
        :src="asset('fuel.png')"
        :frame="Math.min(5, thrustFrame(action, frameIndex))"
        :frames="6"
        :frame-width="56"
        :frame-height="80"
        :x="shipBox(fill).x - 28"
        :y="shipBox(fill).y + 8"
        :width="40"
        :height="48"
      />
      <PixelSprite
        class="starship-v2-ship"
        :src="asset('ship.png')"
        :frame="Math.min(5, shipFrame(action, frameIndex))"
        :frames="6"
        :frame-width="176"
        :frame-height="96"
        :x="shipBox(fill).x"
        :y="shipBox(fill).y"
        :width="120"
        :height="64"
      />
      <PixelSprite
        v-for="beacon in 2"
        :key="`beacon-${beacon}`"
        :src="asset('fuel.png')"
        :frame="Math.min(5, 3 + beacon + (frameIndex % 2))"
        :frames="6"
        :frame-width="56"
        :frame-height="80"
        :x="992"
        :y="1572 + (beacon - 1) * 20"
        :width="40"
        :height="48"
      />
      <PixelSprite
        v-if="action === 'share' || fill > 0.35"
        :src="asset('satellite.png')"
        :frame="frameIndex % 5"
        :frames="5"
        :frame-width="64"
        :frame-height="96"
        :x="200 + ((frameIndex % 10) * 64)"
        :y="236"
        :width="48"
        :height="64"
      />
      <GameHud noun="Orbit" :level="state.level" objective="FUEL THE SHIP. DOCK THE LANE." :progress="state.progress" :target="state.target" :won="celebrating" />
    </div>
  </GamePlayback>
</template>
