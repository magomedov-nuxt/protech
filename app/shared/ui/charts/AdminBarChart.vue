<template>
  <div class="admin-card min-h-80 p-5">
    <div class="mb-5">
      <p class="admin-section-heading">
        {{ title }}
      </p>
      <p v-if="description" class="admin-section-copy">
        {{ description }}
      </p>
    </div>

    <div class="space-y-4">
      <div v-for="item in normalizedItems" :key="item.label"
        class="grid grid-cols-[minmax(120px,220px)_1fr_auto] items-center gap-4">
        <p class="truncate text-sm text-(--admin-text)">
          {{ item.label }}
        </p>
        <div class="h-2.5 overflow-hidden rounded-md bg-[#f3f4f6]">
          <div class="h-full rounded-md bg-(--admin-accent)" :style="{ width: `${item.percent}%` }" />
        </div>
        <p class="text-sm font-semibold text-(--admin-text)">
          {{ item.formatted }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from "~~/app/shared/lib/adminFormatters";

const props = defineProps<{
  title: string;
  description?: string;
  items: Array<{
    label: string;
    value: number;
    formatted?: string;
  }>;
}>();

const normalizedItems = computed(() => {
  const max = Math.max(1, ...props.items.map((item) => item.value));

  return props.items.map((item) => ({
    ...item,
    percent: Math.max(3, (item.value / max) * 100),
    formatted: item.formatted ?? formatNumber(item.value)
  }));
});
</script>
