<template>
  <div class="products-shop-page space-y-5">
    <AdminPageHeader title="Товары" kicker="Каталог"
      description="Создание, редактирование, медиа, цены, категории, характеристики и видимость товаров в магазине.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
        <UButton color="primary" variant="solid" icon="i-lucide-plus" size="lg"
          class="h-12 justify-center rounded-full px-4 shadow-lg shadow-emerald-950/10" @click="openCreate">
          Добавить товар
        </UButton>
      </template>
    </AdminPageHeader>

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)_minmax(11rem,14rem)]">
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Поиск</span>
          <UInput v-model="filters.products.search" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="lg" placeholder="Название или артикул" variant="none" :ui="productsInputUi">
            <template #leading>
              <Search class="size-4 text-zinc-400" />
            </template>
          </UInput>
        </label>
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Категория</span>
          <USelect v-model="filters.products.categoryId" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="lg" color="neutral" variant="none" icon="i-lucide-layout-grid" :content="productsSelectContent"
            :items="categoryFilterItems" placeholder="Все категории" :ui="productsSelectUi" />
        </label>
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Статус</span>
          <USelect v-model="filters.products.isActive" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="lg" color="neutral" variant="none" icon="i-lucide-circle-check" :content="productsSelectContent"
            :items="statusItems" :ui="productsSelectUi" />
        </label>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ productsStatusText }}
      </p>

      <div v-auto-animate class="flex flex-wrap gap-2">
        <UButton v-if="hasAnyProductsFilter" color="neutral" variant="ghost" size="lg" icon="i-lucide-rotate-ccw"
          class="h-11 rounded-full bg-white px-4 text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="resetProductsFilters">
          Сбросить
        </UButton>
        <UBadge v-if="filters.products.search" color="neutral" variant="soft" class="max-w-full rounded-full px-3 py-1">
          <span class="truncate">Поиск: {{ filters.products.search }}</span>
        </UBadge>
        <UBadge v-if="selectedCategoryLabel" color="primary" variant="soft" class="max-w-full rounded-full px-3 py-1">
          <span class="truncate">{{ selectedCategoryLabel }}</span>
        </UBadge>
        <UBadge v-if="selectedStatusFilterLabel" color="neutral" variant="soft" class="rounded-full px-3 py-1">
          {{ selectedStatusFilterLabel }}
        </UBadge>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить товары"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <section class="admin-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-(--admin-border) px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Список товаров
          </p>
          <p class="admin-section-copy">
            Быстрое редактирование, медиа и массовые операции.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label v-if="products.length"
            class="admin-check-target inline-flex items-center gap-2 rounded-full bg-[#f9fafb] px-3 py-2 text-sm font-medium text-zinc-600">
            <input v-model="allProductsOnPageSelected"
              class="admin-check-input rounded border-(--admin-border) accent-(--admin-accent)" type="checkbox"
              aria-label="Выбрать все товары на странице">
            Выбрать страницу
          </label>
          <UBadge color="neutral" variant="soft" class="rounded-md">
            {{ productsData?.pagination?.total ?? products.length }} товаров
          </UBadge>
        </div>
      </div>

      <div v-if="selectedProductIds.length"
        class="products-bulk-bar flex flex-wrap items-end justify-between gap-3 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Выбрано товаров: {{ selectedProductIds.length }}
          </p>
          <p class="admin-section-copy">
            Массовые операции применяются к выбранным строкам текущей выдачи.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UButton color="primary" variant="soft" size="lg" class="h-11 px-4" :loading="bulkLoading === 'activate'" @click="bulkSetActive(true)">
            <CheckCircle2 class="size-4" />
            Включить
          </UButton>
          <UButton color="neutral" variant="soft" size="lg" class="h-11 px-4" :loading="bulkLoading === 'deactivate'" @click="bulkSetActive(false)">
            <CircleOff class="size-4" />
            Выключить
          </UButton>
          <UButton color="error" variant="soft" size="lg" class="h-11 px-4" :loading="bulkLoading === 'delete'" @click="confirmBulkDelete">
            <Trash2 class="size-4" />
            Удалить
          </UButton>
        </div>
      </div>

      <div v-if="products.length" class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <article v-for="product in products" :key="product.id"
          class="admin-product-card group grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)] sm:block sm:p-1">
          <div class="relative h-full min-h-44 overflow-hidden rounded-xl bg-zinc-100 sm:h-auto sm:min-h-0 sm:rounded-xl">
            <img :src="product.mainImage || '/favicon.ico'" :alt="product.name"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105 sm:h-auto"
              :class="stockQuantity(product) <= 0 ? 'opacity-60 grayscale' : ''" style="aspect-ratio: 3 / 4;"
              loading="lazy">
            <label class="admin-check-target absolute right-2 top-2 grid cursor-pointer place-items-center rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur transition hover:scale-105 sm:right-4 sm:top-4">
              <input :checked="selectedProductIds.includes(product.id)"
                class="admin-check-input rounded border-(--admin-border) accent-(--admin-accent)" type="checkbox"
                :aria-label="`Выбрать товар ${product.name}`" @change="toggleProductSelection(product.id, $event)">
            </label>
          </div>

          <div class="px-1 py-1 sm:px-2 sm:pb-3 sm:pt-4">
            <div class="flex items-center justify-between gap-3">
              <AdminStatusBadge type="boolean" :value="product.isActive" />
            </div>

            <p class="mt-2 line-clamp-3 min-h-0 text-sm font-semibold leading-5 text-zinc-950 sm:line-clamp-2 sm:min-h-12 sm:text-base sm:leading-6">
              {{ product.name }}
            </p>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-2">
                  <span class="font-semibold" :class="product.oldPrice ? 'text-red-600' : 'text-zinc-950'">
                    {{ formatCurrency(product.currentPrice) }}
                  </span>
                  <span v-if="product.oldPrice" class="text-sm text-zinc-400 line-through">
                    {{ formatCurrency(product.oldPrice) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 grid w-full grid-cols-3 gap-2">
              <UButton color="neutral" variant="ghost" icon="i-lucide-pencil"
                class="admin-touch-icon h-11 w-11 min-w-0 justify-self-center rounded-full bg-zinc-50 p-0 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 sm:!w-full sm:justify-self-stretch sm:!rounded-xl"
                aria-label="Редактировать товар" @click="openEdit(product.id)" />

              <UButton color="neutral" variant="ghost" icon="i-lucide-image"
                class="admin-touch-icon h-11 w-11 min-w-0 justify-self-center rounded-full bg-zinc-50 p-0 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 sm:!w-full sm:justify-self-stretch sm:!rounded-xl"
                aria-label="Редактировать изображения товара" @click="openMediaEditor(product.id)" />

              <UButton color="error" variant="soft" icon="i-lucide-trash-2"
                class="admin-touch-icon h-11 w-11 min-w-0 justify-self-center rounded-full p-0 sm:!w-full sm:justify-self-stretch sm:!rounded-xl"
                aria-label="Удалить товар" :loading="deletingId === product.id" @click="deleteProduct(product)" />
            </div>
          </div>
        </article>
      </div>

      <AdminEmptyState v-if="!products.length && !pending" title="Товары не найдены"
        description="Измените фильтры или создайте новый товар.">
        <template #icon>
          <PackageSearch class="size-6" />
        </template>
        <template #actions>
          <UButton color="primary" size="lg" class="h-11 rounded-full px-4" @click="openCreate">
            Добавить товар
          </UButton>
        </template>
      </AdminEmptyState>

      <AdminPagination v-if="productsData?.pagination" :pagination="productsData.pagination" :loading="pending"
        @update:page="page = $event" />
    </section>

    <ProductEditorModal v-model:open="editorOpen" :product-id="selectedProductId" :categories="categories"
      :attributes="attributes" @saved="handleSaved" @dictionaries-updated="refreshDictionaries" />

    <ProductMediaEditorModal v-model:open="mediaEditorOpen" :product-id="selectedMediaProductId" @saved="handleSaved" />

    <AdminConfirmModal v-model:open="confirmOpen" v-bind="confirmOptions" :loading="confirmLoading"
      @confirm="runConfirmedAction" />
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, CircleOff, PackageSearch, Search, Trash2 } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import {
  buildQuery,
  formatCurrency,
  formatNumber,
  getErrorMessage
} from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import { useAdminConfirmation } from "~~/app/shared/lib/useAdminConfirmation";
import type {
  Attribute,
  Category,
  PaginatedResponse,
  ProductListItem
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const debouncedSearch = ref(filters.products.search);
const editorOpen = ref(false);
const selectedProductId = ref<number | null>(null);
const mediaEditorOpen = ref(false);
const selectedMediaProductId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const selectedProductIds = ref<number[]>([]);
const bulkLoading = ref<string | null>(null);
const {
  confirmLoading,
  confirmOpen,
  confirmOptions,
  requestConfirm,
  runConfirmedAction
} = useAdminConfirmation();

watchDebounced(
  () => filters.products.search,
  (value) => {
    debouncedSearch.value = value;
    page.value = 1;
  },
  { debounce: 350, maxWait: 1000 }
);

watch(
  () => [filters.products.categoryId, filters.products.isActive],
  () => {
    page.value = 1;
  }
);

const productsQuery = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  categoryId: filters.products.categoryId,
  isActive: filters.products.isActive === "all" ? null : filters.products.isActive
}));

