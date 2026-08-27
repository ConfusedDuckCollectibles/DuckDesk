<script setup lang="ts">
import type { AlertVisualConfig, ShowEvent } from "@duck-desk/shared";
import { usesThemeAlertArt } from "@duck-desk/shared";

const props = defineProps<{
  event: ShowEvent;
  visual: AlertVisualConfig;
}>();

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function headline(): string {
  if (props.event.type === "sale") {
    return "SOLD!";
  }

  if (props.event.type === "bid") {
    return "NEW BID";
  }

  if (props.event.type === "tip") {
    return "TIP RECEIVED";
  }

  if (props.event.type === "share") {
    return props.event.delta && props.event.delta > 1 ? `${props.event.delta} NEW SHARES` : "SHOW SHARED";
  }

  if (props.event.action === "follow") {
    return "NEW FOLLOW";
  }

  if (props.event.action === "bookmark") {
    return "BOOKMARKED";
  }

  if (props.event.action === "chat") {
    return "CHAT BOOST";
  }

  return "HYPE HIT";
}

function primary(): string {
  if (props.event.type === "sale") {
    return `@${props.event.buyer}`;
  }

  if (props.event.type === "bid") {
    return `@${props.event.bidder}`;
  }

  if (props.event.type === "tip") {
    return `@${props.event.tipper}`;
  }

  if (props.event.type === "share") {
    return props.event.actor ? `@${props.event.actor}` : "COMMUNITY BOOST";
  }

  return `@${props.event.actor}`;
}

function amount(): string | null {
  if (props.event.type === "sale" || props.event.type === "bid" || props.event.type === "tip") {
    return dollars.format(props.event.amount);
  }

  return null;
}

function detail(): string | undefined {
  if (props.event.type === "audience_action") {
    return props.event.message;
  }

  if (props.event.type === "tip") {
    return props.event.message;
  }

  if (props.event.type === "share") {
    return props.event.shareCount === undefined ? undefined : `${props.event.shareCount.toLocaleString()} total show shares`;
  }

  return props.event.item;
}

function eventMark(): string {
  if (props.event.type === "sale") {
    return "S";
  }

  if (props.event.type === "bid") {
    return "B";
  }

  if (props.event.type === "tip") {
    return "$";
  }

  if (props.event.type === "share") {
    return "SH";
  }

  return "+";
}

function eventCode(): string {
  const codes: Record<ShowEvent["type"], string> = {
    sale: "01",
    bid: "02",
    tip: "03",
    share: "04",
    audience_action: "05"
  };

  return codes[props.event.type];
}

function cardClass(): string[] {
  const visual = props.visual;
  return [
    `event-${props.event.type}`,
    `alert-place-${visual.placement}`,
    `alert-size-${visual.size}`,
    `alert-type-${visual.typography}`,
    usesThemeAlertArt(visual) ? "" : "alert-custom-art",
    visual.accent && visual.accent !== "theme" ? "alert-custom-accent" : ""
  ].filter(Boolean);
}

function accentStyle(): Record<string, string> | undefined {
  if (!props.visual.accent || props.visual.accent === "theme") {
    return undefined;
  }
  return { "--alert-accent": props.visual.accent };
}
</script>

