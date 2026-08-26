<script setup lang="ts">
import type { OverlaySkin } from "@duck-desk/shared";

defineProps<{
  skin: OverlaySkin;
}>();

/*
 * Signature art per premium skin.
 *
 * The flame bands below are drawn silhouettes rather than noise filters. Two
 * bands with different tongue spacing are reused at four scales, so the inner
 * flames never trace the outer ones exactly. That irregularity is what makes
 * fire read as drawn instead of generated.
 *
 * Every tongue is a filled shape that tapers to a point, because a stroked
 * outline reads as a cartoon and a turbulence filter reads as smoke.
 */

const flameBandA = [
  "M-14 260 C-6 188 20 148 14 92 C40 138 54 186 62 260 Z",
  "M56 260 C68 176 98 124 92 58 C124 114 140 178 150 260 Z",
  "M142 260 C150 204 168 170 160 126 C184 162 198 208 206 260 Z",
  "M198 260 C214 164 248 104 236 30 C276 94 294 172 304 260 Z",
  "M294 260 C302 208 318 178 312 140 C332 174 346 214 352 260 Z",
  "M344 260 C360 172 390 118 380 50 C416 110 436 178 446 260 Z",
  "M438 260 C446 204 462 172 456 130 C478 166 492 212 498 260 Z",
  "M490 260 C506 158 542 96 528 20 C570 88 592 170 602 260 Z",
  "M592 260 C600 210 614 180 608 144 C628 178 642 216 648 260 Z",
  "M640 260 C656 168 688 112 678 44 C714 106 734 176 744 260 Z",
  "M736 260 C744 206 760 174 754 132 C776 168 790 212 796 260 Z",
  "M788 260 C804 162 838 100 826 26 C866 92 888 170 898 260 Z",
  "M890 260 C898 208 912 178 906 142 C926 176 940 214 946 260 Z",
  "M936 260 C952 174 980 122 974 56 C1006 114 1026 180 1036 260 Z",
  "M1028 260 C1036 204 1052 170 1046 126 C1070 164 1094 212 1094 260 Z"
];

const flameBandB = [
  "M-10 260 C4 180 34 130 26 66 C58 122 74 184 84 260 Z",
  "M78 260 C86 206 104 172 96 128 C122 166 136 210 144 260 Z",
  "M136 260 C152 166 184 108 172 36 C212 100 232 176 242 260 Z",
  "M234 260 C242 210 258 180 252 142 C272 176 286 214 292 260 Z",
  "M284 260 C298 174 328 120 320 54 C354 112 374 178 382 260 Z",
  "M376 260 C384 204 400 170 394 126 C418 164 432 208 438 260 Z",
  "M430 260 C446 160 482 98 470 22 C512 90 534 170 544 260 Z",
  "M536 260 C544 208 558 178 552 140 C572 174 586 212 592 260 Z",
  "M584 260 C600 170 630 114 622 46 C656 108 676 176 684 260 Z",
  "M678 260 C686 206 702 174 696 130 C718 168 732 212 740 260 Z",
  "M732 260 C748 164 782 102 770 28 C810 94 832 172 842 260 Z",
  "M834 260 C842 210 856 180 850 144 C870 178 884 216 890 260 Z",
  "M882 260 C898 172 928 118 920 52 C954 110 974 178 984 260 Z",
  "M976 260 C984 206 1000 172 994 128 C1018 166 1040 210 1048 260 Z",
  "M1042 260 C1052 194 1074 150 1068 100 C1086 146 1094 204 1094 260 Z"
];

/* Rain is placed by hand so the spacing never falls into a visible grid, and
   the near/far streaks are interleaved rather than sorted: long bright drops
   for the front of the shot, short dim ones for depth. */