const { data: dictionaries, refresh: refreshDictionaries } = await useAsyncData("admin-product-dictionaries", async () => {
  const [categories, attributes] = await Promise.all([
    adminFetch<Category[]>("/api/admin/categories"),
    adminFetch<Attribute[]>("/api/admin/products/attributes")
  ]);

  return { categories, attributes };
});

const { data: productsData, pending, error, refresh } = await useAsyncData(
  "admin-products-list",
  () => adminFetch<PaginatedResponse<ProductListItem>>(`/api/admin/products${productsQuery.value}`),
  { watch: [productsQuery] }
);

const products = computed(() => productsData.value?.items ?? []);
const categories = computed(() => dictionaries.value?.categories ?? []);
const attributes = computed(() => dictionaries.value?.attributes ?? []);

const categoryFilterItems = computed(() => [
  { label: "Все категории", value: null },
  ...categories.value.map((category) => ({ label: category.name, value: category.id }))
]);
const statusItems = [
  { label: "Все", value: "all" },
  { label: "Активные", value: "true" },
  { label: "Выключенные", value: "false" }
];
const productsSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const productsSelectUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const productsInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};
const selectedCategoryLabel = computed(() => {
  if (!filters.products.categoryId) {
    return "";
  }

  return categoryFilterItems.value.find((item) => item.value === filters.products.categoryId)?.label ?? "";
});
const selectedStatusFilterLabel = computed(() => {
  if (filters.products.isActive === "all") {
    return "";
  }

  return statusItems.find((item) => item.value === filters.products.isActive)?.label ?? "";
});
const hasAnyProductsFilter = computed(() =>
  filters.products.search.trim() !== "" ||
  filters.products.categoryId !== null ||
  filters.products.isActive !== "all"
);
const productsStatusText = computed(() => {
  const pagination = productsData.value?.pagination;

  if (!pagination) {
    return pending.value ? "Загружаем товары..." : "Нет данных по товарам";
  }

  if (pagination.total === 0) {
    return "По текущим фильтрам товары не найдены";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return `Показаны ${formatNumber(start)}-${formatNumber(end)} из ${formatNumber(pagination.total)} товаров`;
});
const allProductsOnPageSelected = computed({
  get: () => products.value.length > 0 && products.value.every((product) => selectedProductIds.value.includes(product.id)),
  set: (checked: boolean) => {
    const pageIds = products.value.map((product) => product.id);
    selectedProductIds.value = checked
      ? [...new Set([...selectedProductIds.value, ...pageIds])]
      : selectedProductIds.value.filter((id) => !pageIds.includes(id));
  }
});

watch(products, (items) => {
  const visibleIds = new Set(items.map((product) => product.id));
  selectedProductIds.value = selectedProductIds.value.filter((id) => visibleIds.has(id));
});

function stockQuantity(product: ProductListItem) {
  return product.productStocks[0]?.quantity ?? 0;
}

function resetProductsFilters() {
  filters.products.search = "";
  filters.products.categoryId = null;
  filters.products.isActive = "all";
  debouncedSearch.value = "";
  page.value = 1;
}

function openCreate() {
  selectedProductId.value = null;
  editorOpen.value = true;
}

function openEdit(productId: number) {
  selectedProductId.value = productId;
  editorOpen.value = true;
}

function openMediaEditor(productId: number) {
  selectedMediaProductId.value = productId;
  mediaEditorOpen.value = true;
}

async function handleSaved() {
  await refresh();
}

function toggleProductSelection(productId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedProductIds.value = checked
    ? [...new Set([...selectedProductIds.value, productId])]
    : selectedProductIds.value.filter((id) => id !== productId);
}

function deleteProduct(product: ProductListItem) {
  const verificationText = product.article || product.name;

  requestConfirm({
    title: "Удалить товар",
    description: "Действие нельзя отменить",
    message: `Вы удаляете товар "${product.name}".`,
    hint: product.article
      ? `Для защиты от случайного удаления введите артикул товара: ${product.article}`
      : "Для защиты от случайного удаления введите название товара.",
    verificationLabel: product.article ? "Введите артикул товара" : "Введите название товара",
    verificationPlaceholder: verificationText,
    verificationText,
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingId.value = product.id;

    try {
      await adminFetch(`/api/admin/products/delete/${product.id}`, {
        method: "POST"
      });
      toast.success("Товар удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить товар"));
    } finally {
      deletingId.value = null;
    }
  });
}

