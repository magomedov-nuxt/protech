<template>
  <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div class="max-w-5xl">
      <p v-if="kicker" class="text-sm font-medium uppercase text-emerald-700">
        {{ kicker }}
      </p>
      <div>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
          {{ description }}
        </p>
      </div>
    </div>

    <div v-if="$slots.actions" class="grid w-full grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2 sm:w-auto sm:flex sm:flex-wrap sm:justify-end">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  kicker?: string;
}>();
</script>
