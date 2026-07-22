<template>
  <section class="p-1 sm:p-0">
    <UBadge color="neutral"
      variant="soft"
      class="rounded-full bg-white px-2.5 py-1 text-zinc-600 shadow-sm shadow-zinc-950/5"
    >
      {{ brandName }}
    </UBadge>

    <h1 class="mt-3 text-2xl font-semibold leading-snug tracking-normal text-zinc-950 sm:text-3xl">
      {{ product.name }}
    </h1>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm shadow-zinc-950/5">
        <UIcon name="i-lucide-star"
          class="size-4 text-amber-400"
          :class="averageRating ? 'fill-amber-400' : ''"
        />
        <span class="font-semibold text-zinc-950">{{ averageRatingLabel }}</span>
        <span>{{ reviewCountLabel }}</span>
      </span>
    </div>

    <dl class="mt-5 space-y-2.5">
      <div v-for="item in details"
        :key="item.label"
        class="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 text-sm"
      >
        <dt class="text-zinc-400">{{ item.label }}</dt>
        <dd class="font-medium text-zinc-900">
          {{ item.value }}
        </dd>
      </div>

      <div v-if="product.ozonLink"
        class="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 text-sm"
      >
        <dt class="text-zinc-400">Ozon</dt>
        <dd>
          <NuxtLink :to="product.ozonLink"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            class="inline-flex items-center gap-1.5 font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            Открыть товар
            <UIcon name="i-lucide-external-link"
              class="size-3.5"
            />
          </NuxtLink>
        </dd>
      </div>
    </dl>

    <div v-if="visibleAttributes.length"
      class="mt-5"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-zinc-950">Характеристики</h2>
        <span class="text-xs font-medium text-zinc-400">
          {{ visibleAttributes.length }} из {{ product.productAttributes.length }}
        </span>
      </div>

      <dl class="mt-3 space-y-2">
        <div v-for="attribute in visibleAttributes"
          :key="attribute.id"
          class="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] gap-3 border-b border-dashed border-zinc-200 pb-2 text-sm last:border-b-0"
        >
          <dt class="truncate text-zinc-400">
            {{ attribute.attribute.name }}
          </dt>
          <dd class="truncate font-medium text-zinc-900">
            {{ formatProductAttribute(attribute) }}
          </dd>
        </div>
      </dl>
    </div>

    <UButton color="neutral"
      variant="soft"
      icon="i-lucide-list-checks"
      size="md"
      class="mt-5 min-h-11 rounded-full bg-white px-4 text-zinc-800 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-[1.02] hover:bg-zinc-100"
      @click="$emit('openDetails')"
    >
      Характеристики и описание
    </UButton>
  </section>
</template>

<script setup lang="ts">
import { formatProductAttribute } from "~~/app/entities/product/lib/productDetails";
import type { ProductDetails } from "~~/app/shared/types/shop";

const props = defineProps<{
  averageRating: number | null;
  averageRatingLabel: string;
  brandName: string;
  product: ProductDetails;
  stockQuantity: number;
}>();

defineEmits<{
  openDetails: [];
}>();

const reviewCountLabel = computed(() => `${props.product.reviews.length} ${pluralizeReview(props.product.reviews.length)}`);
const visibleAttributes = computed(() => props.product.productAttributes.slice(0, 8));
const details = computed(() => [
  {
    label: "Артикул",
    value: props.product.article || "—"
  },
  {
    label: "Категория",
    value: props.product.category.name
  },
  {
    label: "На складе",
    value: `${props.stockQuantity} шт.`
  }
]);

function pluralizeReview(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "оценка";
  }

  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) {
    return "оценки";
  }

  return "оценок";
}
</script>