const rainDrops = [
  { x: 2, delay: 0.13, dur: 0.7, len: 44, o: 0.5 },
  { x: 5, delay: 0.52, dur: 0.94, len: 72, o: 0.24 },
  { x: 8, delay: 0.28, dur: 0.78, len: 54, o: 0.42 },
  { x: 12, delay: 0.71, dur: 0.66, len: 38, o: 0.56 },
  { x: 15, delay: 0.06, dur: 0.88, len: 64, o: 0.3 },
  { x: 18, delay: 0.41, dur: 0.74, len: 48, o: 0.46 },
  { x: 22, delay: 0.19, dur: 0.98, len: 78, o: 0.22 },
  { x: 25, delay: 0.63, dur: 0.7, len: 42, o: 0.52 },
  { x: 28, delay: 0.35, dur: 0.84, len: 60, o: 0.34 },
  { x: 32, delay: 0.02, dur: 0.72, len: 46, o: 0.48 },
  { x: 35, delay: 0.57, dur: 0.9, len: 68, o: 0.26 },
  { x: 38, delay: 0.24, dur: 0.68, len: 40, o: 0.54 },
  { x: 42, delay: 0.79, dur: 0.8, len: 56, o: 0.36 },
  { x: 45, delay: 0.11, dur: 0.96, len: 74, o: 0.22 },
  { x: 48, delay: 0.46, dur: 0.7, len: 44, o: 0.5 },
  { x: 52, delay: 0.31, dur: 0.86, len: 62, o: 0.32 },
  { x: 55, delay: 0.68, dur: 0.74, len: 50, o: 0.44 },
  { x: 58, delay: 0.08, dur: 0.92, len: 70, o: 0.26 },
  { x: 62, delay: 0.54, dur: 0.66, len: 38, o: 0.56 },
  { x: 65, delay: 0.21, dur: 0.82, len: 58, o: 0.34 },
  { x: 68, delay: 0.74, dur: 0.72, len: 46, o: 0.48 },
  { x: 72, delay: 0.38, dur: 0.98, len: 76, o: 0.2 },
  { x: 75, delay: 0.04, dur: 0.76, len: 52, o: 0.44 },
  { x: 78, delay: 0.61, dur: 0.88, len: 66, o: 0.28 },
  { x: 82, delay: 0.27, dur: 0.68, len: 40, o: 0.54 },
  { x: 85, delay: 0.83, dur: 0.8, len: 56, o: 0.36 },
  { x: 88, delay: 0.16, dur: 0.94, len: 72, o: 0.24 },
  { x: 91, delay: 0.49, dur: 0.7, len: 44, o: 0.5 },
  { x: 94, delay: 0.33, dur: 0.84, len: 60, o: 0.32 },
  { x: 97, delay: 0.66, dur: 0.74, len: 48, o: 0.46 },
  { x: 99, delay: 0.14, dur: 0.9, len: 68, o: 0.26 }
];

/* Kelp is drawn as filled ribbons, not stroked outlines. Each frond has its
   own lean so a bank of them never reads as a cloned brush. */
const kelpLeft = [
  "M6 1920 C-10 1640 92 1420 18 1180 C110 960 -8 740 64 520 C8 310 96 150 22 0 L118 0 C168 150 86 310 142 520 C72 740 188 960 96 1180 C178 1420 58 1640 92 1920 Z",
  "M48 1920 C128 1700 10 1480 98 1260 C20 1040 140 820 52 600 C130 390 18 190 88 0 L176 0 C108 190 214 390 136 600 C222 820 104 1040 182 1260 C94 1480 212 1700 134 1920 Z",
  "M28 1920 C72 1718 4 1510 80 1300 C12 1090 96 880 36 670 C88 460 8 250 70 0 L148 0 C88 250 166 460 114 670 C174 880 90 1090 158 1300 C82 1510 150 1718 106 1920 Z"
];