<template>
  <section class="event-card" :class="cardClass()" :style="accentStyle()">
    <svg class="event-theme-art" viewBox="0 0 1016 140" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="event-fire-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#7a0c06" />
          <stop offset="0.28" stop-color="#ff3a12" />
          <stop offset="0.62" stop-color="#ff9a2a" />
          <stop offset="1" stop-color="#fff4c2" />
        </linearGradient>
        <linearGradient id="event-fire-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ffb347" stop-opacity="0" />
          <stop offset="0.35" stop-color="#ffe27a" />
          <stop offset="1" stop-color="#fffce8" />
        </linearGradient>
        <filter id="event-fire-flow" x="-20%" y="-80%" width="140%" height="260%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="3" seed="23" result="event-noise">
            <animate attributeName="baseFrequency" dur="4.8s" values="0.03 0.05;0.036 0.044;0.028 0.054;0.03 0.05" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="event-noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="event-storm-glow" x="-40%" y="-120%" width="180%" height="340%">
          <feGaussianBlur stdDeviation="4" result="event-bolt-blur" />
          <feMerge><feMergeNode in="event-bolt-blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g class="event-art-inferno" filter="url(#event-fire-flow)">
        <path class="event-flame-outer" d="M70 140 C54 108 48 74 62 42 C50 22 66-8 70-34 C82 0 100 28 86 50 C104 82 88 114 70 140Z" />
        <path class="event-flame-core" d="M70 128 C64 100 66 66 70 34 C76 66 78 100 70 128Z" />
        <path class="event-flame-outer" d="M210 140 C190 104 186 66 202 26 C188 2 206-32 210-62 C222-26 240 10 226 34 C244 74 228 112 210 140Z" />
        <path class="event-flame-core" d="M210 126 C202 94 206 54 210 18 C216 54 220 94 210 126Z" />
        <path class="event-flame-outer" d="M360 140 C342 110 336 76 350 42 C338 18 354-14 360-44 C370-10 388 22 374 48 C390 82 376 116 360 140Z" />
        <path class="event-flame-core" d="M360 128 C354 100 356 66 360 34 C366 66 368 100 360 128Z" />
        <path class="event-flame-outer" d="M508 140 C490 106 486 68 500 30 C488 6 506-28 508-58 C520-24 538 12 524 40 C540 78 524 114 508 140Z" />
        <path class="event-flame-core" d="M508 126 C500 94 504 54 508 20 C514 54 518 94 508 126Z" />
        <path class="event-flame-outer" d="M656 140 C638 110 632 76 646 42 C634 18 650-14 656-44 C666-10 684 22 670 48 C686 82 672 116 656 140Z" />
        <path class="event-flame-core" d="M656 128 C650 100 652 66 656 34 C662 66 664 100 656 128Z" />
        <path class="event-flame-outer" d="M806 140 C786 104 782 66 798 26 C784 2 802-32 806-62 C818-26 836 10 822 34 C840 74 824 112 806 140Z" />
        <path class="event-flame-core" d="M806 126 C798 94 802 54 806 18 C812 54 816 94 806 126Z" />
        <path class="event-flame-outer" d="M946 140 C930 108 924 74 938 42 C926 22 942-8 946-34 C958 0 976 28 962 50 C980 82 964 114 946 140Z" />
        <path class="event-flame-core" d="M946 128 C940 100 942 66 946 34 C952 66 954 100 946 128Z" />
      </g>
      <g class="event-art-storm" filter="url(#event-storm-glow)">
        <path pathLength="1" d="M580-8 L624 24 L612 48 L674 68 L660 94 L728 128" />
        <path pathLength="1" d="M624 24 L660 13 L694 24" />
        <path pathLength="1" d="M674 68 L710 55 L746 66" />
      </g>
    </svg>
    <span class="event-theme-ornament ornament-a" aria-hidden="true" />
    <span class="event-theme-ornament ornament-b" aria-hidden="true" />
    <span class="event-theme-ornament ornament-c" aria-hidden="true" />
    <div class="event-signal" aria-hidden="true">
      <span class="event-symbol">{{ eventMark() }}</span>
      <small>EVENT {{ eventCode() }}</small>
    </div>
    <div class="event-copy">
      <div class="event-kicker">{{ headline() }}</div>
      <div class="event-primary">{{ primary() }}</div>
      <div v-if="detail()" class="event-detail">{{ detail() }}</div>
    </div>
    <div v-if="amount()" class="event-amount">
      <small>USD</small>
      <strong>{{ amount() }}</strong>
    </div>
    <span class="event-sweep" aria-hidden="true" />
    <img v-if="visual.mediaUrl" class="event-alert-media" :src="visual.mediaUrl" alt="" />
  </section>
</template>
