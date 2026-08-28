<script setup lang="ts">
import { GARDEN_CLIPS, plantFrame, type GameThemeProgress } from "@duck-desk/shared";
import GamePlayback from "./GamePlayback.vue";
import GameHud from "./GameHud.vue";
import PixelSprite from "./PixelSprite.vue";

const props = defineProps<{ state: GameThemeProgress }>();
const asset = (name: string) => {
  const href = window.location.href;
  return new URL(`./game-themes-v2/moon-garden/${name}`, href.endsWith("/") ? href : `${href}/`).href;
};
const vineHeight = (fill: number) => 220 + Math.round(fill * 936);
</script>

<template>
  <GamePlayback :state="state" :clips="GARDEN_CLIPS" v-slot="{ action, heroFrame, celebrating, fill, frameIndex }">
    <div class="edge-game garden-v2" :data-action="action">
      <i
        class="garden-v2-vine garden-v2-vine-left"
        :style="{ backgroundImage: `url(${asset('vine.png')})`, height: `calc(${vineHeight(fill)} * var(--u))` }"
      />
      <i
        class="garden-v2-vine garden-v2-vine-right"
        :style="{ backgroundImage: `url(${asset('vine.png')})`, height: `calc(${vineHeight(fill)} * var(--u))` }"
      />
      <PixelSprite
        v-if="!celebrating"
        :src="asset('gardener.png')"
        :frame="heroFrame % 8"
        :frames="8"
        :frame-width="128"
        :frame-height="176"
        :x="948"
        :y="1288"
        :width="120"
        :height="168"
      />
      <i class="garden-v2-planter" :style="{ backgroundImage: `url(${asset('planter.png')})` }" />
      <PixelSprite
        v-for="index in 6"
        :key="index"
        :src="asset('plant.png')"
        :frame="plantFrame(fill, index - 1, 6)"
        :frames="6"
        :frame-width="128"
        :frame-height="240"
        :x="176 + (index - 1) * 120"
        :y="1456"
        :width="120"
        :height="230"
        cover-bottom
      />
      <PixelSprite
        v-for="bug in (action === 'share' || fill > 0.25 ? 3 : 0)"
        :key="`fly-${bug}`"
        :src="asset('firefly.png')"
        :frame="(frameIndex + bug) % 6"
        :frames="6"
        :frame-width="80"
        :frame-height="96"
        :x="168 + ((frameIndex + bug * 3) % 9) * 72"
        :y="240 + (bug % 2) * 36"
        :width="64"
        :height="72"
      />
      <i v-if="fill >= 0.8 || celebrating" class="garden-v2-arch" :style="{ backgroundImage: `url(${asset('arch.png')})` }" />
      <PixelSprite
        v-if="celebrating"
        :src="asset('moon-flower.png')"
        :frame="0"
        :frames="1"
        :frame-width="144"
        :frame-height="192"
        :x="948"
        :y="1268"
        :width="120"
        :height="168"
      />
      <GameHud noun="Moon" :level="state.level" objective="GROW THE GARDEN TO BLOOM." :progress="state.progress" :target="state.target" :won="celebrating" />
    </div>
  </GamePlayback>
</template>
