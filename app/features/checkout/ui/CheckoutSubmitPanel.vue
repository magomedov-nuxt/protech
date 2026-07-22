<template>
  <section class="rounded-[1.75rem] bg-zinc-950 p-4 text-white shadow-[0_22px_80px_rgba(15,23,42,0.16)] sm:p-5   ">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase text-white/50">К оплате</p>
        <p class="mt-1 text-3xl font-semibold tracking-normal">
          {{ formatCurrency(subtotal) }}
        </p>
      </div>

      <dl class="grid min-w-44 gap-2 text-sm">
        <div class="flex items-center justify-between gap-4">
          <dt class="text-white/55">Товаров</dt>
          <dd class="font-semibold">{{ totalItems }} шт.</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-white/55">Получение</dt>
          <dd class="font-semibold">{{ deliveryLabel }}</dd>
        </div>
      </dl>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div v-if="previewItems.length"
        class="flex items-center gap-3"
      >
        <div class="flex -space-x-2">
          <img v-for="item in previewItems"
            :key="item.id"
            :src="item.product.mainImage || '/favicon.ico'"
            :alt="item.product.name"
            class="size-10 rounded-2xl object-cover ring-2 ring-zinc-950 "
          >
        </div>
        <p class="text-xs text-white/55 ">
          {{ hiddenItemsCount > 0 ? `+${hiddenItemsCount} поз.` : "Все позиции видны" }}
        </p>
      </div>

      <UButton color="primary"
        size="xl"
        icon="i-lucide-check-circle-2"
        class="min-h-14 w-full justify-center rounded-full px-8 text-base font-semibold transition duration-300 hover:scale-[1.01] sm:w-auto sm:min-w-72"
        :loading="submitting"
        @click="emit('submit')"
      >
        Подтвердить заказ
      </UButton>
    </div>

    <UAlert v-if="submitError"
      color="error"
      variant="soft"
      :description="submitError"
      class="mt-4 rounded-3xl"
    />
  </section>
</template>

<script setup lang="ts">
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { CartItem } from "~~/app/shared/types/shop";

defineProps<{
  deliveryLabel: string;
  hiddenItemsCount: number;
  previewItems: CartItem[];
  submitError: string;
  submitting: boolean;
  subtotal: number;
  totalItems: number;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>
