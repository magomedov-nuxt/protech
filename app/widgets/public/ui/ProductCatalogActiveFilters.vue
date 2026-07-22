<template>
  <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-zinc-500 ">
      {{ statusText }}
    </p>

    <div v-auto-animate class="flex flex-wrap gap-2">
      <UButton v-if="hasAnyFilter" color="neutral" variant="ghost" size="sm" icon="i-lucide-rotate-ccw"
        class="rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100   "
        @click="$emit('clear')">
        Сбросить
      </UButton>
      <UBadge v-if="selectedCategoryName" color="neutral" variant="soft" class="rounded-full px-3 py-1">
        {{ selectedCategoryName }}
      </UBadge>
      <UBadge v-if="discountOnly" color="error" variant="soft" class="rounded-full px-3 py-1">
        Скидка
      </UBadge>
      <UBadge v-if="inStockOnly" color="primary" variant="soft" class="rounded-full px-3 py-1">
        В наличии
      </UBadge>
      <UBadge v-if="isPriceFiltered" color="neutral" variant="soft" class="rounded-full px-3 py-1">
        {{ formatCurrency(priceMin) }} - {{ formatCurrency(priceMax) }}
      </UBadge>
      <UBadge v-for="attribute in selectedAttributeLabels" :key="attribute.key" color="neutral" variant="soft"
        class="rounded-full px-3 py-1">
        {{ attribute.label }}
      </UBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductCatalogAttributeLabel } from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";

defineProps<{
  discountOnly: boolean;
  hasAnyFilter: boolean;
  inStockOnly: boolean;
  isPriceFiltered: boolean;
  priceMax: number;
  priceMin: number;
  selectedAttributeLabels: ProductCatalogAttributeLabel[];
  selectedCategoryName: string;
  statusText: string;
}>();

defineEmits<{
  clear: [];
}>();
</script>
