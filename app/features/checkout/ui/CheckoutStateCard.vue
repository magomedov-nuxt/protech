<template>
  <section class="w-full max-w-xl rounded-[2rem] bg-white/90 px-6 py-12 text-center shadow-[0_24px_80px_rgba(15,23,42,0.07)]  ">
    <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500  ">
      <UIcon :name="icon"
        class="size-7"
      />
    </div>
    <h1 class="mt-5 text-2xl font-semibold tracking-normal text-zinc-950">
      {{ title }}
    </h1>
    <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500 ">
      {{ description }}
    </p>
    <UButton class="mt-6 rounded-full px-6"
      color="primary"
      :icon="buttonIcon"
      size="lg"
      :to="to"
    >
      {{ buttonLabel }}
    </UButton>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  buttonIcon: string;
  buttonLabel: string;
  description: string;
  icon: string;
  title: string;
  to: string;
}>();
</script>
