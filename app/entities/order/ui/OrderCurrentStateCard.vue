<template>
  <section class="rounded-lg border border-zinc-200/80 bg-white p-4 pb-5 shadow-sm shadow-zinc-950/5   ">
    <div class="grid gap-3 sm:grid-cols-[44px_minmax(0,1fr)]">
      <div class="grid size-11 place-items-center rounded-lg" :class="state.class">
        <UIcon :name="state.icon" class="size-5" />
      </div>

      <div class="min-w-0">
        <p class="text-sm font-medium text-zinc-500">Текущий статус</p>
        <h2 class="mt-1 text-xl font-semibold tracking-normal text-zinc-950 ">
          {{ state.title }}
        </h2>
        <p class="mt-1 text-sm leading-6 text-zinc-500 ">
          {{ state.description }}
        </p>
        <p class="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#f3f4f6] px-3 py-2 text-sm font-medium text-zinc-700  ">
          <UIcon name="i-lucide-map-pin" class="size-4 text-zinc-400" />
          {{ locationText }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  locationText: string;
  state: {
    class: string;
    description: string;
    icon: string;
    title: string;
  };
}>();
</script>
