<template>
  <aside class="space-y-4">
    <OrderPaymentResumeCard :order="order" compact />

    <section class="rounded-lg border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5   ">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold tracking-normal text-zinc-950">Оплата</h3>
        <UIcon name="i-lucide-wallet-cards" class="size-5 text-zinc-400" />
      </div>

      <dl class="mt-3 space-y-3 text-sm">
        <div v-for="row in paymentRows" :key="row.label" class="flex justify-between gap-4">
          <dt class="text-zinc-500">{{ row.label }}</dt>
          <dd class="text-right font-medium text-zinc-950">{{ row.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="rounded-lg border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5   ">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold tracking-normal text-zinc-950">Получение</h3>
        <UIcon name="i-lucide-package-check" class="size-5 text-zinc-400" />
      </div>

      <dl class="mt-3 grid gap-3 text-sm">
        <div v-for="row in receivingRows" :key="row.label" class="rounded-lg bg-[#f3f4f6] p-3 ">
          <dt class="text-zinc-500">{{ row.label }}</dt>
          <dd class="mt-1 font-medium leading-5 text-zinc-950">{{ row.value }}</dd>
        </div>
      </dl>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { ShopOrder } from "~~/app/shared/types/shop";

type InfoRow = {
  label: string;
  value: string;
};

defineProps<{
  order: ShopOrder;
  paymentRows: InfoRow[];
  receivingRows: InfoRow[];
}>();
</script>
