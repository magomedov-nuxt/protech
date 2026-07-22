<template>
  <section class="rounded-2xl bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <UIcon name="i-lucide-receipt-text"
            class="size-3.5"
          />
          {{ totalItems }} шт.
        </p>
        <h2 class="mt-2 text-xl font-semibold tracking-normal text-zinc-950">{{ title }}</h2>
      </div>
      <UIcon name="i-lucide-shopping-bag"
        class="size-5 text-zinc-400"
      />
    </div>

    <div class="mt-4 rounded-xl bg-[#f9fafb] p-3">
      <p class="text-xs uppercase text-zinc-400">К оплате</p>
      <p class="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">
        {{ formatCurrency(subtotal) }}
      </p>
      <p v-if="savings > 0"
        class="mt-1 text-sm font-medium text-emerald-700"
      >
        Экономия {{ formatCurrency(savings) }}
      </p>
    </div>

    <dl class="mt-3 space-y-2 text-sm">
      <div v-for="row in rows"
        :key="row.label"
        class="flex items-center justify-between gap-3 rounded-xl bg-[#f9fafb] px-3 py-2"
      >
        <dt class="text-zinc-500">{{ row.label }}</dt>
        <dd class="font-semibold text-zinc-950">{{ row.value }}</dd>
      </div>
    </dl>

    <div v-if="items.length"
      v-auto-animate
      class="mt-3 space-y-2"
    >
      <div v-for="item in previewItems"
        :key="item.id"
        class="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl bg-[#f9fafb] p-2"
      >
        <img :src="item.product.mainImage || '/favicon.ico'"
          :alt="item.product.name"
          class="size-10 rounded-lg object-cover"
        >
        <div class="min-w-0">
          <p class="line-clamp-1 text-sm font-medium text-zinc-950 ">
            {{ item.product.name }}
          </p>
          <p class="mt-1 text-xs text-zinc-500 ">
            {{ item.quantity }} × {{ formatCurrency(item.product.currentPrice) }}
          </p>
        </div>
        <p class="text-sm font-semibold text-zinc-950 ">
          {{ formatCurrency(toNumber(item.product.currentPrice) * item.quantity) }}
        </p>
      </div>

      <div v-if="hiddenItemsCount > 0"
        class="rounded-xl bg-[#f3f4f6] px-3 py-2 text-sm font-medium text-zinc-500"
      >
        Еще {{ hiddenItemsCount }} позиций в корзине
      </div>
    </div>

    <slot name="actions" />
  </section>
</template>

<script setup lang="ts">
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { CartItem } from "~~/app/shared/types/shop";

const props = withDefaults(defineProps<{
  title?: string;
  items: CartItem[];
  subtotal: number;
  deliveryLabel?: string;
  previewLimit?: number;
}>(), {
  title: "Ваш заказ",
  deliveryLabel: "по тарифу",
  previewLimit: 3
});

const totalItems = computed(() => props.items.reduce((sum, item) => sum + item.quantity, 0));
const savings = computed(() => props.items.reduce((sum, item) => {
  const oldPrice = toNumber(item.product.oldPrice);
  const currentPrice = toNumber(item.product.currentPrice);

  return oldPrice > currentPrice
    ? sum + (oldPrice - currentPrice) * item.quantity
    : sum;
}, 0));
const previewItems = computed(() => props.items.slice(0, props.previewLimit));
const hiddenItemsCount = computed(() => Math.max(props.items.length - previewItems.value.length, 0));
const rows = computed(() => [
  {
    label: `Товары (${totalItems.value})`,
    value: formatCurrency(props.subtotal)
  },
  ...(savings.value > 0
    ? [{
        label: "Скидка",
        value: `-${formatCurrency(savings.value)}`
      }]
    : []),
  {
    label: "Доставка",
    value: props.deliveryLabel
  }
]);
</script>
