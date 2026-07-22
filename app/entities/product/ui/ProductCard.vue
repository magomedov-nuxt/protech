<template>
  <ProductCatalogCard :product="product"
    :favorite="favorite"
    :in-cart="inCart"
    :cart-quantity="cartQuantity"
    :loading-cart="loadingCart"
    :loading-favorite="loadingFavorite"
    :compact="compact"
    @toggle-cart="$emit('toggle-cart', $event)"
    @toggle-favorite="$emit('toggle-favorite', $event)"
  />
</template>

<script setup lang="ts">
import type { ProductCardItem } from "~~/app/shared/types/shop";

defineProps<{
  product: ProductCardItem;
  favorite?: boolean;
  inCart?: boolean;
  cartQuantity?: number;
  loadingFavorite?: boolean;
  loadingCart?: boolean;
  compact?: boolean;
}>();

defineEmits<{
  "toggle-cart": [product: ProductCardItem];
  "toggle-favorite": [product: ProductCardItem];
}>();
</script>
