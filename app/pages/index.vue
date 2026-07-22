<template>
  <div class="min-h-screen bg-white/30 text-zinc-950">
    <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ProductCatalogHero :cart-total="cart.totalItems" />

      <ProductCatalogToolbar v-model:search="ui.catalog.search" v-model:category-id="ui.catalog.categoryId"
        v-model:sort="ui.catalog.sort" v-model:discount-only="ui.catalog.discountOnly"
        v-model:in-stock-only="ui.catalog.inStockOnly" :active-filter-count="activeDrawerFilterCount"
        :category-items="categoryItems" :sort-options="productCatalogSortOptions" @open-filters="openFilters" />

      <ProductCatalogActiveFilters :discount-only="ui.catalog.discountOnly" :has-any-filter="hasAnyFilter"
        :in-stock-only="ui.catalog.inStockOnly" :is-price-filtered="isPriceFiltered" :price-max="priceMax"
        :price-min="priceMin" :selected-attribute-labels="selectedAttributeLabels"
        :selected-category-name="selectedCategoryName" :status-text="catalogStatusText" @clear="clearAllFilters" />

      <UAlert v-if="error" color="error" variant="soft" icon="i-lucide-alert-circle" title="Не удалось загрузить товары"
        :description="getErrorMessage(error)" class="mt-6 rounded-3xl" />

      <ProductCatalogGrid :cart-items="cart.items" :favorite-product-ids="favorites.productIds" :pending="pending"
        :products="products" :syncing-cart-product-id="cart.syncingProductId"
        :syncing-favorite-product-id="favorites.syncingProductId" @toggle-cart="toggleCart"
        @toggle-favorite="toggleFavorite" />

      <div ref="loadMoreTarget" class="grid min-h-24 place-items-center py-6">
        <div v-if="loadingMore" class="flex items-center gap-3 text-sm text-zinc-500 ">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-emerald-600" />
          Подгружаю товары
        </div>
        <p v-else-if="products.length && reachedEnd" class="text-sm text-zinc-400">
          Все подходящие товары показаны
        </p>
      </div>
    </div>

    <ProductCatalogFiltersDrawer v-model:open="filtersOpen" v-model:price-range="priceRange" :attributes="attributes"
      :attributes-pending="attributesPending" :price-max="priceMax" :price-min="priceMin"
      :price-range-max="priceRangeMax" :price-range-min="priceRangeMin" :price-range-pending="priceRangePending"
      :selected-attributes="ui.catalog.attributes" @clear="clearAllFilters" @set-max-price="setMaxPrice"
      @set-min-price="setMinPrice" @toggle-attribute="toggleAttribute" />
  </div>
</template>

<script setup lang="ts">
import { isOutOfStock } from "~~/app/shared/lib/catalogProductHelpers";
import { getErrorMessage, toNumber } from "~~/app/shared/lib/shopFormatters";
import { useProductCatalog } from "~~/app/shared/lib/useProductCatalog";

const pageTitle = "Товары для экскаваторов Rippa";
const pageDescription = "Каталог товаров ПроТех76: запчасти, комплектующие и навесное оборудование для мини-экскаваторов Rippa с фильтрами по цене, наличию и характеристикам.";

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: "/logo.png",
  ogImageAlt: "Каталог товаров ПроТех76",
  ogType: "website",
  twitterCard: "summary_large_image"
});

const {
  activeDrawerFilterCount,
  attributes,
  attributesPending,
  cart,
  catalogStatusText,
  categoryItems,
  clearAllFilters,
  error,
  favorites,
  filtersOpen,
  hasAnyFilter,
  isPriceFiltered,
  loadMoreTarget,
  loadingMore,
  openFilters,
  pending,
  priceMax,
  priceMin,
  priceRange,
  priceRangeMax,
  priceRangeMin,
  priceRangePending,
  products,
  productCatalogSortOptions,
  reachedEnd,
  selectedAttributeLabels,
  selectedCategoryName,
  setMaxPrice,
  setMinPrice,
  toggleAttribute,
  toggleCart,
  toggleFavorite,
  ui
} = await useProductCatalog();

useSchemaOrg(computed(() => [
  defineItemList({
    name: pageTitle,
    description: pageDescription,
    itemListElement: products.value.slice(0, 24).map((product, index) =>
      defineListItem({
        position: index + 1,
        item: defineProduct({
          name: product.name,
          image: product.mainImage || "/logo.png",
          url: `/product/${product.id}`,
          category: product.category?.name,
          offers: defineOffer({
            price: toNumber(product.currentPrice),
            priceCurrency: "RUB",
            availability: isOutOfStock(product)
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition"
          }),
          ...(product.averageRating
            ? {
              aggregateRating: defineAggregateRating({
                ratingValue: product.averageRating,
                reviewCount: product.reviewsCount ?? 0,
                bestRating: 5,
                worstRating: 1
              })
            }
            : {})
        })
      })
    )
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: "Каталог", item: "/" }
    ]
  })
]));

if (import.meta.server) {
  defineOgImage("NuxtSeoSatori", {
    title: pageTitle,
    description: pageDescription
  });
}
</script>
