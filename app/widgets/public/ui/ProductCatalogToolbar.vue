<template>
  <section aria-label="Фильтры каталога" role="search" class="rounded-4xl bg-[#f9fafb]/90 p-2 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur  ">
    <div class="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_minmax(210px,260px)_auto] lg:items-center">
      <UInput v-model="search" icon="i-lucide-search" variant="none" size="lg"
        placeholder="Найти товар, бренд или описание" class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5 "
        aria-label="Поиск по каталогу"
        :ui="{
          base: 'h-12 rounded-full bg-transparent text-zinc-900 placeholder:text-zinc-400  ',
        }" />

      <USelectMenu v-model="categoryId" :items="categoryItems" value-key="id" label-key="name" :search-input="false"
        color="neutral" variant="none" size="lg" icon="i-lucide-layout-grid"
        :aria-label="categoryAriaLabel"
        class="min-w-0 rounded-full bg-white px-1 shadow-sm shadow-zinc-950/5 " :ui="selectUi" />

      <div class="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-stretch lg:justify-end">
        <USelectMenu v-model="sort" :items="sortOptions" value-key="value" label-key="label" :search-input="false"
          color="neutral" variant="none" size="lg" icon="i-lucide-arrow-up-down"
          :aria-label="sortAriaLabel"
          class="col-span-2 w-full rounded-full bg-white px-1 shadow-sm shadow-zinc-950/5 lg:w-48 lg:shrink-0 "
          :ui="sortUi" />

        <div
          class="flex h-12 min-w-0 items-center justify-between gap-2 rounded-full bg-white px-3 shadow-sm shadow-zinc-950/5">
          <span class="text-xs font-medium text-zinc-700 sm:text-sm">Со скидкой</span>
          <USwitch v-model="discountOnly" color="primary" checked-icon="i-lucide-badge-percent"
            aria-label="Показать товары со скидкой"
            unchecked-icon="i-lucide-x" />
        </div>

        <div
          class="flex h-12 min-w-0 items-center justify-between gap-2 rounded-full bg-white px-3 shadow-sm shadow-zinc-950/5">
          <span class="text-xs font-medium text-zinc-700 sm:text-sm">В наличии</span>
          <USwitch v-model="inStockOnly" color="primary" checked-icon="i-lucide-package-check"
            aria-label="Показать товары в наличии"
            unchecked-icon="i-lucide-layers-3" />
        </div>

        <UButton color="neutral" variant="ghost" size="lg" icon="i-lucide-sliders-horizontal"
          class="col-span-2 h-12 w-full justify-center rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 lg:w-auto"
          @click="$emit('openFilters')">
          Прочее
          <span v-if="activeFilterCount"
            class="ml-1 grid size-5 place-items-center rounded-full bg-zinc-950 text-xs text-white  ">
            {{ activeFilterCount }}
          </span>
        </UButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  ProductCatalogCategoryItem,
  ProductCatalogSort,
  ProductCatalogSortOption
} from "~~/app/shared/lib/catalogProductHelpers";

const props = defineProps<{
  activeFilterCount: number;
  categoryItems: ProductCatalogCategoryItem[];
  sortOptions: ProductCatalogSortOption[];
}>();

defineEmits<{
  openFilters: [];
}>();

const search = defineModel<string>("search", { required: true });
const categoryId = defineModel<number | null>("categoryId", { required: true });
const sort = defineModel<ProductCatalogSort>("sort", { required: true });
const discountOnly = defineModel<boolean>("discountOnly", { required: true });
const inStockOnly = defineModel<boolean>("inStockOnly", { required: true });

const selectedCategoryLabel = computed(() =>
  props.categoryItems.find((item) => item.id === categoryId.value)?.name ?? ""
);
const selectedSortLabel = computed(() =>
  props.sortOptions.find((item) => item.value === sort.value)?.label ?? ""
);
const categoryAriaLabel = computed(() => `${selectedCategoryLabel.value}, категория товара`);
const sortAriaLabel = computed(() => `${selectedSortLabel.value}, сортировка товаров`);

const selectUi = {
  base: "h-12 rounded-full bg-transparent",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 ",
  viewport: "p-1"
};
const sortUi = {
  base: "h-12 rounded-full bg-transparent",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 ",
  viewport: "p-1"
};
</script>
