<template>
  <section class="rounded-lg border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5   ">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-lg font-semibold tracking-normal text-zinc-950">Товары</h3>
      <span class="text-sm font-medium text-zinc-500 ">
        {{ items.length }} позиций
      </span>
    </div>

    <div class="mt-3 divide-y divide-zinc-100 pb-1 ">
      <article v-for="item in items" :key="item.id"
        class="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-3 py-3 first:pt-0 last:pb-1">
        <img :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'" :alt="item.productName"
          class="size-13 rounded-lg object-cover">

        <div class="min-w-0">
          <NuxtLink v-if="item.productId" :to="`/product/${item.productId}`"
            class="line-clamp-2 text-sm font-semibold text-zinc-950 transition hover:text-emerald-700  ">
            {{ item.productName }}
          </NuxtLink>
          <p v-else class="line-clamp-2 text-sm font-semibold text-zinc-950 ">
            {{ item.productName }}
          </p>
          <p class="mt-1 text-xs leading-5 text-zinc-500 ">
            Арт. {{ item.productArticle }} · {{ item.quantity }} × {{ formatCurrency(item.price) }}
          </p>
        </div>

        <p class="whitespace-nowrap text-sm font-semibold text-zinc-950 ">
          {{ formatCurrency(item.lineTotal) }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { ShopOrder } from "~~/app/shared/types/shop";

defineProps<{
  items: ShopOrder["orderItems"];
}>();
</script>
