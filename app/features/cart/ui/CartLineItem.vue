<template>
  <article class="group grid grid-cols-[104px_minmax(0,1fr)] gap-4 rounded-2xl bg-white/90 p-3 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-zinc-950/10 sm:grid-cols-[132px_minmax(0,1fr)] md:grid-cols-[132px_minmax(0,1fr)_220px] md:items-center lg:grid-cols-[148px_minmax(0,1fr)_260px]">
    <NuxtLink :to="`/product/${item.product.id}`"
      class="relative block aspect-square w-full overflow-hidden rounded-xl bg-white shadow-sm shadow-zinc-950/5"
    >
      <img :src="item.product.mainImage || '/favicon.ico'"
        :alt="item.product.name"
        class="size-full object-contain transition duration-500 group-hover:scale-105"
      >
      <span v-if="discountPercent"
        class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-sm shadow-zinc-950/10 backdrop-blur"
      >
        -{{ discountPercent }}%
      </span>
    </NuxtLink>

    <div class="grid min-w-0 content-between gap-3 md:min-h-32 lg:min-h-36">
      <div class="min-w-0">
        <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="stockMeta.class"
        >
          <span class="size-2 rounded-full"
            :class="stockMeta.dotClass"
          />
          {{ stockMeta.label }}
        </span>

        <NuxtLink :to="`/product/${item.product.id}`"
          class="mt-2 block line-clamp-3 text-base font-semibold tracking-normal text-zinc-950 transition hover:text-emerald-700 sm:line-clamp-2 sm:text-lg"
        >
          {{ item.product.name }}
        </NuxtLink>
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p class="text-lg font-semibold text-zinc-950">
            {{ formatCurrency(lineTotal) }}
          </p>
          <p v-if="originalLineTotal > lineTotal"
            class="text-xs text-zinc-400 line-through"
          >
            {{ formatCurrency(originalLineTotal) }}
          </p>
        </div>
        <p class="mt-0.5 text-xs text-zinc-500 sm:text-sm">
          {{ formatCurrency(item.product.currentPrice) }} за шт.
        </p>
      </div>
    </div>

    <div class="col-span-2 grid gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3 md:col-span-1 md:col-start-3 md:row-start-1 md:grid md:grid-cols-1 md:items-stretch">
      <div class="flex min-h-14 items-center justify-between gap-2 rounded-2xl bg-white p-1.5 shadow-sm shadow-zinc-950/5 sm:w-56 md:w-full">
        <button type="button"
          class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f3f4f6] text-zinc-700 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-emerald-700 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:bg-zinc-100 disabled:text-zinc-300"
          :disabled="loading || normalizedLocalQuantity <= 1"
          aria-label="Уменьшить количество"
          @click="changeQuantity(normalizedLocalQuantity - 1)"
        >
          <UIcon name="i-lucide-minus"
            class="size-4"
          />
        </button>

        <div class="grid min-w-14 place-items-center px-1">
          <input v-model="localQuantity"
            class="h-7 w-12 bg-transparent text-center text-lg font-semibold text-zinc-950 outline-none"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            :aria-label="`Количество товара ${item.product.name}`"
            @blur="commitQuantity"
            @keydown.enter.prevent="commitQuantity"
          >
          <span class="text-[10px] font-semibold uppercase text-zinc-400">шт</span>
        </div>

        <button type="button"
          class="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm shadow-emerald-950/15 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-emerald-800 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:bg-zinc-200 disabled:text-zinc-400"
          :disabled="loading || normalizedLocalQuantity >= maxQuantity"
          aria-label="Увеличить количество"
          @click="changeQuantity(normalizedLocalQuantity + 1)"
        >
          <UIcon name="i-lucide-plus"
            class="size-4"
          />
        </button>
      </div>

      <UTooltip text="Удалить из корзины">
        <UButton color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          size="md"
          class="min-h-12 justify-center whitespace-nowrap rounded-full bg-red-50/80 px-4 font-semibold transition duration-300 hover:scale-[1.02] md:w-full"
          :loading="loading"
          aria-label="Удалить из корзины"
          @click="$emit('remove', item.product.id)"
        >
          Удалить
        </UButton>
      </UTooltip>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { CartItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  item: CartItem;
  loading?: boolean;
}>();

const emit = defineEmits<{
  update: [productId: number, quantity: number];
  remove: [productId: number];
}>();

const localQuantity = ref<number | string>(props.item.quantity);
const maxQuantity = computed(() => Math.max(props.item.product.stockQuantity, 1));
const normalizedLocalQuantity = computed(() => normalizeQuantity(localQuantity.value));
const lineTotal = computed(() => toNumber(props.item.product.currentPrice) * props.item.quantity);
const originalLineTotal = computed(() => {
  const oldPrice = toNumber(props.item.product.oldPrice);

  return oldPrice > toNumber(props.item.product.currentPrice)
    ? oldPrice * props.item.quantity
    : lineTotal.value;
});
const discountPercent = computed(() => {
  const oldPrice = toNumber(props.item.product.oldPrice);
  const currentPrice = toNumber(props.item.product.currentPrice);

  if (oldPrice <= currentPrice) {
    return 0;
  }

  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
});
const stockMeta = computed(() => {
  if (!props.item.product.isActive || props.item.product.stockQuantity <= 0) {
    return {
      class: "bg-red-50 text-red-700  ",
      dotClass: "bg-red-500",
      label: "Нет в наличии"
    };
  }

  if (props.item.quantity > props.item.product.stockQuantity) {
    return {
      class: "bg-amber-50 text-amber-700  ",
      dotClass: "bg-amber-500",
      label: `Доступно ${props.item.product.stockQuantity} шт.`
    };
  }

  return {
    class: "bg-emerald-50 text-emerald-700  ",
    dotClass: "bg-emerald-500",
    label: `В наличии ${props.item.product.stockQuantity} шт.`
  };
});

watch(
  () => props.item.quantity,
  (quantity) => {
    localQuantity.value = quantity;
  }
);

function normalizeQuantity(value: number | string) {
  return Math.min(Math.max(Number(value) || 1, 1), maxQuantity.value, 99);
}

function changeQuantity(quantity: number) {
  localQuantity.value = normalizeQuantity(quantity);
  commitQuantity();
}

function commitQuantity() {
  const nextQuantity = normalizeQuantity(localQuantity.value);
  localQuantity.value = nextQuantity;

  if (nextQuantity !== props.item.quantity) {
    emit("update", props.item.product.id, nextQuantity);
  }
}
</script>
