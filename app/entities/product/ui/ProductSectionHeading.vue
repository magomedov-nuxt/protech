<template>
  <div>
    <p class="text-xs font-medium uppercase tracking-[0.16em] text-emerald-600">
      {{ eyebrow }}
    </p>
    <h2 class="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">
      {{ title }}
    </h2>
    <p v-if="description"
      class="mt-1 text-sm leading-6 text-zinc-500"
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string;
  eyebrow: string;
  title: string;
}>();
</script>
