<template>
  <section class="space-y-3">
    <ProductSectionHeading eyebrow="Описание"
      title="Описание товара"
    />

    <div class="rounded-2xl bg-[#f9fafb] p-4 shadow-sm shadow-zinc-950/5 sm:p-5">
      <p class="whitespace-pre-line text-base leading-7 text-zinc-600"
        :class="!expanded && isLongDescription ? 'line-clamp-5' : ''"
      >
        {{ product.description }}
      </p>

      <UButton v-if="isLongDescription"
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="mt-3 rounded-full px-3 text-zinc-600 transition duration-300 hover:scale-[1.02] hover:bg-white"
        @click="toggleExpanded"
      >
        {{ expanded ? "Скрыть" : "Показать все" }}
      </UButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductDetails } from "~~/app/shared/types/shop";

const props = defineProps<{
  product: ProductDetails;
}>();

const descriptionLimit = 360;
const expanded = ref(false);
const isLongDescription = computed(() => props.product.description.trim().length > descriptionLimit);

watch(
  () => props.product.id,
  () => {
    expanded.value = false;
  }
);

function toggleExpanded() {
  expanded.value = !expanded.value;
}
</script>
