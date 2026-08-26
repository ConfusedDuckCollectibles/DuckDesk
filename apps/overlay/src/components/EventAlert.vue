<script setup lang="ts">
import type { ShowEvent } from "@duck-desk/shared";

const props = defineProps<{
  event: ShowEvent;
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
</script>

<template>
  <section class="event-card" :class="`event-${event.type}`">
    <svg class="event-theme-art" viewBox="0 0 1016 140" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="event-fire-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff8c4" />
          <stop offset="0.32" stop-color="#ffc43d" />
          <stop offset="0.68" stop-color="#ff4b13" />
          <stop offset="1" stop-color="#a90e07" stop-opacity="0.16" />
        </linearGradient>
        <filter id="event-fire-flow" x="-20%" y="-80%" width="140%" height="260%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.07" numOctaves="2" seed="23" result="event-noise">
            <animate attributeName="baseFrequency" dur="1.8s" values="0.012 0.07;0.02 0.095;0.01 0.064" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="event-noise" scale="21" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="event-storm-glow" x="-40%" y="-120%" width="180%" height="340%">
          <feGaussianBlur stdDeviation="4" result="event-bolt-blur" />
          <feMerge><feMergeNode in="event-bolt-blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g class="event-art-inferno" filter="url(#event-fire-flow)">
        <path d="M-20 140V104 C24 128 42 46 82 106 C112 134 137 24 180 98 C211 137 246 42 282 102 C314 136 352 12 398 94 C432 139 468 38 510 100 C546 138 582 22 628 96 C666 137 704 35 744 101 C778 137 816 18 864 96 C904 136 934 48 974 106 C996 124 1020 93 1040 82V140Z" />
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
  </section>
</template>
