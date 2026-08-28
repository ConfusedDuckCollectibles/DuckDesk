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
  "inferno_ring",
  "deep_reef",
  "zen_garden",
  "vinyl_lounge",
  "blueprint_draft",
  "aurora_peaks",
  "solar_flare",
  "glacier_cavern",
  "noir_detective",
  "retro_spaceport",
  "royal_tournament",
  "desert_mirage",
  "enchanted_forest",
  "steampunk_foundry",
  "hologram_lab",
  "stained_glass",
  "paper_theater",
  "midnight_library",
  "carnival_nights",
  "moonlit_tide",
  "koi_pond",
  "crystal_cavern",
  "racing_grid",
  "wild_west",
  "celestial_clockwork",
  "sakura_festival",
  "neon_museum",
  "chrome_showroom",
  "prism_arcade",
  "velvet_casino",
  "alpine_lodge",
  "circuit_garden",
  "gemstone_gallery",
  "sunset_boardwalk",
  "midnight_observatory",
  "tea_house"
]);

const isPremium = computed(() => premiumSkins.has(props.skin));

const standardLoop: Record<string, { shadow: string; keyline: string; inner: string }> = {
  none: {
    shadow: "M24 24H1056V1896H24Z",
    keyline: "M40 40H1040V1880H40Z",
    inner: "M56 56H1024V1864H56Z"
  },
  cyber_market: {
    shadow: "M24 48H56V24H1056V48H1024V1896H1056V1872H24V1896H56V48Z",
    keyline: "M40 64H72V40H1040V64H1008V1856H1040V1880H40V1856H72V64Z",
    inner: "M88 80H1000V1840H88Z"
  },
  arcade_drop: {
    shadow: "M24 24H1032V48H1056V1872H1032V1896H48V1872H24Z",
    keyline: "M40 40H1016V64H1040V1856H1016V1880H64V1856H40Z",
    inner: "M64 64H1000V80H1016V1840H1000V1856H80V1840H64Z"
  },
  sports_desk: {
    shadow: "M8 48L72 24H1056L1008 1896H24Z",
    keyline: "M24 64L80 40H1040L992 1880H40Z",
    inner: "M56 88L104 64H1008L968 1856H72Z"
  },
  card_shop: {
    shadow: "M48 24H1032V1896H48Z",
    keyline: "M64 40H1016V1880H64Z",
    inner: "M88 64H992V1856H88Z"
  },
  retro_toy: {
    shadow: "M72 24H1008Q1056 24 1056 72V1848Q1056 1896 1008 1896H72Q24 1896 24 1848V72Q24 24 72 24Z",
    keyline: "M80 40H1000Q1040 40 1040 80V1840Q1040 1880 1000 1880H80Q40 1880 40 1840V80Q40 40 80 40Z",
    inner: "M96 64H984Q1024 64 1024 104V1816Q1024 1856 984 1856H96Q56 1856 56 1816V104Q56 64 96 64Z"
  },
  midnight_gold: {
    shadow: "M32 32H1048V1888H32Z",
    keyline: "M44 44H1036V1876H44Z",
    inner: "M60 60H1020V1860H60Z"
  },
  pastel_pop: {
    shadow: "M48 24H1032Q1056 48 1056 72V1848Q1056 1896 1008 1896H72Q24 1896 24 1848V72Q24 48 48 24Z",
    keyline: "M64 40H1016Q1040 64 1040 88V1840Q1040 1880 992 1880H88Q40 1880 40 1840V88Q40 64 64 40Z",
    inner: "M88 72H992V1840H88Z"
  },
  lava_lamp: {
    shadow: "M56 40C16 120 16 400 40 960C16 1520 16 1800 56 1880C160 1910 920 1910 1024 1880C1064 1800 1064 1520 1040 960C1064 400 1064 120 1024 40C920 10 160 10 56 40Z",
    keyline: "M72 56C36 128 36 400 56 960C36 1520 36 1792 72 1864C168 1892 912 1892 1008 1864C1044 1792 1044 1520 1024 960C1044 400 1044 128 1008 56C912 28 168 28 72 56Z",
    inner: "M96 96C64 160 64 400 80 960C64 1520 64 1760 96 1824C176 1848 904 1848 984 1824C1016 1760 1016 1520 1000 960C1016 400 1016 160 984 96C904 72 176 72 96 96Z"
  },
  icebox: {
    shadow: "M24 96L96 24H984L1056 96V1824L984 1896H96L24 1824Z",
    keyline: "M40 104L104 40H976L1040 104V1816L976 1880H104L40 1816Z",
    inner: "M64 120L120 64H960L1016 120V1800L960 1856H120L64 1800Z"
  },
  comic_burst: {
    shadow: "M40 40L80 8H200L240 40H840L880 8H1000L1040 40L1072 160V1760L1040 1880L1000 1912H880L840 1880H240L200 1912H80L40 1880L8 1760V160Z",
    keyline: "M48 48L88 20H208L244 48H836L872 20H992L1032 48L1060 168V1752L1032 1872L992 1900H872L836 1872H244L208 1900H88L48 1872L20 1752V168Z",
    inner: "M72 80H1008V1840H72Z"
  },
  luxury_black: {
    shadow: "M36 36H1044V1884H36Z",
    keyline: "M48 48H1032V1872H48Z",
    inner: "M64 64H1016V1856H64Z"
  },
  jungle_neon: {
    shadow: "M24 80C80 16 200 24 320 48H760C880 24 1000 16 1056 80V1840C1000 1904 880 1896 760 1872H320C200 1896 80 1904 24 1840Z",
    keyline: "M40 96C92 40 208 48 328 68H752C872 48 988 40 1040 96V1824C988 1880 872 1872 752 1852H328C208 1872 92 1880 40 1824Z",
    inner: "M64 128C104 80 216 88 336 104H744C864 88 976 80 1016 128V1792C976 1840 864 1832 744 1816H336C216 1832 104 1840 64 1792Z"
  },
  cotton_candy: {
    shadow: "M80 40C40 40 24 88 24 128V1792C24 1832 40 1880 80 1880H1000C1040 1880 1056 1832 1056 1792V128C1056 88 1040 40 1000 40Z",
    keyline: "M96 56C56 56 40 96 40 136V1784C40 1824 56 1864 96 1864H984C1024 1864 1040 1824 1040 1784V136C1040 96 1024 56 984 56Z",
    inner: "M120 88C88 88 72 120 72 152V1768C72 1800 88 1832 120 1832H960C992 1832 1008 1800 1008 1768V152C1008 120 992 88 960 88Z"
  },
  synthwave: {
    shadow: "M8 24H1072L1040 1896H40Z",
    keyline: "M24 40H1056L1024 1880H56Z",
    inner: "M56 72H1024L996 1848H84Z"
  },
  streetwear: {
    shadow: "M24 24H1056V1896H24V1680L48 1640L24 1600V1280L48 1240L24 1200V880L48 840L24 800V480L48 440L24 400Z",
    keyline: "M40 40H1040V1880H40V1664L64 1624L40 1584V1264L64 1224L40 1184V864L64 824L40 784V464L64 424L40 384Z",
    inner: "M64 64H1016V1856H64Z"
  },
  holiday_spark: {
    shadow: "M24 80L80 24H1000L1056 80V1840L1000 1896H80L24 1840Z",
    keyline: "M40 88L88 40H992L1040 88V1832L992 1880H88L40 1832Z",
    inner: "M64 112L104 64H976L1016 112V1808L976 1856H104L64 1808Z"
  },
  ocean_depth: {
    shadow: "M24 80C120 8 240 96 360 40C480 -8 600 96 720 40C840 -8 960 72 1056 80V1840C960 1912 840 1824 720 1880C600 1928 480 1824 360 1880C240 1928 120 1848 24 1840Z",
    keyline: "M40 96C128 32 248 104 360 56C480 8 600 104 720 56C840 8 952 88 1040 96V1824C952 1888 840 1816 720 1864C600 1912 480 1816 360 1864C248 1912 128 1840 40 1824Z",
    inner: "M64 128C144 72 256 128 368 88C488 48 600 128 720 88C840 48 936 112 1016 128V1792C936 1848 840 1784 720 1824C600 1864 488 1784 368 1824C256 1864 144 1800 64 1792Z"
  },
  pixel_party: {
    shadow: "M24 24H1008V48H1032V72H1056V1848H1032V1872H1008V1896H72V1872H48V1848H24Z",
    keyline: "M40 40H992V64H1016V88H1040V1832H1016V1856H992V1880H88V1856H64V1832H40Z",
    inner: "M64 64H968V88H992V1840H64Z"
  },
  emerald_vault: {
    shadow: "M120 24H960L1056 160V1760L960 1896H120L24 1760V160Z",
    keyline: "M128 40H952L1040 168V1752L952 1880H128L40 1752V168Z",
    inner: "M160 72H920L1000 184V1736L920 1848H160L80 1736V184Z"
  }
};