const kelpRight = [
  "M214 1920 C230 1640 128 1420 202 1180 C110 960 228 740 156 520 C212 310 124 150 198 0 L102 0 C52 150 134 310 78 520 C148 740 32 960 124 1180 C42 1420 162 1640 128 1920 Z",
  "M172 1920 C92 1700 210 1480 122 1260 C200 1040 80 820 168 600 C90 390 202 190 132 0 L44 0 C112 190 6 390 84 600 C-2 820 116 1040 38 1260 C126 1480 8 1700 86 1920 Z",
  "M192 1920 C148 1718 216 1510 140 1300 C208 1090 124 880 184 670 C132 460 212 250 150 0 L72 0 C132 250 54 460 106 670 C46 880 130 1090 62 1300 C138 1510 70 1718 114 1920 Z"
];

const reefBubbles = [
  { x: 6, delay: 0.2, dur: 7.4, size: 7, o: 0.42 },
  { x: 11, delay: 2.1, dur: 9.1, size: 4, o: 0.28 },
  { x: 17, delay: 4.6, dur: 6.8, size: 9, o: 0.34 },
  { x: 82, delay: 1.3, dur: 8.2, size: 6, o: 0.36 },
  { x: 88, delay: 3.8, dur: 7.0, size: 5, o: 0.26 },
  { x: 93, delay: 0.7, dur: 9.6, size: 8, o: 0.4 },
  { x: 8, delay: 5.4, dur: 8.8, size: 3, o: 0.22 },
  { x: 91, delay: 6.1, dur: 7.6, size: 4, o: 0.3 }
];

/* Petals are placed by hand. A regular interval would read as a particle
   emitter, which is the look we are avoiding. */
const zenPetals = [
  { x: 6, delay: 0.4, dur: 13.2, size: 16, rot: 18 },
  { x: 14, delay: 4.1, dur: 11.6, size: 11, rot: -24 },
  { x: 22, delay: 7.8, dur: 14.4, size: 14, rot: 40 },
  { x: 31, delay: 1.6, dur: 12.1, size: 9, rot: -12 },
  { x: 44, delay: 9.2, dur: 15.0, size: 13, rot: 28 },
  { x: 58, delay: 3.3, dur: 12.8, size: 10, rot: -36 },
  { x: 67, delay: 6.5, dur: 13.7, size: 15, rot: 8 },
  { x: 76, delay: 0.9, dur: 11.9, size: 12, rot: -20 },
  { x: 84, delay: 8.4, dur: 14.1, size: 9, rot: 32 },
  { x: 91, delay: 2.7, dur: 12.4, size: 14, rot: -8 },
  { x: 11, delay: 11.0, dur: 13.5, size: 8, rot: 22 },
  { x: 88, delay: 5.6, dur: 14.8, size: 11, rot: -28 }
];

const auroraStars = [
  { x: 8, y: 7, r: 1.4, o: 0.7 },
  { x: 16, y: 13, r: 0.9, o: 0.4 },
  { x: 27, y: 5, r: 1.2, o: 0.55 },
  { x: 41, y: 11, r: 0.8, o: 0.35 },
  { x: 58, y: 6, r: 1.6, o: 0.62 },
  { x: 71, y: 14, r: 0.9, o: 0.38 },
  { x: 84, y: 8, r: 1.3, o: 0.5 },
  { x: 93, y: 12, r: 1.0, o: 0.44 }
];
</script>

