<template>
  <header class="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 px-4 py-4 backdrop-blur sm:px-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm text-zinc-500">
          Оформлен {{ formatDateTime(order.createdAt) }}
        </p>
        <p class="mt-1 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 ">
          <UIcon name="i-lucide-phone" class="size-4 text-zinc-400" />
          {{ order.customerPhone || "Телефон не указан" }}
        </p>
        <p v-if="order.recipientName || order.recipientPhone"
          class="mt-1 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 ">
          <UIcon name="i-lucide-user-round-check" class="size-4 text-zinc-400" />
          {{ recipientLabel }}
        </p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <OrderStatusPill type="order" :value="order.orderStatus" />
          <OrderStatusPill v-if="order.payment" type="payment" :value="order.payment.paymentStatus" />
        </div>
      </div>

      <div class="shrink-0 sm:text-right">
        <p class="text-sm text-zinc-500">Итого</p>
        <p class="mt-0.5 text-2xl font-semibold text-zinc-950 ">
          {{ formatCurrency(orderTotal) }}
        </p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { MoneyLike, ShopOrder } from "~~/app/shared/types/shop";

const props = defineProps<{
  order: ShopOrder;
  orderTotal: MoneyLike;
}>();

const recipientLabel = computed(() => [
  props.order.recipientName,
  props.order.recipientPhone
].filter(Boolean).join(" · "));
</script>
