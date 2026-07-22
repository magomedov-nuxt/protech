<template>
  <article role="listitem"
    class="group overflow-hidden bg-white shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/10"
    :class="compact ? 'rounded-2xl p-2' : 'rounded-2xl p-2 sm:rounded-3xl sm:p-3'">
    <div class="relative overflow-hidden bg-zinc-100"
      :class="compact ? 'rounded-xl' : 'rounded-xl sm:rounded-[1.45rem]'">
      <NuxtLink :to="`/product/${product.id}`" :aria-label="`Открыть товар ${product.name}`">
        <img :src="imageUrl" :alt="product.name"
          class="w-full object-cover transition duration-500 group-hover:scale-105"
          :class="isOutOfStock(product) ? 'opacity-60 grayscale' : ''"
          :style="{ aspectRatio: compact ? '1 / 1' : '3 / 4' }" :loading="imageLoading"
          :fetchpriority="imageFetchPriority" :srcset="imageSrcset" :sizes="imageSizes"
          :crossorigin="imageCrossorigin" decoding="async">
      </NuxtLink>

      <div class="absolute flex flex-wrap gap-2" :class="compact ? 'left-2 top-2' : 'left-2 top-2 sm:left-4 sm:top-4'">
        <UBadge v-if="discountPercent(product)" color="error" variant="solid" class="rounded-full">
          -{{ discountPercent(product) }}%
        </UBadge>
      </div>

      <UTooltip :text="favorite ? 'Убрать из избранного' : 'В избранное'">
        <UButton color="neutral" variant="soft" icon="i-lucide-heart" :size="compact ? 'md' : 'md'" square
          class="absolute !h-11 !w-11 rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur transition hover:scale-105 sm:!h-10 sm:!w-10"
          :class="[
            compact ? 'right-2 top-2' : 'right-2 top-2 sm:right-4 sm:top-4',
            favorite ? 'text-red-500' : ''
          ]" :loading="loadingFavorite"
          :aria-label="favorite ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`"
          @click="onToggleFavorite" />
      </UTooltip>

      <UButton :color="inCart ? 'error' : isOutOfStock(product) ? 'neutral' : 'primary'"
        :variant="inCart ? 'soft' : 'solid'" :icon="cartButtonIcon" :size="compact ? 'md' : 'md'"
        class="absolute min-h-12 justify-center rounded-full opacity-100 shadow-lg shadow-zinc-950/15 transition duration-300 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
        :class="[
          compact ? 'inset-x-2 bottom-2' : 'inset-x-2 bottom-2 sm:inset-x-4 sm:bottom-4',
          cartButtonClass
        ]" :disabled="!inCart && isOutOfStock(product)" :loading="loadingCart"
        :aria-label="cartAriaLabel"
        @click="onToggleCart">
        {{ cartButtonLabel }}
      </UButton>
    </div>

    <div :class="compact ? 'px-1.5 pb-2 pt-3' : 'px-2 pb-3 pt-4'">
      <div class="flex items-center justify-between gap-3">
        <p class="truncate text-xs font-medium uppercase text-zinc-400">
          {{ productBrand(product) }}
        </p>
      </div>

      <NuxtLink :to="`/product/${product.id}`"
        class="mt-2 line-clamp-2 font-semibold text-zinc-950 transition hover:text-emerald-700"
        :class="compact ? 'min-h-10 text-sm leading-5' : 'min-h-10 text-sm leading-5 sm:min-h-12 sm:text-base sm:leading-6'">
        {{ product.name }}
      </NuxtLink>

      <div class="flex items-end justify-between gap-3" :class="compact ? 'mt-3' : 'mt-4'">
        <div class="flex flex-wrap items-baseline gap-2">
          <span class="font-semibold" :class="[
            compact ? 'text-base' : 'text-base sm:text-lg',
            product.oldPrice ? 'text-red-600' : 'text-zinc-950'
          ]">
            {{ formatCurrency(product.currentPrice) }}
          </span>
          <span v-if="product.oldPrice" class="text-sm text-zinc-400 line-through">
            {{ formatCurrency(product.oldPrice) }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-xs text-zinc-500" :class="compact ? 'mt-2' : 'mt-3 sm:text-sm'">
        <UIcon name="i-lucide-star" class="size-4"
          :class="product.averageRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'" />
        <span class="font-medium text-zinc-700">{{ product.averageRating ?? "—" }}</span>
        <span>-</span>
        <span>{{ reviewCountLabel(product.reviewsCount ?? 0) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  discountPercent,
  isOutOfStock,
  productBrand
} from "~~/app/shared/lib/catalogProductHelpers";
import {
  productImageCrossorigin,
  productImageSrcset,
  productImageUrl
} from "~~/app/shared/lib/productImages";
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { ProductCardItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  favorite?: boolean;
  inCart?: boolean;
  cartQuantity?: number;
  loadingCart?: boolean;
  loadingFavorite?: boolean;
  compact?: boolean;
  priority?: boolean;
  product: ProductCardItem;
}>();

const emit = defineEmits<{
  toggleCart: [product: ProductCardItem];
  toggleFavorite: [product: ProductCardItem];
}>();

const imageUrl = computed(() =>
  productImageUrl(props.product.mainImage || "/favicon.ico", props.compact ? "thumbnail" : "card")
);
const imageSrcset = computed(() =>
  productImageSrcset(props.product.mainImage || "/favicon.ico", props.compact ? "thumbnail" : "card")
);
const imageCrossorigin = computed(() => productImageCrossorigin(props.product.mainImage || ""));
const imageLoading = computed(() => props.priority ? "eager" : "lazy");
const imageFetchPriority = computed(() => props.priority ? "high" : "auto");
const imageSizes = computed(() =>
  props.compact
    ? "(min-width: 640px) 160px, 50vw"
    : "(min-width: 1280px) 360px, (min-width: 1024px) 33vw, (min-width: 360px) 50vw, 100vw"
);
const cartButtonIcon = computed(() => {
  if (props.inCart) {
    return "i-lucide-trash-2";
  }

  if (isOutOfStock(props.product)) {
    return undefined;
  }

  return "i-lucide-shopping-bag";
});
const cartButtonLabel = computed(() => {
  if (props.inCart) {
    return "Удалить";
  }

  if (isOutOfStock(props.product)) {
    return props.compact ? "Нет" : "Нет в наличии";
  }

  return "В корзину";
});
const cartButtonClass = computed(() => {
  if (props.inCart) {
    return "bg-red-50/95 text-red-700 hover:bg-red-100";
  }

  if (isOutOfStock(props.product)) {
    return "!bg-zinc-950/90 !text-white disabled:!opacity-100 aria-disabled:!opacity-100";
  }

  return "";
});
const cartAriaLabel = computed(() => {
  if (props.inCart) {
    return `Удалить ${props.product.name} из корзины`;
  }

  if (isOutOfStock(props.product)) {
    return `${props.product.name} нет в наличии`;
  }

  return `Добавить ${props.product.name} в корзину`;
});

function onToggleCart() {
  emit("toggleCart", props.product);
}

function onToggleFavorite() {
  emit("toggleFavorite", props.product);
}

function reviewCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} отзыв`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} отзыва`;
  }

  return `${count} отзывов`;
}
</script>
