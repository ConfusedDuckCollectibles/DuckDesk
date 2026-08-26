<script setup lang="ts">
import { computed } from "vue";
import type { OverlaySkin } from "@duck-desk/shared";

const props = defineProps<{
  skin: OverlaySkin;
}>();

const premiumSkins: ReadonlySet<OverlaySkin> = new Set([
  "storm_front",
  "cyber_duck_city",
  "treasure_vault",
  "boss_battle",
  "cosmic_auction",
  "haunted_drop",
  "sports_broadcast",
  "anime_powerup",
  "candy_rush",
  "luxury_nightclub",
  "inferno_ring"
]);

const isPremium = computed(() => premiumSkins.has(props.skin));
</script>

<template>
  <div class="broadcast-frame" aria-hidden="true">
    <svg class="broadcast-frame-svg" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <defs>
        <linearGradient id="inferno-fire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff7bf" />
          <stop offset="0.22" stop-color="#ffd25a" />
          <stop offset="0.52" stop-color="#ff6a18" />
          <stop offset="0.82" stop-color="#e51a0b" />
          <stop offset="1" stop-color="#5a0703" stop-opacity="0.2" />
        </linearGradient>
        <linearGradient id="inferno-molten" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5c1005" />
          <stop offset="0.18" stop-color="#ff5b12" />
          <stop offset="0.5" stop-color="#fff0a1" />
          <stop offset="0.72" stop-color="#ff8b22" />
          <stop offset="1" stop-color="#5c1005" />
        </linearGradient>
        <filter id="inferno-fluid" x="-20%" y="-70%" width="140%" height="240%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.034" numOctaves="2" seed="17" result="noise">
            <animate attributeName="baseFrequency" dur="2.8s" values="0.008 0.034;0.012 0.052;0.007 0.038" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G" result="distorted" />
          <feGaussianBlur in="distorted" stdDeviation="1.1" result="soft" />
          <feMerge><feMergeNode in="soft" /><feMergeNode in="distorted" /></feMerge>
        </filter>
        <filter id="inferno-glow" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="storm-glow" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="8" result="bolt-blur" />
          <feMerge><feMergeNode in="bolt-blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="cosmic-orbit-glow">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.28" stop-color="#75e8ff" />
          <stop offset="1" stop-color="#8f67ff" stop-opacity="0" />
        </radialGradient>
        <path
          id="inferno-flame-ribbon"
          d="M0 0H1000V16 C976 6 960 58 930 22 C913 2 894 86 863 30 C845 0 825 72 796 25 C777 0 750 101 716 34 C695 2 676 70 646 24 C625 0 603 93 570 30 C548 2 525 80 494 25 C472 0 451 103 416 32 C392 3 369 79 338 24 C312 0 293 91 258 28 C235 2 211 73 181 22 C153 1 136 94 100 28 C77 3 53 72 24 20 C14 7 8 5 0 0Z"
        />
      </defs>

      <g v-if="!isPremium" class="frame-geometry-standard">
        <g class="frame-structure">
          <path class="frame-shadow" d="M24 232V24h210 M846 24h210v208 M24 1680v216h256 M800 1896h256v-216" />
          <path class="frame-keyline" d="M26 218V26h198 M856 26h198v192 M26 1694v200h242 M812 1894h242v-200" />
          <path class="frame-inner" d="M40 276V92l52-52h166 M822 40h166l52 52v184 M40 1642v186l52 52h202 M786 1880h202l52-52v-186" />
        </g>
        <g class="frame-hardware">
          <path d="M18 92h22l52-52V18H18z" /><path d="M1062 92h-22l-52-52V18h74z" />
          <path d="M18 1828h22l52 52v22H18z" /><path d="M1062 1828h-22l-52 52v22h74z" />
        </g>
        <g class="frame-ticks">
          <path d="M24 370h34 M24 402h18 M24 742h34 M24 774h18 M24 1146h34 M24 1178h18 M24 1518h34 M24 1550h18" />
          <path d="M1056 370h-34 M1056 402h-18 M1056 742h-34 M1056 774h-18 M1056 1146h-34 M1056 1178h-18 M1056 1518h-34 M1056 1550h-18" />
        </g>
        <path class="frame-signal frame-signal-left" d="M40 1620V300" /><path class="frame-signal frame-signal-right" d="M1040 300v1320" /><path class="frame-signal frame-signal-bottom" d="M314 1880h452" />
      </g>

      <g v-if="skin === 'storm_front'" class="premium-geometry geometry-storm">
        <path class="storm-metal" d="M28 306V118l86-86h238 M728 32h238l86 86v188 M28 1610v192l84 86h278 M690 1888h278l84-86v-192" />
        <path class="storm-conductor" d="M43 344V148l82-82h178 M777 66h178l82 82v196 M43 1574v198l80 82h222 M735 1854h220l82-82v-198" />
        <path class="storm-bus" d="M28 524h54 M28 812h82 M28 1100h54 M28 1388h82 M1052 524h-54 M1052 812h-82 M1052 1100h-54 M1052 1388h-82" />
        <g class="storm-insulators"><circle cx="43" cy="434" r="9" /><circle cx="43" cy="1486" r="9" /><circle cx="1037" cy="434" r="9" /><circle cx="1037" cy="1486" r="9" /></g>
        <g class="storm-lightning storm-lightning-a" filter="url(#storm-glow)">
          <path pathLength="1" d="M1004 -20 L966 68 L979 103 L926 164 L937 202 L860 292 L873 336 L804 414" />
          <path pathLength="1" d="M968 70 L910 90 L871 137 L826 151" /><path pathLength="1" d="M928 163 L884 181 L851 230 L801 249" /><path pathLength="1" d="M861 292 L811 306 L775 352" />
        </g>
        <g class="storm-lightning storm-lightning-b" filter="url(#storm-glow)">
          <path pathLength="1" d="M10 1322 L62 1367 L43 1412 L119 1464 L101 1518 L184 1572" /><path pathLength="1" d="M62 1367 L112 1352 L153 1371" /><path pathLength="1" d="M119 1464 L169 1445 L215 1460" />
        </g>
      </g>

      <g v-if="skin === 'cyber_duck_city'" class="premium-geometry geometry-cyber">
        <path class="cyber-shell" d="M22 286V82h48l54-54h238 M718 28h238l54 54h48v204 M22 1632v206h48l54 54h250 M706 1892h250l54-54h48v-206" />
        <path class="cyber-trace" pathLength="1" d="M38 348V128h86l42-42h224 M690 86h224l42 42h86v220 M38 1572v220h86l42 42h224 M690 1834h224l42-42h86v-220" />
        <path class="cyber-trace cyber-trace-alt" pathLength="1" d="M22 514h74l28-28h92 M22 792h118l30 30h88 M22 1088h92l38-38h98 M22 1384h72l32 32h110 M1058 514h-74l-28-28h-92 M1058 792H940l-30 30h-88 M1058 1088h-92l-38-38h-98 M1058 1384h-72l-32 32h-110" />
        <g class="cyber-nodes"><rect x="112" y="72" width="18" height="18" /><rect x="950" y="72" width="18" height="18" /><rect x="112" y="1830" width="18" height="18" /><rect x="950" y="1830" width="18" height="18" /><circle cx="124" cy="486" r="8" /><circle cx="956" cy="486" r="8" /><circle cx="150" cy="1050" r="8" /><circle cx="930" cy="1050" r="8" /></g>
      </g>

      <g v-if="skin === 'treasure_vault'" class="premium-geometry geometry-vault">
        <path class="vault-heavy" d="M34 326V104l70-70h260 M716 34h260l70 70v222 M34 1594v222l70 70h260 M716 1886h260l70-70v-222" />
        <path class="vault-inlay" d="M54 344V142l88-88h204 M734 54h204l88 88v202 M54 1576v202l88 88h204 M734 1866h204l88-88v-202" />
        <path class="vault-deco" d="M382 34h316 M438 54h204 M480 74h120 M382 1886h316 M438 1866h204 M480 1846h120" />
        <g class="vault-locks">
          <g transform="translate(54 556)"><circle r="24" /><circle r="10" /><path d="M0-34v12 M0 22v12 M-34 0h12 M22 0h12" /></g><g transform="translate(1026 556)"><circle r="24" /><circle r="10" /><path d="M0-34v12 M0 22v12 M-34 0h12 M22 0h12" /></g>
          <g transform="translate(54 1364)"><circle r="24" /><circle r="10" /><path d="M0-34v12 M0 22v12 M-34 0h12 M22 0h12" /></g><g transform="translate(1026 1364)"><circle r="24" /><circle r="10" /><path d="M0-34v12 M0 22v12 M-34 0h12 M22 0h12" /></g>
        </g>
      </g>

      <g v-if="skin === 'boss_battle'" class="premium-geometry geometry-boss">
        <path class="boss-blocks" d="M22 310V102h34V68h34V34h278 M712 34h278v34h34v34h34v208 M22 1610v208h34v34h34v34h278 M712 1886h278v-34h34v-34h34v-208" />
        <path class="boss-health" pathLength="1" d="M106 54h300 M674 54h300 M106 1866h300 M674 1866h300" />
        <path class="boss-pixel-rail" d="M42 386h24v72H42z M42 554h24v126H42z M42 776h24v210H42z M42 1082h24v210H42z M42 1388h24v146H42z M1014 386h24v72h-24z M1014 554h24v126h-24z M1014 776h24v210h-24z M1014 1082h24v210h-24z M1014 1388h24v146h-24z" />
        <g class="boss-corners"><rect x="86" y="86" width="40" height="40" /><rect x="954" y="86" width="40" height="40" /><rect x="86" y="1794" width="40" height="40" /><rect x="954" y="1794" width="40" height="40" /></g>
      </g>

      <g v-if="skin === 'cosmic_auction'" class="premium-geometry geometry-cosmic">
        <path class="cosmic-arc" d="M42 344C24 168 152 38 356 26 M724 26c204 12 332 142 314 318 M42 1576c-18 176 110 306 314 318 M724 1894c204-12 332-142 314-318" />
        <path class="cosmic-inner-orbit" pathLength="1" d="M56 394C12 176 164 56 400 52 M680 52c236 4 388 124 344 342 M56 1526c-44 218 108 338 344 342 M680 1868c236-4 388-124 344-342" />
        <ellipse class="cosmic-ring cosmic-ring-top" cx="540" cy="48" rx="232" ry="27" /><ellipse class="cosmic-ring cosmic-ring-bottom" cx="540" cy="1872" rx="232" ry="27" />
        <g class="cosmic-planets"><circle cx="56" cy="536" r="9" /><circle cx="1024" cy="752" r="6" /><circle cx="56" cy="1190" r="6" /><circle cx="1024" cy="1446" r="9" /><circle cx="182" cy="1858" r="4" /><circle cx="900" cy="62" r="4" /></g>
      </g>

      <g v-if="skin === 'haunted_drop'" class="premium-geometry geometry-haunted">
        <path class="haunted-arch" d="M34 360V164Q34 74 126 34H338 M742 34h212q92 40 92 130v196 M34 1560v196q0 90 92 130h212 M742 1886h212q92-40 92-130v-196" />
        <path class="haunted-spine" d="M54 420V218l52-66 26 30 28-70 28 70 28-30 52 66 M812 218l52-66 28 30 28-70 28 70 26-30 52 66v202 M54 1500v202l52 66 26-30 28 70 28-70 28 30 52-66 M812 1702l52 66 28-30 28 70 28-70 26 30 52-66v-202" />
        <path class="haunted-vine" pathLength="1" d="M34 524q84 70 0 144t0 144t0 144t0 144t0 144t0 144 M1046 524q-84 70 0 144t0 144t0 144t0 144t0 144t0 144" />
        <g class="haunted-finials"><path d="M304 34l24-30 24 30-24 38z" /><path d="M728 34l24-30 24 30-24 38z" /><path d="M304 1886l24 30 24-30-24-38z" /><path d="M728 1886l24 30 24-30-24-38z" /></g>
      </g>

      <g v-if="skin === 'sports_broadcast'" class="premium-geometry geometry-sports">
        <path class="sports-swoop sports-swoop-a" d="M18 330V130L118 28H462 M618 28h344l100 102v200 M18 1590v200l100 102h344 M618 1892h344l100-102v-200" />
        <path class="sports-swoop sports-swoop-b" d="M42 350V170L158 52h260 M662 52h260l116 118v180 M42 1570v180l116 118h260 M662 1868h260l116-118v-180" />
        <path class="sports-speed" d="M18 468h126l44-36h196 M1062 468H936l-44-36H696 M18 1452h126l44 36h196 M1062 1452H936l-44 36H696" />
        <g class="sports-score-pips"><path d="M28 620h42l16 16-16 16H28z M28 704h68l16 16-16 16H28z M28 788h42l16 16-16 16H28z" /><path d="M1052 1132h-42l-16 16 16 16h42z M1052 1216h-68l-16 16 16 16h68z M1052 1300h-42l-16 16 16 16h42z" /></g>
      </g>

      <g v-if="skin === 'anime_powerup'" class="premium-geometry geometry-anime">
        <path class="anime-slash anime-slash-a" d="M20 338V126L154 20H410 M670 20h256l134 106v212 M20 1582v212l134 106h256 M670 1900h256l134-106v-212" />
        <path class="anime-slash anime-slash-b" d="M48 386V176L190 48h174 M716 48h174l142 128v210 M48 1534v210l142 128h174 M716 1872h174l142-128v-210" />
        <path class="anime-speedline" pathLength="1" d="M20 480h168l94-74 M20 548h116l122-94 M20 616h72l146-112 M1060 1304H892l-94 74 M1060 1372H944l-122 94 M1060 1440h-72l-146 112" />
        <g class="anime-shards"><path d="M104 744l64-38-42 76z M70 858l88-24-70 62z M976 1062l-64 38 42-76z M1010 1176l-88 24 70-62z" /></g>
      </g>

      <g v-if="skin === 'candy_rush'" class="premium-geometry geometry-candy">
        <path class="candy-ribbon" d="M38 340V120q0-82 82-82h228 M732 38h228q82 0 82 82v220 M38 1580v220q0 82 82 82h228 M732 1882h228q82 0 82-82v-220" />
        <path class="candy-twist" pathLength="1" d="M58 394V174Q58 64 168 64h222 M690 64h222q110 0 110 110v220 M58 1526v220q0 110 110 110h222 M690 1856h222q110 0 110-110v-220" />
        <g class="candy-drops"><circle cx="58" cy="492" r="18" /><circle cx="58" cy="646" r="11" /><circle cx="58" cy="800" r="18" /><circle cx="58" cy="954" r="11" /><circle cx="58" cy="1108" r="18" /><circle cx="58" cy="1262" r="11" /><circle cx="58" cy="1416" r="18" /><circle cx="1022" cy="492" r="11" /><circle cx="1022" cy="646" r="18" /><circle cx="1022" cy="800" r="11" /><circle cx="1022" cy="954" r="18" /><circle cx="1022" cy="1108" r="11" /><circle cx="1022" cy="1262" r="18" /><circle cx="1022" cy="1416" r="11" /></g>
      </g>

      <g v-if="skin === 'luxury_nightclub'" class="premium-geometry geometry-club">
        <path class="club-deco" d="M26 328V126L126 26H378 M702 26h252l100 100v202 M26 1592v202l100 100h252 M702 1894h252l100-100v-202" />
        <path class="club-fan" d="M396 26l72 38 72-38 72 38 72-38 M396 1894l72-38 72 38 72-38 72 38" />
        <path class="club-columns" d="M48 386v168l20 30-20 30v276l20 30-20 30v276l20 30-20 30v168 M1032 386v168l-20 30 20 30v276l-20 30 20 30v276l-20 30 20 30v168" />
        <g class="club-diamonds"><path d="M48 232l22 34-22 34-22-34z M1032 232l22 34-22 34-22-34z M48 1620l22 34-22 34-22-34z M1032 1620l22 34-22 34-22-34z" /></g>
      </g>

      <g v-if="skin === 'inferno_ring'" class="premium-geometry geometry-inferno">
        <path class="inferno-forge" d="M24 350V116l92-92h270 M694 24h270l92 92v234 M24 1570v234l92 92h270 M694 1896h270l92-92v-234" />
        <path class="inferno-forge-inner" d="M48 388V164L164 48h178 M738 48h178l116 116v224 M48 1532v224l116 116h178 M738 1872h178l116-116v-224" />
        <path class="inferno-molten-rail" pathLength="1" d="M116 34h300 M664 34h300 M116 1886h300 M664 1886h300 M34 416v1088 M1046 416v1088" />
        <g class="inferno-fire-bands" filter="url(#inferno-fluid)">
          <use href="#inferno-flame-ribbon" transform="translate(40 14)" /><use href="#inferno-flame-ribbon" transform="translate(1040 1906) rotate(180)" />
          <use href="#inferno-flame-ribbon" transform="matrix(0 1.48 1 0 14 220)" /><use href="#inferno-flame-ribbon" transform="matrix(0 1.48 -1 0 1066 220)" />
        </g>
        <g class="inferno-embers" filter="url(#inferno-glow)"><circle cx="92" cy="498" r="5" /><circle cx="58" cy="724" r="3" /><circle cx="96" cy="1038" r="4" /><circle cx="61" cy="1342" r="5" /><circle cx="988" cy="578" r="4" /><circle cx="1022" cy="862" r="5" /><circle cx="986" cy="1174" r="3" /><circle cx="1020" cy="1442" r="4" /></g>
      </g>
    </svg>

    <div v-if="!isPremium" class="frame-status frame-status-left"><span /><span /><span /></div>
    <div v-if="!isPremium" class="frame-status frame-status-right"><span /><span /><span /></div>

    <div v-if="isPremium && skin !== 'storm_front' && skin !== 'inferno_ring'" class="theme-edge-effects">
      <span class="edge-fx edge-fx-top"><i v-for="index in 18" :key="`top-${index}`" /></span>
      <span class="edge-fx edge-fx-right"><i v-for="index in 24" :key="`right-${index}`" /></span>
      <span class="edge-fx edge-fx-bottom"><i v-for="index in 18" :key="`bottom-${index}`" /></span>
      <span class="edge-fx edge-fx-left"><i v-for="index in 24" :key="`left-${index}`" /></span>
    </div>
  </div>
</template>
