<template>
  <div class="grid min-h-96 place-items-center rounded-4xl bg-white/90 px-6 text-center shadow-sm shadow-zinc-950/5  ">
    <div class="max-w-sm">
      <div class="mx-auto grid size-16 place-items-center rounded-[1.5rem] bg-[#f3f4f6] text-zinc-500 shadow-inner shadow-zinc-950/5  ">
        <UIcon :name="icon" class="size-8" />
      </div>
      <h2 class="mt-5 text-2xl font-semibold tracking-normal text-zinc-950 ">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-2 text-sm leading-6 text-zinc-500 ">
        {{ description }}
      </p>
      <UButton v-if="actionLabel && actionTo"
        class="mt-6 min-h-12 rounded-full px-6 text-base font-semibold shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.02]"
        color="primary" size="lg" :to="actionTo" :icon="actionIcon">
        {{ actionLabel }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  actionIcon?: string;
  actionLabel?: string;
  actionTo?: string;
  description?: string;
  icon: string;
  title: string;
}>();
</script>
