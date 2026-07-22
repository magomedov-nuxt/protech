<template>
  <div class="rounded-xl bg-[#f9fafb] px-3 py-2.5 shadow-sm shadow-zinc-950/5"
    :class="interactive ? 'transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10' : ''"
  >
    <p class="text-xs leading-5 text-zinc-500">
      {{ label }}
    </p>
    <p class="mt-1 font-semibold text-zinc-950"
      :class="large ? 'text-base' : 'text-sm'"
    >
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  interactive?: boolean;
  label: string;
  large?: boolean;
  value: string;
}>(), {
  interactive: false,
  large: false
});
</script>