const loop = computed(() => standardLoop[props.skin] ?? standardLoop.none);
</script>

<template>
  <div class="broadcast-frame" aria-hidden="true">
    <!-- Soft top and bottom falloff. Keeps the panel type legible over any
         video without laying a flat scrim across the seller's product. -->
    <div class="frame-vignette">
      <i class="frame-vignette-top" />
      <i class="frame-vignette-bottom" />
    </div>
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
        <filter id="inferno-fluid" x="-30%" y="-80%" width="160%" height="260%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.046" numOctaves="3" seed="17" result="noise">
            <animate attributeName="baseFrequency" dur="5.6s" values="0.018 0.046;0.022 0.04;0.016 0.05;0.018 0.046" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" result="distorted" />
          <feGaussianBlur in="distorted" stdDeviation="0.6" result="soft" />
          <feMerge><feMergeNode in="soft" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="inferno-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#fffce8" />
          <stop offset="0.45" stop-color="#ffe57a" />
          <stop offset="1" stop-color="#ff9a2a" stop-opacity="0.15" />
        </linearGradient>
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
      </defs>

      <g v-if="!isPremium" class="frame-geometry-standard" :class="'frame-skin-' + skin">
        <path class="frame-shadow" :d="loop.shadow" />
        <path class="frame-keyline" :d="loop.keyline" />
        <path class="frame-inner" :d="loop.inner" />
      </g>

      <g v-if="isPremium" class="premium-frame-loop">
        <path class="frame-loop-outer" d="M36 36H1044V1884H36Z" />
        <path class="frame-loop-inner" d="M54 54H1026V1866H54Z" />
      </g>

      <g v-if="skin === 'storm_front'" class="premium-geometry geometry-storm">
        <path class="storm-metal" d="M28 306V118l86-86h238 M728 32h238l86 86v188 M28 1610v192l84 86h278 M690 1888h278l84-86v-192" />
        <path class="storm-conductor" d="M43 344V148l82-82h178 M777 66h178l82 82v196 M43 1574v198l80 82h222 M735 1854h220l82-82v-198" />
        <path class="storm-bus" d="M28 524h54 M28 812h82 M28 1100h54 M28 1388h82 M1052 524h-54 M1052 812h-82 M1052 1100h-54 M1052 1388h-82" />
        <g class="storm-insulators"><circle cx="43" cy="434" r="9" /><circle cx="43" cy="1486" r="9" /><circle cx="1037" cy="434" r="9" /><circle cx="1037" cy="1486" r="9" /></g>
        <g class="storm-lightning storm-lightning-a" filter="url(#storm-glow)" transform="translate(0 320)">
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
        <path class="inferno-flame-ring" fill-rule="evenodd" filter="url(#inferno-fluid)" d="M 34 34 C 44.1 23.9 64.0 -2.0 80.0 34.0 C 90.1 16.1 96.0 -30.0 126.0 34.0 C 136.1 22.8 156.0 -6.0 172.0 34.0 C 182.1 13.8 188.0 -38.0 218.0 34.0 C 228.1 20.0 248.0 -16.0 264.0 34.0 C 274.1 24.5 280.0 0.0 310.0 34.0 C 320.1 16.1 340.0 -30.0 356.0 34.0 C 366.1 21.1 372.0 -12.0 402.0 34.0 C 412.1 8.2 432.0 -58.0 448.0 34.0 C 458.1 25.6 464.0 4.0 494.0 34.0 C 504.1 17.8 524.0 -24.0 540.0 34.0 C 550.1 23.9 556.0 -2.0 586.0 34.0 C 596.1 15.0 616.0 -34.0 632.0 34.0 C 642.1 21.7 648.0 -10.0 678.0 34.0 C 688.1 17.2 708.0 -26.0 724.0 34.0 C 734.1 23.9 740.0 -2.0 770.0 34.0 C 780.1 16.1 800.0 -30.0 816.0 34.0 C 826.1 22.8 832.0 -6.0 862.0 34.0 C 872.1 13.8 892.0 -38.0 908.0 34.0 C 918.1 20.0 924.0 -16.0 954.0 34.0 C 964.1 24.5 984.0 0.0 1000.0 34.0 C 1010.1 16.1 1016.0 -30.0 1046.0 34.0 C 1056.1 45.3 1082.0 66.7 1046.0 85.4 C 1063.9 96.8 1110.0 104.2 1046.0 136.9 C 1057.2 148.2 1086.0 169.6 1046.0 188.3 C 1066.2 199.7 1118.0 207.1 1046.0 239.8 C 1060.0 251.1 1096.0 272.5 1046.0 291.2 C 1055.5 302.5 1080.0 309.9 1046.0 342.7 C 1063.9 354.0 1110.0 375.4 1046.0 394.1 C 1058.9 405.4 1092.0 412.8 1046.0 445.6 C 1071.8 456.9 1138.0 478.3 1046.0 497.0 C 1054.4 508.3 1076.0 515.7 1046.0 548.4 C 1062.2 559.8 1104.0 581.2 1046.0 599.9 C 1056.1 611.2 1082.0 618.6 1046.0 651.3 C 1065.0 662.7 1114.0 684.1 1046.0 702.8 C 1058.3 714.1 1090.0 721.5 1046.0 754.2 C 1062.8 765.5 1106.0 786.9 1046.0 805.7 C 1056.1 817.0 1082.0 824.4 1046.0 857.1 C 1063.9 868.4 1110.0 889.8 1046.0 908.6 C 1057.2 919.9 1086.0 927.3 1046.0 960.0 C 1066.2 971.3 1118.0 992.7 1046.0 1011.4 C 1060.0 1022.8 1096.0 1030.2 1046.0 1062.9 C 1055.5 1074.2 1080.0 1095.6 1046.0 1114.3 C 1063.9 1125.7 1110.0 1133.1 1046.0 1165.8 C 1058.9 1177.1 1092.0 1198.5 1046.0 1217.2 C 1071.8 1228.5 1138.0 1235.9 1046.0 1268.7 C 1054.4 1280.0 1076.0 1301.4 1046.0 1320.1 C 1062.2 1331.4 1104.0 1338.8 1046.0 1371.6 C 1056.1 1382.9 1082.0 1404.3 1046.0 1423.0 C 1065.0 1434.3 1114.0 1441.7 1046.0 1474.4 C 1058.3 1485.8 1090.0 1507.2 1046.0 1525.9 C 1062.8 1537.2 1106.0 1544.6 1046.0 1577.3 C 1056.1 1588.7 1082.0 1610.1 1046.0 1628.8 C 1063.9 1640.1 1110.0 1647.5 1046.0 1680.2 C 1057.2 1691.5 1086.0 1712.9 1046.0 1731.7 C 1066.2 1743.0 1118.0 1750.4 1046.0 1783.1 C 1060.0 1794.4 1096.0 1815.8 1046.0 1834.6 C 1055.5 1845.9 1080.0 1853.3 1046.0 1886.0 C 1035.9 1896.1 1016.0 1922.0 1000.0 1886.0 C 989.9 1903.9 984.0 1950.0 954.0 1886.0 C 943.9 1897.2 924.0 1926.0 908.0 1886.0 C 897.9 1906.2 892.0 1958.0 862.0 1886.0 C 851.9 1900.0 832.0 1936.0 816.0 1886.0 C 805.9 1895.5 800.0 1920.0 770.0 1886.0 C 759.9 1903.9 740.0 1950.0 724.0 1886.0 C 713.9 1898.9 708.0 1932.0 678.0 1886.0 C 667.9 1911.8 648.0 1978.0 632.0 1886.0 C 621.9 1894.4 616.0 1916.0 586.0 1886.0 C 575.9 1902.2 556.0 1944.0 540.0 1886.0 C 529.9 1896.1 524.0 1922.0 494.0 1886.0 C 483.9 1905.0 464.0 1954.0 448.0 1886.0 C 437.9 1898.3 432.0 1930.0 402.0 1886.0 C 391.9 1902.8 372.0 1946.0 356.0 1886.0 C 345.9 1896.1 340.0 1922.0 310.0 1886.0 C 299.9 1903.9 280.0 1950.0 264.0 1886.0 C 253.9 1897.2 248.0 1926.0 218.0 1886.0 C 207.9 1906.2 188.0 1958.0 172.0 1886.0 C 161.9 1900.0 156.0 1936.0 126.0 1886.0 C 115.9 1895.5 96.0 1920.0 80.0 1886.0 C 69.9 1903.9 64.0 1950.0 34.0 1886.0 C 23.9 1874.7 -2.0 1853.3 34.0 1834.6 C 16.1 1823.2 -30.0 1815.8 34.0 1783.1 C 22.8 1771.8 -6.0 1750.4 34.0 1731.7 C 13.8 1720.3 -38.0 1712.9 34.0 1680.2 C 20.0 1668.9 -16.0 1647.5 34.0 1628.8 C 24.5 1617.5 0.0 1610.1 34.0 1577.3 C 16.1 1566.0 -30.0 1544.6 34.0 1525.9 C 21.1 1514.6 -12.0 1507.2 34.0 1474.4 C 8.2 1463.1 -58.0 1441.7 34.0 1423.0 C 25.6 1411.7 4.0 1404.3 34.0 1371.6 C 17.8 1360.2 -24.0 1338.8 34.0 1320.1 C 23.9 1308.8 -2.0 1301.4 34.0 1268.7 C 15.0 1257.3 -34.0 1235.9 34.0 1217.2 C 21.7 1205.9 -10.0 1198.5 34.0 1165.8 C 17.2 1154.5 -26.0 1133.1 34.0 1114.3 C 23.9 1103.0 -2.0 1095.6 34.0 1062.9 C 16.1 1051.6 -30.0 1030.2 34.0 1011.4 C 22.8 1000.1 -6.0 992.7 34.0 960.0 C 13.8 948.7 -38.0 927.3 34.0 908.6 C 20.0 897.2 -16.0 889.8 34.0 857.1 C 24.5 845.8 0.0 824.4 34.0 805.7 C 16.1 794.3 -30.0 786.9 34.0 754.2 C 21.1 742.9 -12.0 721.5 34.0 702.8 C 8.2 691.5 -58.0 684.1 34.0 651.3 C 25.6 640.0 4.0 618.6 34.0 599.9 C 17.8 588.6 -24.0 581.2 34.0 548.4 C 23.9 537.1 -2.0 515.7 34.0 497.0 C 15.0 485.7 -34.0 478.3 34.0 445.6 C 21.7 434.2 -10.0 412.8 34.0 394.1 C 17.2 382.8 -26.0 375.4 34.0 342.7 C 23.9 331.3 -2.0 309.9 34.0 291.2 C 16.1 279.9 -30.0 272.5 34.0 239.8 C 22.8 228.5 -6.0 207.1 34.0 188.3 C 13.8 177.0 -38.0 169.6 34.0 136.9 C 20.0 125.6 -16.0 104.2 34.0 85.4 C 24.5 74.1 0.0 66.7 34.0 34.0 Z M 78 78 H 1002 V 1842 H 78 Z" />
        <path class="inferno-forge" d="M78 78H1002V1842H78Z" />
        <path class="inferno-molten-rail" pathLength="1" d="M96 96H984V1824H96Z" />
        <g class="inferno-embers" filter="url(#inferno-glow)"><circle cx="92" cy="498" r="5" /><circle cx="58" cy="724" r="3" /><circle cx="96" cy="1038" r="4" /><circle cx="61" cy="1342" r="5" /><circle cx="988" cy="578" r="4" /><circle cx="1022" cy="862" r="5" /><circle cx="986" cy="1174" r="3" /><circle cx="1020" cy="1442" r="4" /></g>
      </g>

      <g v-if="skin === 'deep_reef'" class="premium-geometry geometry-reef">
        <path class="reef-plate" d="M34 338C34 176 98 42 254 28H398 M682 28H826C982 42 1046 176 1046 338 M34 1582C34 1744 98 1878 254 1892H398 M682 1892H826C982 1878 1046 1744 1046 1582" />
        <path class="reef-inlay" d="M58 352C58 198 118 62 262 50H378 M702 50H818C962 62 1022 198 1022 352 M58 1568C58 1722 118 1858 262 1870H378 M702 1870H818C962 1858 1022 1722 1022 1568" />
      </g>

      <g v-if="skin === 'zen_garden'" class="premium-geometry geometry-zen">
        <path class="zen-plate" d="M36 318Q44 78 214 36H368 M712 36H866Q1036 78 1044 318 M36 1602Q44 1842 214 1884H368 M712 1884H866Q1036 1842 1044 1602" />
        <path class="zen-inlay" d="M54 334Q62 104 228 54H352 M728 54H852Q1018 104 1026 334 M54 1586Q62 1816 228 1866H352 M728 1866H852Q1018 1816 1026 1586" />
      </g>

      <g v-if="skin === 'vinyl_lounge'" class="premium-geometry geometry-vinyl">
        <path class="vinyl-plate" d="M34 312A278 278 0 0 1 312 34 M768 34A278 278 0 0 1 1046 312 M34 1608A278 278 0 0 0 312 1886 M768 1886A278 278 0 0 0 1046 1608" />
        <path class="vinyl-groove" d="M34 248A214 214 0 0 1 248 34 M832 34A214 214 0 0 1 1046 248 M34 1672A214 214 0 0 0 248 1886 M832 1886A214 214 0 0 0 1046 1672" />
      </g>

      <g v-if="skin === 'blueprint_draft'" class="premium-geometry geometry-draft">
        <path class="draft-plate" d="M28 28H360 M720 28H1052V360 M1052 1560V1892H720 M360 1892H28V1560 M28 360V28" />
        <path class="draft-ticks" d="M28 88h18 M28 148h12 M28 208h18 M1052 88h-18 M1052 148h-12 M1052 208h-18 M28 1712h18 M28 1772h12 M28 1832h18 M1052 1712h-18 M1052 1772h-12 M1052 1832h-18" />
      </g>

      <g v-if="skin === 'aurora_peaks'" class="premium-geometry geometry-aurora">
        <path class="aurora-plate" d="M28 340L28 92L186 28L344 92 M736 92L894 28L1052 92L1052 340 M28 1580L28 1828L186 1892L344 1828 M736 1828L894 1892L1052 1828L1052 1580" />
        <path class="aurora-inlay" d="M48 348L48 118L186 58L324 118 M756 118L894 58L1032 118L1032 348 M48 1572L48 1802L186 1862L324 1802 M756 1802L894 1862L1032 1802L1032 1572" />
      </g>

      <g v-if="skin === 'solar_flare'" class="premium-geometry geometry-solar">
        <path class="solar-arc" d="M24 342A318 318 0 0 1 342 24 M738 24a318 318 0 0 1 318 318 M24 1578a318 318 0 0 0 318 318 M738 1896a318 318 0 0 0 318-318" />
        <path class="solar-rays-frame" d="M88 112l62 62 M992 112l-62 62 M88 1808l62-62 M992 1808l-62-62 M24 520h74 M1056 520h-74 M24 1400h74 M1056 1400h-74" />
      </g>

      <g v-if="skin === 'glacier_cavern'" class="premium-geometry geometry-glacier">
        <path class="glacier-frame" d="M28 352V92L104 28h260 M716 28h260l76 64v260 M28 1568v260l76 64h260 M716 1892h260l76-64v-260" />
        <path class="glacier-facets" d="M104 28l52 72 52-72 58 92 58-92 M976 28l-52 72-52-72-58 92-58-92 M104 1892l52-72 52 72 58-92 58 92 M976 1892l-52-72-52 72-58-92-58 92" />
      </g>

      <g v-if="skin === 'noir_detective'" class="premium-geometry geometry-noir">
        <path class="noir-frame" d="M28 330V28h330 M722 28h330v302 M28 1590v302h330 M722 1892h330v-302" />
        <path class="noir-cuts" d="M28 448h96l34-34h84 M1052 448h-96l-34-34h-84 M28 1472h96l34 34h84 M1052 1472h-96l-34 34h-84" />
      </g>

      <g v-if="skin === 'retro_spaceport'" class="premium-geometry geometry-spaceport">
        <path class="spaceport-frame" d="M118 28H962l90 90v244 M1052 1558v244l-90 90H118l-90-90v-244 M28 362V118l90-90 M962 28l90 90" />
        <path class="spaceport-dock" d="M356 28l46 42h276l46-42 M356 1892l46-42h276l46 42 M28 620h52l34 34-34 34H28 M1052 1232h-52l-34 34 34 34h52" />
      </g>

      <g v-if="skin === 'royal_tournament'" class="premium-geometry geometry-royal">
        <path class="royal-frame" d="M28 352V92l62-64h252 M738 28h252l62 64v260 M28 1568v260l62 64h252 M738 1892h252l62-64v-260" />
        <path class="royal-crown" d="M342 28l48 62 52-62 50 62 48-62 48 62 50-62 52 62 48-62 M342 1892l48-62 52 62 50-62 48 62 48-62 50 62 52-62 48 62" />
      </g>

      <g v-if="skin === 'desert_mirage'" class="premium-geometry geometry-desert">
        <path class="desert-frame" d="M26 344V116Q220 16 410 52 M670 52q190-36 384 64v228 M26 1576v228q194 100 384 64 M670 1868q190 36 384-64v-228" />
        <path class="desert-ripple" d="M54 388V152Q230 72 398 94 M682 94q168-22 344 58v236 M54 1532v236q176 80 344 58 M682 1826q168 22 344-58v-236" />
      </g>

      <g v-if="skin === 'enchanted_forest'" class="premium-geometry geometry-forest">
        <path class="forest-frame" d="M38 360C12 242 82 88 224 38h146 M710 38h146c142 50 212 204 186 322 M38 1560c-26 118 44 272 186 322h146 M710 1882h146c142-50 212-204 186-322" />
        <path class="forest-leaves" d="M76 184q82-92 146-26-80 96-146 26Z M1004 184q-82-92-146-26 80 96 146 26Z M76 1736q82 92 146 26-80-96-146-26Z M1004 1736q-82 92-146 26 80-96 146-26Z" />
      </g>

      <g v-if="skin === 'steampunk_foundry'" class="premium-geometry geometry-foundry">
        <path class="foundry-frame" d="M28 352V92h64V28h280 M708 28h280v64h64v260 M28 1568v260h64v64h280 M708 1892h280v-64h64v-260" />
        <path class="foundry-rivets" d="M70 420v1080 M1010 420v1080" /><g class="foundry-frame-gears"><circle cx="70" cy="520" r="24" /><circle cx="1010" cy="1400" r="24" /></g>
      </g>

      <g v-if="skin === 'hologram_lab'" class="premium-geometry geometry-hologram">
        <path class="holo-frame" d="M116 28H964l88 88v244 M1052 1560v244l-88 88H116l-88-88v-244 M28 360V116l88-88" />
        <path class="holo-corners" d="M52 236l92-92h142 M794 144h142l92 92 M52 1684l92 92h142 M794 1776h142l92-92" />
      </g>

      <g v-if="skin === 'stained_glass'" class="premium-geometry geometry-glass">
        <path class="glass-frame" d="M28 352V108L108 28h268 M704 28h268l80 80v244 M28 1568v244l80 80h268 M704 1892h268l80-80v-244" />
        <path class="glass-facets" d="M108 28l92 90 86-90 90 120 M972 28l-92 90-86-90-90 120 M108 1892l92-90 86 90 90-120 M972 1892l-92-90-86 90-90-120" />
      </g>

      <g v-if="skin === 'paper_theater'" class="premium-geometry geometry-paper">
        <path class="paper-frame" d="M48 346V86Q48 34 100 34h280 M700 34h280q52 0 52 52v260 M48 1574v260q0 52 52 52h280 M700 1886h280q52 0 52-52v-260" />
        <path class="paper-scallop" d="M380 34q40 68 80 0 40 68 80 0 40 68 80 0 40 68 80 0 M380 1886q40-68 80 0 40-68 80 0 40-68 80 0 40-68 80 0" />
      </g>

      <g v-if="skin === 'midnight_library'" class="premium-geometry geometry-library">
        <path class="library-frame" d="M34 360V184Q34 34 184 34h190 M706 34h190q150 0 150 150v176 M34 1560v176q0 150 150 150h190 M706 1886h190q150 0 150-150v-176" />
        <path class="library-books" d="M54 446h76v162H54 M1026 446h-76v162h76 M54 1312h76v162H54 M1026 1312h-76v162h76" />
      </g>

      <g v-if="skin === 'carnival_nights'" class="premium-geometry geometry-carnival">
        <path class="carnival-frame" d="M28 352V114Q118 28 222 28h636q104 0 194 86v238 M28 1568v238q90 86 194 86h636q104 0 194-86v-238" />
        <path class="carnival-bulb-line" pathLength="1" d="M222 48h636 M222 1872h636" />
      </g>

      <g v-if="skin === 'moonlit_tide'" class="premium-geometry geometry-moonlit">
        <path class="moonlit-frame" d="M28 350V110Q178 14 340 54 M740 54q162-40 312 56v240 M28 1570v240q150 96 312 56 M740 1866q162 40 312-56v-240" />
        <path class="moonlit-wave-frame" d="M54 388V152q130-62 260 0t260 0 260 0 192 0v236 M54 1532v236q130 62 260 0t260 0 260 0 192 0v-236" />
      </g>

      <g v-if="skin === 'koi_pond'" class="premium-geometry geometry-koi">
        <path class="koi-frame" d="M36 352V126Q36 36 126 36h246 M708 36h246q90 0 90 90v226 M36 1568v226q0 90 90 90h246 M708 1884h246q90 0 90-90v-226" />
        <path class="koi-rings-frame" d="M68 442q80-54 160 0t160 0 M1012 1478q-80 54-160 0t-160 0" />
      </g>

      <g v-if="skin === 'crystal_cavern'" class="premium-geometry geometry-crystal">
        <path class="crystal-frame" d="M28 350V108L118 28h264 M698 28h264l90 80v242 M28 1570v242l90 80h264 M698 1892h264l90-80v-242" />
        <path class="crystal-facets-frame" d="M118 28l72 112 66-112 64 140 62-140 M962 28l-72 112-66-112-64 140-62-140 M118 1892l72-112 66 112 64-140 62 140 M962 1892l-72-112-66 112-64-140-62 140" />
      </g>

      <g v-if="skin === 'racing_grid'" class="premium-geometry geometry-racing">
        <path class="racing-frame" d="M18 350L104 28h332 M644 28h418l-86 322 M18 1570l86 322h332 M644 1892h418l-86-322" />
        <path class="racing-stripes-frame" d="M122 28l48 92 48-92 48 92 48-92 M958 1892l-48-92-48 92-48-92-48 92" />
      </g>

      <g v-if="skin === 'wild_west'" class="premium-geometry geometry-west">
        <path class="west-frame" d="M34 350V148Q34 34 148 34h238 M694 34h238q114 0 114 114v202 M34 1570v202q0 114 114 114h238 M694 1886h238q114 0 114-114v-202" />
        <path class="west-knots-frame" d="M34 450q76-48 0-96 M1046 450q-76-48 0-96 M34 1470q76 48 0 96 M1046 1470q-76 48 0 96" />
      </g>

      <g v-if="skin === 'celestial_clockwork'" class="premium-geometry geometry-celestial">
        <path class="celestial-frame" d="M28 350A322 322 0 0 1 350 28 M730 28a322 322 0 0 1 322 322 M28 1570a322 322 0 0 0 322 322 M730 1892a322 322 0 0 0 322-322" />
        <path class="celestial-orbits-frame" d="M104 146A276 124 0 0 1 392 42 M976 146A276 124 0 0 0 688 42 M104 1774a276 124 0 0 0 288 104 M976 1774a276 124 0 0 1-288 104" />
      </g>

      <g v-if="skin === 'sakura_festival'" class="premium-geometry geometry-sakura">
        <path class="sakura-frame" d="M34 350V126h92V34h262 M692 34h262v92h92v224 M34 1570v224h92v92h262 M692 1886h262v-92h92v-224" />
        <path class="sakura-branches-frame" d="M126 34q74 88 160 34 54-34 102 24 M954 34q-74 88-160 34-54-34-102 24 M126 1886q74-88 160-34 54 34 102-24 M954 1886q-74-88-160-34-54 34-102-24" />
      </g>

      <g v-if="skin === 'neon_museum'" class="premium-geometry geometry-neon-museum">
        <path class="museum-frame" d="M56 64H1024V1856H56Z" />
        <path class="museum-gallery-rail" d="M92 124H988 M92 1796H988 M124 92V508 M956 92V508 M124 1412V1828 M956 1412V1828" />
        <path class="museum-frame-cards" d="M118 196H252V406H118Z M828 196H962V406H828Z M118 1514H252V1724H118Z M828 1514H962V1724H828Z" />
      </g>

      <g v-if="skin === 'chrome_showroom'" class="premium-geometry geometry-chrome-showroom">
        <path class="chrome-frame" d="M56 76C56 48 78 34 106 34H974C1002 34 1024 48 1024 76V1844C1024 1872 1002 1886 974 1886H106C78 1886 56 1872 56 1844Z" />
        <path class="chrome-glide-frame" d="M92 118H988 M92 1802H988 M118 92V1828 M962 92V1828" />
        <path class="chrome-caps-frame" d="M116 116C218 66 862 66 964 116 M116 1804C218 1854 862 1854 964 1804" />
      </g>

      <g v-if="skin === 'prism_arcade'" class="premium-geometry geometry-prism-arcade">
        <path class="prism-frame" d="M62 56H1018V1864H62Z" />
        <path class="prism-trace-frame" d="M94 94H986L910 204H170Z M94 1826H986L910 1716H170Z" />
        <path class="prism-shards-frame" d="M70 292L174 214L248 318L144 396Z M1010 292L906 214L832 318L936 396Z M70 1628L174 1706L248 1602L144 1524Z M1010 1628L906 1706L832 1602L936 1524Z" />
      </g>

      <g v-if="skin === 'velvet_casino'" class="premium-geometry geometry-velvet-casino">
        <path class="casino-frame" d="M58 80Q58 44 94 44H986Q1022 44 1022 80V1840Q1022 1876 986 1876H94Q58 1876 58 1840Z" />
        <path class="casino-bulb-frame" d="M118 82H962 M118 1838H962 M80 150V1770 M1000 150V1770" />
        <path class="casino-chip-frame" d="M156 156a58 58 0 1 0 0.1 0 M924 156a58 58 0 1 0 0.1 0 M156 1764a58 58 0 1 0 0.1 0 M924 1764a58 58 0 1 0 0.1 0" />
      </g>

      <g v-if="skin === 'alpine_lodge'" class="premium-geometry geometry-alpine-lodge">
        <path class="alpine-frame" d="M68 72H1012V1848H68Z" />
        <path class="alpine-timber-frame" d="M96 96L218 218 M984 96L862 218 M96 1824L218 1702 M984 1824L862 1702 M96 362H214 M866 362H984 M96 1558H214 M866 1558H984" />
        <path class="alpine-peak-frame" d="M330 92L540 236L750 92 M330 1828L540 1684L750 1828" />
      </g>

      <g v-if="skin === 'circuit_garden'" class="premium-geometry geometry-circuit-garden">
        <path class="circuit-frame" d="M56 58H1024V1862H56Z" />
        <path class="circuit-vine-frame" d="M104 104V454H234V680H104V1040H234V1284H104V1816 M976 104V454H846V680H976V1040H846V1284H976V1816" />
        <path class="circuit-node-frame" d="M104 454h0 M234 680h0 M104 1040h0 M234 1284h0 M976 454h0 M846 680h0 M976 1040h0 M846 1284h0" />
      </g>

      <g v-if="skin === 'gemstone_gallery'" class="premium-geometry geometry-gemstone-gallery">
        <path class="gem-frame" d="M62 62H1018V1858H62Z" />
        <path class="gem-facet-frame" d="M118 118H962L1004 244L940 366H140L76 244Z M118 1802H962L1004 1676L940 1554H140L76 1676Z" />
        <path class="gem-spark-frame" d="M156 244h768 M208 118l96 248 M872 118l-96 248 M208 1802l96-248 M872 1802l-96-248" />
      </g>

      <g v-if="skin === 'sunset_boardwalk'" class="premium-geometry geometry-sunset-boardwalk">
        <path class="boardwalk-frame" d="M58 70H1022V1850H58Z" />
        <path class="boardwalk-wave-frame" d="M100 332Q210 260 320 332t220 0 220 0 220 0 M100 1588Q210 1660 320 1588t220 0 220 0 220 0" />
        <path class="boardwalk-plank-frame" d="M122 92V430 M230 92V390 M858 92V390 M966 92V430 M122 1490V1828 M230 1530V1828 M858 1530V1828 M966 1490V1828" />
      </g>

      <g v-if="skin === 'midnight_observatory'" class="premium-geometry geometry-midnight-observatory">
        <path class="observatory-frame" d="M56 56H1024V1864H56Z" />
        <path class="observatory-orbit-frame" d="M138 232C308 90 772 90 942 232 M138 1688C308 1830 772 1830 942 1688 M90 540C220 464 344 464 474 540 M606 540C736 464 860 464 990 540 M90 1380C220 1456 344 1456 474 1380 M606 1380C736 1456 860 1456 990 1380" />
        <path class="observatory-star-frame" d="M540 92l18 44l46 4l-36 30l12 46l-40-24l-40 24l12-46l-36-30l46-4z M540 1828l18-44l46-4l-36-30l12-46l-40 24l-40-24l12 46l-36 30l46 4z" />
      </g>

      <g v-if="skin === 'tea_house'" class="premium-geometry geometry-tea-house">
        <path class="tea-frame" d="M72 72H1008V1848H72Z" />
        <path class="tea-shoji-frame" d="M112 112H968V430H112Z M112 1490H968V1808H112Z M326 112V430 M540 112V430 M754 112V430 M326 1490V1808 M540 1490V1808 M754 1490V1808" />
        <path class="tea-steam-frame" d="M142 640C214 580 122 500 194 440 M938 640C866 580 958 500 886 440 M142 1280C214 1340 122 1420 194 1480 M938 1280C866 1340 958 1420 886 1480" />
      </g>
    </svg>

    <div v-if="!isPremium" class="frame-status frame-status-left"><span /><span /><span /></div>
    <div v-if="!isPremium" class="frame-status frame-status-right"><span /><span /><span /></div>
  </div>
</template>
