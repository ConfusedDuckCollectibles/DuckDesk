<script setup lang="ts">
import { CRYSTAL_CLIPS, cartFrame, cartX, type GameThemeProgress } from "@duck-desk/shared";
import GamePlayback from "./GamePlayback.vue";
import GameHud from "./GameHud.vue";
import PixelSprite from "./PixelSprite.vue";

const props = defineProps<{ state: GameThemeProgress }>();
const asset = (name: string) => {
  const href = window.location.href;
  return new URL(`./game-themes-v2/crystal-quest/${name}`, href.endsWith("/") ? href : `${href}/`).href;
};
const cartBob = (action: string, frameIndex: number) => (
  action === "bid" || action === "sale" || action === "tip" ? ((frameIndex % 3) - 1) * 4 : 0
);
</script>

<template>
  <GamePlayback :state="state" :clips="CRYSTAL_CLIPS" v-slot="{ action, heroFrame, celebrating, fill, frameIndex }">
    <div class="edge-game crystal-v2" :data-action="action">
      <i class="crystal-v2-wall crystal-v2-wall-left" :style="{ backgroundImage: `url(${asset('cave-wall.png')})` }" />
      <i class="crystal-v2-wall crystal-v2-wall-right" :style="{ backgroundImage: `url(${asset('cave-wall.png')})` }" />
      <i class="crystal-v2-track" :style="{ backgroundImage: `url(${asset('track.png')})` }" />
      <PixelSprite
        :src="asset('explorer.png')"
        :frame="heroFrame % 8"
        :frames="8"
        :frame-width="96"
        :frame-height="128"
        :x="8"
        :y="1504"
        :width="96"
        :height="128"
      />
      <PixelSprite
        v-if="action === 'bid' || action === 'sale'"
        :src="asset('swing.png')"
        :frame="Math.min(5, frameIndex % 6)"
        :frames="6"
        :frame-width="96"
        :frame-height="128"
        :x="72"
        :y="1504"
        :width="96"
        :height="128"
      />
      <PixelSprite
        :src="asset('cart.png')"
        :frame="cartFrame(fill, 4)"
        :frames="4"
        :frame-width="160"
        :frame-height="144"
        :x="cartX(fill) + cartBob(action, frameIndex)"
        :y="1548"
        :width="120"
        :height="96"
      />
      <PixelSprite
        :src="asset('door.png')"
        :frame="celebrating ? 3 : cartFrame(fill, 4)"
        :frames="4"
        :frame-width="160"
        :frame-height="112"
        :x="936"
        :y="1508"
        :width="136"
        :height="160"
      />
      <PixelSprite
        v-for="shard in 3"
        :key="`gem-${shard}`"
        v-show="fill >= shard * 0.28"
        :src="asset('gem.png')"
        :frame="1 + ((frameIndex + shard) % 3)"
        :frames="5"
        :frame-width="64"
        :frame-height="64"
        :x="200 + shard * 180"
        :y="1568"
        :width="40"
        :height="40"
      />
      <PixelSprite
        v-if="action === 'sale'"
        :src="asset('gem.png')"
        :frame="4"
        :frames="5"
        :frame-width="64"
        :frame-height="64"
        :x="cartX(fill) + 36"
        :y="1512"
        :width="48"
        :height="48"
      />
      <PixelSprite
        v-if="action === 'share' || celebrating"
        :src="asset('bat.png')"
        :frame="frameIndex % 5"
        :frames="5"
        :frame-width="48"
        :frame-height="64"
        :x="180 + ((frameIndex % 8) * 88)"
        :y="248"
        :width="56"
        :height="56"
      />
      <GameHud noun="Depth" :level="state.level" objective="FILL THE CART. OPEN THE CHAMBER." :progress="state.progress" :target="state.target" :won="celebrating" />
    </div>
  </GamePlayback>
</template>