<template>
  <div v-if="skin === 'inferno_ring'" class="theme-art theme-art-inferno" aria-hidden="true">
    <div class="inferno-heat" />

    <!-- Fire only rises, so there is a single band along the floor. Flames
         hung from the top or sides read as bunting, not as fire. The two
         bands are laid side by side to double the tongue count, which keeps
         each tongue narrow relative to its height. -->
    <svg class="inferno-band inferno-band-bottom" viewBox="0 0 2160 260" preserveAspectRatio="none">
      <!-- Each tongue is filled with its own root-to-tip gradient, because the
           gradients use the default objectBoundingBox units and so re-fit to
           every path. A flat fill gives a hard tip and reads as cut paper; a
           tip that fades out is what makes the shape read as flame. -->
      <defs>
        <linearGradient id="dd-flame-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#5e0d00" stop-opacity="1" />
          <stop offset="44%" stop-color="#8f1602" stop-opacity="0.96" />
          <stop offset="74%" stop-color="#bd2704" stop-opacity="0.52" />
          <stop offset="100%" stop-color="#d63a08" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="dd-flame-mid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#b82a03" stop-opacity="1" />
          <stop offset="46%" stop-color="#e04c08" stop-opacity="0.94" />
          <stop offset="76%" stop-color="#ff7212" stop-opacity="0.46" />
          <stop offset="100%" stop-color="#ff8c24" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="dd-flame-inner" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#ff7405" stop-opacity="1" />
          <stop offset="48%" stop-color="#ff941a" stop-opacity="0.9" />
          <stop offset="78%" stop-color="#ffae36" stop-opacity="0.42" />
          <stop offset="100%" stop-color="#ffc255" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="dd-flame-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#fff3d0" stop-opacity="0.98" />
          <stop offset="50%" stop-color="#ffdd8e" stop-opacity="0.86" />
          <stop offset="80%" stop-color="#ffc85e" stop-opacity="0.38" />
          <stop offset="100%" stop-color="#ffbe4a" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g class="flame-layer flame-outer">
        <path v-for="(d, i) in flameBandA" :key="`bo1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`bo2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-mid">
        <path v-for="(d, i) in flameBandB" :key="`bm1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`bm2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-inner">
        <path v-for="(d, i) in flameBandA" :key="`bi1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`bi2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-core">
        <path v-for="(d, i) in flameBandB" :key="`bc1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`bc2-${i}`" :d="d" />
        </g>
      </g>
    </svg>

    <!-- Fire climbing the side walls. Same drawn tongues as the floor band,
         rotated so they root on the vertical edge and lick inward, then masked
         so they burn out before the top. Fire that reached the ceiling at full
         strength would read as a border rather than as flame. -->
    <svg class="inferno-band inferno-band-left" viewBox="0 0 2160 260" preserveAspectRatio="none">
      <g class="flame-layer flame-outer">
        <path v-for="(d, i) in flameBandB" :key="`lo1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`lo2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-mid">
        <path v-for="(d, i) in flameBandA" :key="`lm1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`lm2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-inner">
        <path v-for="(d, i) in flameBandB" :key="`li1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`li2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-core">
        <path v-for="(d, i) in flameBandA" :key="`lc1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`lc2-${i}`" :d="d" />
        </g>
      </g>
    </svg>

    <svg class="inferno-band inferno-band-right" viewBox="0 0 2160 260" preserveAspectRatio="none">
      <g class="flame-layer flame-outer">
        <path v-for="(d, i) in flameBandA" :key="`ro1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`ro2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-mid">
        <path v-for="(d, i) in flameBandB" :key="`rm1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`rm2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-inner">
        <path v-for="(d, i) in flameBandA" :key="`ri1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandB" :key="`ri2-${i}`" :d="d" />
        </g>
      </g>
      <g class="flame-layer flame-core">
        <path v-for="(d, i) in flameBandB" :key="`rc1-${i}`" :d="d" />
        <g transform="translate(1080 0)">
          <path v-for="(d, i) in flameBandA" :key="`rc2-${i}`" :d="d" />
        </g>
      </g>
    </svg>

    <!-- The tongues would otherwise stand on nothing. The bed is the body of
         the fire their roots grow out of, and the ember line is the hot edge
         underneath it. Side beds weld the wall fire to the floor fire. -->
    <div class="inferno-bed" />
    <div class="inferno-side-bed inferno-side-bed-left" />
    <div class="inferno-side-bed inferno-side-bed-right" />
    <div class="inferno-ember-line" />
  </div>

  <div v-else-if="skin === 'storm_front'" class="theme-art theme-art-storm" aria-hidden="true">
    <div class="storm-cloudbank">
      <i />
      <i />
      <i />
    </div>
    <div class="storm-rain">
      <i
        v-for="(drop, i) in rainDrops"
        :key="`rain-${i}`"
        :style="{
          left: `${drop.x}%`,
          height: `${drop.len}px`,
          opacity: drop.o,
          animationDuration: `${drop.dur}s`,
          animationDelay: `${drop.delay}s`
        }"
      />
    </div>
    <div class="storm-flash" />

    <!-- A bolt is drawn four times over the same centre line: a wide soft
         halo, then three progressively thinner strokes trimmed to shorter
         fractions of the path. Stacking them tapers the channel from root to
         tip, which a single uniform stroke cannot do.

         Both bolts are kept inside the outer margins and their forks branch
         outward, because a strike across the middle of the canvas lands on the
         product the seller is holding up. -->
    <svg class="storm-strike storm-strike-main" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g class="bolt">
        <path
          class="bolt-halo"
          pathLength="1"
          d="M986 24 L952 132 L978 148 L940 256 L966 274 L926 388 L952 406 L912 522 L936 542 L898 656 L920 674 L886 782"
        />
        <path
          class="bolt-wide"
          pathLength="1"
          d="M986 24 L952 132 L978 148 L940 256 L966 274 L926 388 L952 406 L912 522 L936 542 L898 656 L920 674 L886 782"
        />
        <path
          class="bolt-mid"
          pathLength="1"
          d="M986 24 L952 132 L978 148 L940 256 L966 274 L926 388 L952 406 L912 522 L936 542 L898 656 L920 674 L886 782"
        />
        <path
          class="bolt-core"
          pathLength="1"
          d="M986 24 L952 132 L978 148 L940 256 L966 274 L926 388 L952 406 L912 522 L936 542 L898 656 L920 674 L886 782"
        />
        <path class="bolt-fork" d="M940 256 L1002 288 L1026 264" />
        <path class="bolt-fork" d="M912 522 L976 550 L1000 526" />
      </g>
    </svg>

    <svg class="storm-strike storm-strike-alt" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g class="bolt">
        <path
          class="bolt-halo"
          pathLength="1"
          d="M96 1146 L130 1250 L104 1266 L142 1370 L118 1386 L156 1492 L134 1508 L168 1610"
        />
        <path
          class="bolt-wide"
          pathLength="1"
          d="M96 1146 L130 1250 L104 1266 L142 1370 L118 1386 L156 1492 L134 1508 L168 1610"
        />
        <path
          class="bolt-mid"
          pathLength="1"
          d="M96 1146 L130 1250 L104 1266 L142 1370 L118 1386 L156 1492 L134 1508 L168 1610"
        />
        <path
          class="bolt-core"
          pathLength="1"
          d="M96 1146 L130 1250 L104 1266 L142 1370 L118 1386 L156 1492 L134 1508 L168 1610"
        />
        <path class="bolt-fork" d="M142 1370 L82 1398 L56 1374" />
      </g>
    </svg>
  </div>

  <div v-else-if="skin === 'deep_reef'" class="theme-art theme-art-reef" aria-hidden="true">
    <div class="reef-caustic">
      <i />
      <i />
      <i />
    </div>
    <svg class="reef-kelp reef-kelp-left" viewBox="0 0 220 1920" preserveAspectRatio="none">
      <path v-for="(d, i) in kelpLeft" :key="`kl-${i}`" :d="d" />
    </svg>
    <svg class="reef-kelp reef-kelp-right" viewBox="0 0 220 1920" preserveAspectRatio="none">
      <path v-for="(d, i) in kelpRight" :key="`kr-${i}`" :d="d" />
    </svg>
    <div class="reef-coral" />
    <i
      v-for="(b, i) in reefBubbles"
      :key="`bubble-${i}`"
      class="reef-bubble"
      :style="{
        left: `${b.x}%`,
        width: `${b.size}px`,
        height: `${b.size}px`,
        opacity: b.o,
        animationDuration: `${b.dur}s`,
        animationDelay: `${b.delay}s`
      }"
    />
  </div>

  <div v-else-if="skin === 'zen_garden'" class="theme-art theme-art-zen" aria-hidden="true">
    <div class="zen-wash" />
    <div class="zen-moon" />
    <i
      v-for="(p, i) in zenPetals"
      :key="`petal-${i}`"
      class="zen-petal"
      :style="{
        left: `${p.x}%`,
        width: `${p.size}px`,
        height: `${p.size * 0.72}px`,
        animationDuration: `${p.dur}s`,
        animationDelay: `${p.delay}s`,
        '--petal-rot': `${p.rot}deg`
      }"
    />
  </div>

  <div v-else-if="skin === 'vinyl_lounge'" class="theme-art theme-art-vinyl" aria-hidden="true">
    <div class="vinyl-haze" />
    <svg class="vinyl-grooves" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g class="vinyl-corner vinyl-tl">
        <path d="M36 300 A264 264 0 0 1 300 36" />
        <path d="M36 236 A200 200 0 0 1 236 36" />
        <path d="M36 178 A142 142 0 0 1 178 36" />
        <path d="M36 124 A88 88 0 0 1 124 36" />
      </g>
      <g class="vinyl-corner vinyl-tr">
        <path d="M780 36 A264 264 0 0 1 1044 300" />
        <path d="M844 36 A200 200 0 0 1 1044 236" />
        <path d="M902 36 A142 142 0 0 1 1044 178" />
        <path d="M956 36 A88 88 0 0 1 1044 124" />
      </g>
      <g class="vinyl-corner vinyl-bl">
        <path d="M300 1884 A264 264 0 0 1 36 1620" />
        <path d="M236 1884 A200 200 0 0 1 36 1684" />
        <path d="M178 1884 A142 142 0 0 1 36 1742" />
        <path d="M124 1884 A88 88 0 0 1 36 1796" />
      </g>
      <g class="vinyl-corner vinyl-br">
        <path d="M1044 1620 A264 264 0 0 1 780 1884" />
        <path d="M1044 1684 A200 200 0 0 1 844 1884" />
        <path d="M1044 1742 A142 142 0 0 1 902 1884" />
        <path d="M1044 1796 A88 88 0 0 1 956 1884" />
      </g>
    </svg>
    <div class="vinyl-dust">
      <i /><i /><i /><i /><i /><i />
    </div>
  </div>

  <div v-else-if="skin === 'blueprint_draft'" class="theme-art theme-art-draft" aria-hidden="true">
    <div class="draft-grid" />
    <svg class="draft-marks" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g class="draft-reg">
        <circle cx="48" cy="48" r="14" />
        <path d="M34 48 H62 M48 34 V62" />
        <circle cx="1032" cy="48" r="14" />
        <path d="M1018 48 H1046 M1032 34 V62" />
        <circle cx="48" cy="1872" r="14" />
        <path d="M34 1872 H62 M48 1858 V1886" />
        <circle cx="1032" cy="1872" r="14" />
        <path d="M1018 1872 H1046 M1032 1858 V1886" />
      </g>
      <path class="draft-dim" d="M80 80 H1000 M80 1840 H1000" />
    </svg>
  </div>

  <div v-else-if="skin === 'aurora_peaks'" class="theme-art theme-art-aurora" aria-hidden="true">
    <div class="aurora-sky">
      <i />
      <i />
      <i />
    </div>
    <svg class="aurora-stars" viewBox="0 0 100 40" preserveAspectRatio="none">
      <circle
        v-for="(s, i) in auroraStars"
        :key="`star-${i}`"
        :cx="s.x"
        :cy="s.y"
        :r="s.r"
        :opacity="s.o"
      />
    </svg>
    <svg class="aurora-ridge" viewBox="0 0 1080 280" preserveAspectRatio="none">
      <path
        d="M-20 280 L40 168 L128 214 L214 92 L318 156 L402 48 L510 128 L602 36 L698 118 L792 64 L886 142 L980 78 L1100 170 L1100 280 Z"
      />
    </svg>
  </div>
</template>
