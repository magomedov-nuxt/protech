<template>
  <div class="grid min-h-64 place-items-center rounded-2xl border border-dashed border-zinc-200 bg-[#f9fafb] p-6 text-center sm:p-8">
    <div class="max-w-lg">
      <div v-if="icon || $slots.icon" class="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <slot name="icon">
          <UIcon v-if="icon" :name="icon" class="size-6" />
        </slot>
      </div>
      <h3 class="mt-4 text-lg font-semibold text-zinc-950">
        {{ title }}
      </h3>
      <p v-if="description" class="mt-2 text-sm leading-6 text-zinc-500">
        {{ description }}
      </p>
      <div v-if="$slots.actions" class="mt-5 flex flex-wrap justify-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
}>();
</script>
