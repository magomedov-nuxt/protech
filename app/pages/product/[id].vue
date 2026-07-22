<template>
  <div class="bg-white/30 text-zinc-950">
    <div class="mx-auto w-full max-w-370 px-4 pb-4 pt-0 sm:px-6 sm:py-4 lg:px-8 lg:py-6">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/" size="sm"
        class="mb-4 hidden rounded-full bg-[#f9fafb] px-3 text-zinc-600 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-[1.02] hover:bg-zinc-100 sm:inline-flex">
        В каталог
      </UButton>

      <div v-if="pending" class="grid items-start gap-5 xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)_340px] xl:gap-6">
        <USkeleton class="aspect-3/4 rounded-2xl" />
        <USkeleton class="h-80 rounded-2xl" />
        <USkeleton class="h-72 rounded-2xl" />
      </div>

      <UAlert v-else-if="error || !product" color="error" variant="soft" title="Товар не найден"
        :description="productErrorDescription" class="rounded-2xl" />

      <div v-else class="space-y-8 lg:space-y-10">
        <section class="grid items-start gap-5 xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)_340px] xl:gap-6">
          <ProductGallery :main-image="product.mainImage" :images="product.productImages" :alt="product.name" />

          <ProductDetailsSummary :product="product" :brand-name="brandName" :average-rating="averageRating"
            :average-rating-label="averageRatingLabel" :stock-quantity="stockQuantity"
            @open-details="detailsOpen = true" />

          <ProductPurchasePanel v-model:quantity="quantity" :product="product" :stock-quantity="stockQuantity"
            :stock-status="stockStatus" :discount-value="discountValue" :max-quantity="maxQuantity"
            :is-favorite="isFavorite" :is-in-cart="isInCart" :cart-syncing="cartSyncing"
            :favorite-syncing="favoriteSyncing" @add-to-cart="addToCart" @toggle-favorite="toggleFavorite"
            @update-cart-quantity="updateCartQuantity" />
        </section>

        <ProductDetailsDrawer v-model:open="detailsOpen" :product="product" :attributes="product.productAttributes" />

        <ProductPriceChart v-if="product.productPrices.length" :prices="product.productPrices" />

        <ProductReviews :product-id="product.id" :reviews="product.reviews" @refresh="refresh()" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProductPdp } from "~~/app/entities/product/model/useProductPdp";

const {
  addToCart,
  averageRating,
  averageRatingLabel,
  brandName,
  cartSyncing,
  discountValue,
  error,
  favoriteSyncing,
  isFavorite,
  isInCart,
  maxQuantity,
  pending,
  product,
  productErrorDescription,
  quantity,
  refresh,
  stockQuantity,
  stockStatus,
  toggleFavorite,
  updateCartQuantity
} = useProductPdp();

const detailsOpen = ref(false);
</script>
