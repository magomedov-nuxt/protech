<template>
  <section v-if="pending && !products.length" aria-busy="true" aria-label="Загрузка товаров"
    class="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
    <USkeleton v-for="item in 8" :key="item" class="h-90 rounded-2xl sm:h-140" />
  </section>

  <section v-else-if="products.length" aria-labelledby="catalog-results-heading" aria-live="polite"
    :aria-busy="pending" class="mt-6">
    <h2 id="catalog-results-heading" class="sr-only">Товары каталога</h2>
    <div v-auto-animate role="list"
      class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <ProductCatalogCard v-for="(product, index) in products" :key="product.id" :product="product"
        :favorite="favoriteProductIds.includes(product.id)" :in-cart="Boolean(cartItemByProductId(product.id))"
        :cart-quantity="cartItemByProductId(product.id)?.quantity ?? 0"
        :priority="index < 4"
        :loading-favorite="syncingFavoriteProductId === product.id" :loading-cart="syncingCartProductId === product.id"
        @toggle-cart="$emit('toggleCart', $event)" @toggle-favorite="$emit('toggleFavorite', $event)" />
    </div>
  </section>

  <section v-else role="status" aria-live="polite"
    class="mt-8 grid min-h-96 place-items-center rounded-4xl bg-white px-6 text-center shadow-sm shadow-zinc-950/5 ">
    <div>
      <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500  ">
        <UIcon name="i-lucide-search-x" class="size-7" />
      </div>
      <h2 class="mt-4 text-xl font-semibold tracking-normal">Товары не найдены</h2>
      <p class="mt-2 max-w-sm text-sm leading-6 text-zinc-500 ">
        Попробуйте расширить диапазон цены, убрать характеристику или изменить поисковый запрос.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CartItem, ProductCardItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  cartItems: CartItem[];
  favoriteProductIds: number[];
  pending: boolean;
  products: ProductCardItem[];
  syncingCartProductId: number | null;
  syncingFavoriteProductId: number | null;
}>();

defineEmits<{
  toggleCart: [product: ProductCardItem];
  toggleFavorite: [product: ProductCardItem];
}>();

function cartItemByProductId(productId: number) {
  return props.cartItems.find((item) => item.product.id === productId);
}
</script>
