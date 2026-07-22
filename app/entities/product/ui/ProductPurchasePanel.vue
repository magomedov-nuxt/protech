<template>
  <aside class="lg:sticky lg:top-24 lg:self-start">
    <div class="rounded-2xl bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.09)] ring-1 ring-zinc-100 sm:p-5">
      <div class="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-medium"
        aria-live="polite"
        role="status"
        :class="stockStatus.shellClass"
      >
        <span class="relative flex size-2">
          <span v-if="stockQuantity > 0"
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            :class="stockStatus.pulseClass"
          />
          <span class="relative inline-flex size-2 rounded-full"
            :class="stockStatus.dotClass"
          />
        </span>
        {{ stockBadgeLabel }}
      </div>

      <div class="mt-4">
        <p class="text-xs font-medium uppercase text-zinc-400">Цена</p>
        <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p class="min-w-0 text-3xl font-semibold tracking-normal"
            :class="discountValue ? 'text-red-600' : 'text-zinc-950'"
          >
            {{ formatCurrency(product.currentPrice) }}
          </p>
          <p v-if="product.oldPrice"
            class="shrink-0 text-base text-zinc-400 line-through"
          >
            {{ formatCurrency(product.oldPrice) }}
          </p>
        </div>

        <UBadge v-if="discountValue"
          color="primary"
          variant="soft"
          class="mt-2 rounded-full px-2.5 py-1"
        >
          Хорошая цена
        </UBadge>
      </div>

      <div v-if="isInCart"
        class="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]"
      >
        <div class="grid grid-cols-[2.5rem_minmax(2.5rem,1fr)_2.5rem] items-center rounded-full bg-[#f3f4f6] p-1.5">
          <UButton color="neutral"
            variant="ghost"
            icon="i-lucide-minus"
            size="md"
            square
            class="size-10 justify-self-center rounded-full text-zinc-700 transition hover:scale-105 hover:bg-white"
            :disabled="quantity <= 1"
            aria-label="Уменьшить количество"
            @click="decrementQuantity"
          />
          <div v-auto-animate
            class="grid h-10 min-w-0 place-items-center text-center text-base font-semibold text-zinc-950"
          >
            {{ quantity }}
          </div>
          <UButton color="neutral"
            variant="ghost"
            icon="i-lucide-plus"
            size="md"
            square
            class="size-10 justify-self-center rounded-full text-zinc-700 transition hover:scale-105 hover:bg-white"
            :disabled="quantity >= maxQuantity || stockQuantity <= 0"
            aria-label="Увеличить количество"
            @click="incrementQuantity"
          />
        </div>

        <UButton color="error"
          variant="soft"
          size="lg"
          block
          class="min-h-12 whitespace-nowrap rounded-full bg-red-50 px-3 text-red-600 transition duration-300 hover:scale-[1.01] hover:bg-red-100"
          aria-label="Удалить товар из корзины"
          :loading="cartSyncing"
          @click="$emit('addToCart')"
        >
          Удалить
        </UButton>
      </div>

      <UButton v-else
        color="primary"
        size="lg"
        block
        class="mt-5 min-h-12 rounded-full shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.01]"
        :disabled="stockQuantity <= 0"
        :loading="cartSyncing"
        :aria-label="stockQuantity <= 0 ? `${product.name} нет в наличии` : `Добавить ${product.name} в корзину`"
        @click="$emit('addToCart')"
      >
        {{ stockQuantity <= 0 ? "Нет в наличии" : "Добавить в корзину" }}
      </UButton>

      <UButton color="neutral"
        variant="soft"
        size="lg"
        block
        :icon="isFavorite ? 'i-lucide-heart-off' : 'i-lucide-heart'"
        class="mt-2 min-h-12 rounded-full bg-[#f3f4f6] text-zinc-800 transition duration-300 hover:scale-[1.01] hover:bg-zinc-100"
        :class="isFavorite ? 'text-red-500' : ''"
        :loading="favoriteSyncing"
        :aria-label="isFavorite ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`"
        @click="$emit('toggleFavorite')"
      >
        {{ isFavorite ? "Убрать из избранного" : "Добавить в избранное" }}
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { ProductDetails } from "~~/app/shared/types/shop";
import type { ProductStockStatus } from "~~/app/entities/product/model/useProductPdp";

const props = defineProps<{
  cartSyncing: boolean;
  discountValue: number;
  favoriteSyncing: boolean;
  isFavorite: boolean;
  isInCart: boolean;
  maxQuantity: number;
  product: ProductDetails;
  stockQuantity: number;
  stockStatus: ProductStockStatus;
}>();

const emit = defineEmits<{
  addToCart: [];
  toggleFavorite: [];
  "update-cart-quantity": [quantity: number];
}>();

const quantity = defineModel<number>("quantity", { required: true });
const stockBadgeLabel = computed(() => props.stockQuantity > 0 ? `Осталось ${props.stockQuantity} шт.` : "Нет в наличии");

function decrementQuantity() {
  const nextQuantity = Math.max(quantity.value - 1, 1);
  quantity.value = nextQuantity;

  if (props.isInCart) {
    emit("update-cart-quantity", nextQuantity);
  }
}

function incrementQuantity() {
  const nextQuantity = Math.min(quantity.value + 1, props.maxQuantity);
  quantity.value = nextQuantity;

  if (props.isInCart) {
    emit("update-cart-quantity", nextQuantity);
  }
}
</script>
