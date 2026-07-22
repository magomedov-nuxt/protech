<template>
  <div class="grid gap-4 rounded-[1.75rem] bg-[#f9fafb] p-4 transition duration-300 hover:bg-white hover:shadow-lg hover:shadow-zinc-950/5 sm:grid-cols-[88px_minmax(0,1fr)_auto]  ">
    <img :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'" :alt="item.productName"
      class="size-22 rounded-[1.35rem] object-cover">

    <div class="min-w-0">
      <NuxtLink v-if="item.productId" :to="`/product/${item.productId}`"
        class="line-clamp-2 font-semibold text-zinc-950 transition hover:text-emerald-700  ">
        {{ item.productName }}
      </NuxtLink>
      <p v-else class="line-clamp-2 font-semibold text-zinc-950 ">
        {{ item.productName }}
      </p>

      <div class="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 ">
        <span class="rounded-full bg-white px-3 py-1.5 shadow-sm shadow-zinc-950/5 ">
          Арт. {{ item.productArticle }}
        </span>
        <span class="rounded-full bg-white px-3 py-1.5 shadow-sm shadow-zinc-950/5 ">
          {{ item.quantity }} × {{ formatCurrency(item.price) }}
        </span>
      </div>
    </div>

    <div class="sm:text-right">
      <p class="text-sm text-zinc-400">Сумма</p>
      <p class="mt-1 text-xl font-semibold text-zinc-950 ">
        {{ formatCurrency(item.lineTotal) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { ShopOrder } from "~~/app/shared/types/shop";

defineProps<{
  item: ShopOrder["orderItems"][number];
}>();
</script>