<script setup lang="ts">
import type { SaleEvent } from "@duck-desk/shared";

defineProps<{
  sale: SaleEvent;
}>();

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
</script>

<template>
  <section class="sale-card">
    <div class="sale-title">SOLD!</div>
    <div class="sale-buyer">@{{ sale.buyer }}</div>
    <div class="sale-amount">{{ dollars.format(sale.amount) }}</div>
    <div v-if="sale.item" class="sale-item">{{ sale.item }}</div>
  </section>
</template>
