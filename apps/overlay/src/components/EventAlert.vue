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
</script>

<template>
  <section class="event-card" :class="`event-${event.type}`">
    <div class="event-main">
      <div class="event-kicker">{{ headline() }}</div>
      <div class="event-primary">{{ primary() }}</div>
      <div v-if="amount()" class="event-amount">{{ amount() }}</div>
    </div>
    <div v-if="detail()" class="event-detail">{{ detail() }}</div>
  </section>
</template>
