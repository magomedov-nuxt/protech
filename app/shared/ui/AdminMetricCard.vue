<template>
  <article class="rounded-2xl bg-white p-4 shadow-sm shadow-zinc-950/5 sm:p-5">
    <div class="flex min-h-32 items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-zinc-500">
          {{ label }}
        </p>
        <div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <p class="text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            {{ value }}
          </p>
          <span v-if="delta" :class="[
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          ]">
            {{ delta }}
          </span>
        </div>
        <p v-if="hint" class="mt-3 text-xs leading-5 text-zinc-500">
          {{ hint }}
        </p>
      </div>

      <div class="grid size-12 shrink-0 place-items-center rounded-2xl" :class="iconClass">
        <slot name="icon" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  positive?: boolean;
  iconClass?: string;
}>();

const iconClass = computed(() =>
  props.iconClass ??
  props.positive === false
    ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700"
);
</script>