async function runBulkProducts(action: string, body: Record<string, unknown>) {
  bulkLoading.value = action;

  try {
    const result = await adminFetch<{ count: number }>("/api/admin/products/bulk", {
      method: "POST",
      body
    });
    toast.success(`Обновлено товаров: ${result.count}`);
    selectedProductIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовую операцию"));
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkSetActive(isActive: boolean) {
  await runBulkProducts(isActive ? "activate" : "deactivate", {
    action: isActive ? "activate" : "deactivate",
    productIds: selectedProductIds.value
  });
}

function confirmBulkDelete() {
  const verificationText = `удалить ${selectedProductIds.value.length}`;

  requestConfirm({
    title: "Удалить выбранные товары",
    message: `Удалить выбранные товары: ${selectedProductIds.value.length}?`,
    hint: "Если товары связаны с заказами, сервер остановит удаление.",
    verificationLabel: "Введите фразу для удаления выбранных товаров",
    verificationPlaceholder: verificationText,
    verificationText,
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    await runBulkProducts("delete", {
      action: "delete",
      productIds: selectedProductIds.value
    });
  });
}
</script>

<style scoped>
.products-shop-page :deep(.admin-card) {
  border: 0;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(24 24 27 / 5%);
}

.products-shop-page :deep(.admin-section-heading) {
  color: #18181b;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
}

.products-shop-page :deep(.admin-section-copy) {
  color: #71717a;
  line-height: 1.5rem;
}

.products-bulk-bar {
  border-bottom: 1px solid var(--admin-border);
  background: color-mix(in srgb, var(--admin-accent-soft) 34%, white);
}

@media (min-width: 640px) {
  .products-shop-page :deep(.admin-card) {
    border-radius: 1.5rem;
  }
}
</style>
