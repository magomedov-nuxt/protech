<template>
  <div class="flex flex-col gap-3 border-t border-zinc-100 bg-[#f9fafb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-zinc-500">
      Страница {{ pagination.page }} из {{ Math.max(pagination.pages, 1) }} · всего {{ pagination.total }}
    </p>

    <div class="flex items-center gap-2">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="lg"
        class="h-11 rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
        :disabled="pagination.page <= 1 || loading" @click="$emit('update:page', pagination.page - 1)">
        Назад
      </UButton>
      <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right" size="lg"
        class="h-11 rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
        :disabled="pagination.page >= pagination.pages || loading || pagination.pages === 0"
        @click="$emit('update:page', pagination.page + 1)">
        Вперёд
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pagination } from "~~/app/shared/types/admin";

defineProps<{
  pagination: Pagination;
  loading?: boolean;
}>();

defineEmits<{
  "update:page": [page: number];
}>();
</script>
