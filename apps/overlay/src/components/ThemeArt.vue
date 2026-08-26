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

  <div v-else-if="skin === 'solar_flare'" class="theme-art theme-art-solar" aria-hidden="true">
    <div class="solar-disc"><i /><i /><i /></div>
    <svg class="solar-rays" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <circle cx="540" cy="1940" r="390" />
      <path d="M540 1520V1360 M390 1552l-62-148 M690 1552l62-148 M270 1650l-120-94 M810 1650l120-94 M206 1794l-158-28 M874 1794l158-28" />
    </svg>
    <div class="solar-prominence"><i /><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'glacier_cavern'" class="theme-art theme-art-glacier" aria-hidden="true">
    <div class="glacier-mist" />
    <svg class="glacier-ice glacier-ice-top" viewBox="0 0 1080 260" preserveAspectRatio="none">
      <path d="M0 0H1080V44L1018 102 970 58 908 172 842 76 764 132 706 54 628 198 552 70 476 148 402 48 326 186 254 68 188 136 116 52 54 110 0 72Z" />
    </svg>
    <svg class="glacier-ice glacier-ice-bottom" viewBox="0 0 1080 220" preserveAspectRatio="none">
      <path d="M0 220H1080V176L1010 126 948 168 884 82 812 154 736 40 662 150 586 88 512 166 438 58 356 158 286 96 212 176 142 118 70 172 0 140Z" />
    </svg>
    <div class="glacier-snow"><i v-for="i in 14" :key="`snow-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'noir_detective'" class="theme-art theme-art-noir" aria-hidden="true">
    <div class="noir-spotlight" />
    <div class="noir-blinds" />
    <div class="noir-rain"><i v-for="i in 18" :key="`noir-rain-${i}`" :style="{ '--i': i }" /></div>
    <div class="noir-film"><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'retro_spaceport'" class="theme-art theme-art-spaceport" aria-hidden="true">
    <div class="spaceport-stars" />
    <svg class="spaceport-radar" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g transform="translate(540 1640)">
        <circle r="300" /><circle r="224" /><circle r="148" /><circle r="72" />
        <path d="M-330 0H330 M0-330V330 M-234-234l468 468 M234-234l-468 468" />
      </g>
    </svg>
    <div class="spaceport-sweep" />
    <div class="spaceport-beacons"><i /><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'royal_tournament'" class="theme-art theme-art-royal" aria-hidden="true">
    <div class="royal-velvet" />
    <svg class="royal-pennants" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path class="royal-cord" d="M0 240Q270 330 540 240T1080 240 M0 1680Q270 1590 540 1680T1080 1680" />
      <path class="royal-flag royal-flag-a" d="M92 268l92 22-58 126-74-82z M896 290l92-22 40 66-74 82z" />
      <path class="royal-flag royal-flag-b" d="M250 302l86 10-32 132-78-70z M744 312l86-10 24 72-78 70z" />
    </svg>
    <div class="royal-seal"><i /></div>
  </div>

  <div v-else-if="skin === 'desert_mirage'" class="theme-art theme-art-desert" aria-hidden="true">
    <div class="desert-sun" />
    <div class="desert-heat" />
    <svg class="desert-dunes" viewBox="0 0 1080 520" preserveAspectRatio="none">
      <path class="dune dune-back" d="M0 520V270Q190 96 420 274T820 226Q960 168 1080 238V520Z" />
      <path class="dune dune-mid" d="M0 520V350Q220 192 472 342T846 302Q970 260 1080 322V520Z" />
      <path class="dune dune-front" d="M0 520V420Q246 310 520 410T900 384Q1000 356 1080 404V520Z" />
    </svg>
  </div>

  <div v-else-if="skin === 'enchanted_forest'" class="theme-art theme-art-forest" aria-hidden="true">
    <div class="forest-canopy" />
    <svg class="forest-vines" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path d="M26 0C182 210-48 370 108 584S-20 918 126 1136-20 1502 94 1920" />
      <path d="M1054 0C898 210 1128 370 972 584s128 334-18 552 146 366 32 784" />
      <path d="M42 438q92-88 170-12 M1038 704q-98-92-184-18 M56 1260q96-78 168 8 M1024 1518q-90-84-174-2" />
    </svg>
    <div class="forest-fireflies"><i v-for="i in 12" :key="`firefly-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'steampunk_foundry'" class="theme-art theme-art-foundry" aria-hidden="true">
    <svg class="foundry-pipes" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path d="M0 430h118v180H44v286h74v180H0 M1080 430H962v180h74v286h-74v180h118" />
      <path d="M180 0v92h210V34h300v58h210V0 M180 1920v-92h210v58h300v-58h210v92" />
    </svg>
    <div class="foundry-gears"><i /><i /><i /><i /></div>
    <div class="foundry-steam"><i /><i /><i /></div>
    <div class="foundry-ember" />
  </div>

  <div v-else-if="skin === 'hologram_lab'" class="theme-art theme-art-hologram" aria-hidden="true">
    <div class="holo-grid" />
    <div class="holo-scan" />
    <svg class="holo-reticles" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g transform="translate(146 620)"><circle r="68" /><circle r="42" /><path d="M-92 0h38 M54 0h38 M0-92v38 M0 54v38" /></g>
      <g transform="translate(934 1260)"><circle r="68" /><circle r="42" /><path d="M-92 0h38 M54 0h38 M0-92v38 M0 54v38" /></g>
    </svg>
    <div class="holo-nodes"><i v-for="i in 8" :key="`holo-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'stained_glass'" class="theme-art theme-art-glass" aria-hidden="true">
    <svg class="glass-window" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path class="glass-lead" d="M0 0H1080V1920H0Z M76 76H1004V1844H76Z" fill-rule="evenodd" />
      <path class="glass-pane pane-a" d="M0 0h300L76 354 0 280Z M1080 0H780l224 354 76-74Z M0 1920h300L76 1566 0 1640Z M1080 1920H780l224-354 76 74Z" />
      <path class="glass-pane pane-b" d="M300 0h240L372 280 76 354Z M780 0H540l168 280 296 74Z M300 1920h240l-168-280-296-74Z M780 1920H540l168-280 296-74Z" />
      <path class="glass-pane pane-c" d="M0 280l76 74v390L0 620Z M1080 280l-76 74v390l76-124Z M0 1640l76-74v-390L0 1300Z M1080 1640l-76-74v-390l76 124Z" />
    </svg>
    <div class="glass-light" />
  </div>

  <div v-else-if="skin === 'paper_theater'" class="theme-art theme-art-paper" aria-hidden="true">
    <div class="paper-sun" />
    <div class="paper-layer paper-layer-back" />
    <div class="paper-layer paper-layer-mid" />
    <div class="paper-layer paper-layer-front" />
    <div class="paper-cloud"><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'midnight_library'" class="theme-art theme-art-library" aria-hidden="true">
    <div class="library-lamp" />
    <svg class="library-shelves" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path class="shelf-frame" d="M0 380h156v1180H0 M1080 380H924v1180h156" />
      <path class="shelf-line" d="M0 650h156 M0 920h156 M0 1190h156 M0 1460h156 M1080 650H924 M1080 920H924 M1080 1190H924 M1080 1460H924" />
      <path class="book-spines" d="M18 404v220 M42 404v220 M78 404v220 M112 404v220 M134 404v220 M946 674v220 M970 674v220 M1004 674v220 M1038 674v220 M18 944v220 M52 944v220 M86 944v220 M122 944v220 M946 1214v220 M980 1214v220 M1016 1214v220 M1042 1214v220" />
    </svg>
    <div class="library-dust"><i v-for="i in 10" :key="`dust-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'carnival_nights'" class="theme-art theme-art-carnival" aria-hidden="true">
    <div class="carnival-canopy" />
    <div class="carnival-bulbs"><i v-for="i in 18" :key="`bulb-${i}`" :style="{ '--i': i }" /></div>
    <svg class="carnival-wheel" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g transform="translate(900 1580)"><circle r="210" /><circle r="22" /><path d="M-210 0H210 M0-210V210 M-148-148l296 296 M148-148l-296 296" /></g>
    </svg>
    <div class="carnival-confetti"><i v-for="i in 12" :key="`c-confetti-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'moonlit_tide'" class="theme-art theme-art-moonlit" aria-hidden="true">
    <div class="moonlit-moon" />
    <div class="moonlit-reflection" />
    <svg class="moonlit-waves" viewBox="0 0 1080 420" preserveAspectRatio="none">
      <path class="moon-wave wave-back" d="M0 210Q135 102 270 210t270 0 270 0 270 0V420H0Z" />
      <path class="moon-wave wave-mid" d="M0 286Q135 164 270 286t270 0 270 0 270 0V420H0Z" />
      <path class="moon-wave wave-front" d="M0 350Q135 244 270 350t270 0 270 0 270 0V420H0Z" />
    </svg>
  </div>

  <div v-else-if="skin === 'koi_pond'" class="theme-art theme-art-koi" aria-hidden="true">
    <div class="koi-water" />
    <svg class="koi-ripples" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g transform="translate(170 520)"><ellipse rx="128" ry="54" /><ellipse rx="86" ry="36" /><ellipse rx="44" ry="18" /></g>
      <g transform="translate(900 1330)"><ellipse rx="138" ry="58" /><ellipse rx="92" ry="38" /><ellipse rx="48" ry="20" /></g>
    </svg>
    <svg class="koi-fish koi-fish-a" viewBox="0 0 180 90"><path d="M18 45C48 8 112 10 148 45C112 80 48 82 18 45Z" /><path d="M18 45L0 18V72Z" /><circle cx="126" cy="34" r="3" /></svg>
    <svg class="koi-fish koi-fish-b" viewBox="0 0 180 90"><path d="M18 45C48 8 112 10 148 45C112 80 48 82 18 45Z" /><path d="M18 45L0 18V72Z" /><circle cx="126" cy="34" r="3" /></svg>
    <div class="koi-leaves"><i /><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'crystal_cavern'" class="theme-art theme-art-crystal" aria-hidden="true">
    <div class="crystal-beam"><i /><i /><i /></div>
    <svg class="crystal-cluster crystal-cluster-left" viewBox="0 0 300 720" preserveAspectRatio="none">
      <path d="M0 720L18 280 86 64 132 316 190 0 224 348 286 122 300 720Z" />
      <path d="M18 280L132 316 190 0 224 348 286 122" />
    </svg>
    <svg class="crystal-cluster crystal-cluster-right" viewBox="0 0 300 720" preserveAspectRatio="none">
      <path d="M0 720L18 280 86 64 132 316 190 0 224 348 286 122 300 720Z" />
      <path d="M18 280L132 316 190 0 224 348 286 122" />
    </svg>
    <div class="crystal-sparks"><i v-for="i in 9" :key="`crystal-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'racing_grid'" class="theme-art theme-art-racing" aria-hidden="true">
    <div class="racing-asphalt" />
    <svg class="racing-track" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path class="track-edge" d="M94 0C284 360 36 620 198 960S62 1554 184 1920 M986 0C796 360 1044 620 882 960s136 594 14 960" />
      <path class="track-center" d="M540 0V1920" />
    </svg>
    <div class="racing-streaks"><i v-for="i in 8" :key="`race-${i}`" :style="{ '--i': i }" /></div>
    <div class="racing-checker" />
  </div>

  <div v-else-if="skin === 'wild_west'" class="theme-art theme-art-west" aria-hidden="true">
    <div class="west-sun" />
    <div class="west-mesa" />
    <svg class="west-rope" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path d="M54 360V140Q54 54 140 54H940Q1026 54 1026 140v220 M54 1560v220q0 86 86 86h800q86 0 86-86v-220" />
      <circle cx="54" cy="470" r="24" /><circle cx="1026" cy="470" r="24" /><circle cx="54" cy="1450" r="24" /><circle cx="1026" cy="1450" r="24" />
    </svg>
    <div class="west-dust"><i v-for="i in 10" :key="`west-dust-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'celestial_clockwork'" class="theme-art theme-art-celestial" aria-hidden="true">
    <div class="celestial-sky" />
    <svg class="celestial-orrery" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <g transform="translate(540 1500)">
        <ellipse rx="390" ry="172" /><ellipse rx="302" ry="128" /><ellipse rx="210" ry="88" /><circle r="44" />
        <circle class="orrery-planet planet-a" cx="390" r="17" /><circle class="orrery-planet planet-b" cx="-302" r="12" /><circle class="orrery-planet planet-c" cy="-88" r="9" />
      </g>
    </svg>
    <div class="celestial-gears"><i /><i /><i /></div>
  </div>

  <div v-else-if="skin === 'sakura_festival'" class="theme-art theme-art-sakura" aria-hidden="true">
    <div class="sakura-moon" />
    <svg class="sakura-gate" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path d="M54 360V96H1026V360 M112 96V42 M968 96V42 M22 42H1058 M76 80H1004 M54 1560v264h972v-264" />
    </svg>
    <div class="sakura-lanterns"><i /><i /><i /><i /></div>
    <div class="sakura-petals"><i v-for="i in 12" :key="`sakura-${i}`" :style="{ '--i': i }" /></div>
  </div>

  <div v-else-if="skin === 'sports_broadcast'" class="theme-art theme-art-sports" aria-hidden="true">
    <div class="sports-score-glow" />
    <svg class="sports-hash" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <path d="M0 1680 H1080 M0 1740 H1080 M0 1800 H1080" />
      <path d="M90 1640 V1880 M990 1640 V1880" />
    </svg>
  </div>

  <div v-else-if="skin === 'cyber_duck_city'" class="theme-art theme-art-city" aria-hidden="true">
    <div class="city-scan" />
    <svg class="city-skyline" viewBox="0 0 1080 240" preserveAspectRatio="none">
      <path d="M0 240 L0 150 L70 150 L70 90 L130 90 L130 160 L190 160 L190 70 L250 70 L250 130 L330 130 L330 40 L390 40 L390 120 L470 120 L470 80 L540 80 L540 150 L620 150 L620 60 L700 60 L700 140 L780 140 L780 50 L860 50 L860 110 L940 110 L940 160 L1080 160 L1080 240 Z" />
    </svg>
  </div>

  <div v-else-if="skin === 'luxury_nightclub'" class="theme-art theme-art-club" aria-hidden="true">
    <div class="club-wash" />
    <div class="club-spots">
      <i />
      <i />
      <i />
    </div>
  </div>
</template>
