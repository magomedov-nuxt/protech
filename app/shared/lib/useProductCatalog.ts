import { useIntersectionObserver, watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import {
  PRODUCT_CATALOG_PAGE_SIZE,
  isOutOfStock,
  productCatalogSortOptions
} from "~~/app/shared/lib/catalogProductHelpers";
import { buildQuery, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type {
  AttributeFilter,
  Category,
  ProductCardItem,
  ProductCatalogResponse,
  ProductPriceRange
} from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

export async function useProductCatalog() {
  const route = useRoute();
  const auth = useAuthStore();
  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const ui = useShopUiStore();
  const catalogFetchOptions = {
    forwardRequestHeaders: false,
    headers: import.meta.server ? useRequestHeaders(["cookie"]) : {}
  };

  const filtersOpen = ref(false);
  const page = ref(1);
  const debouncedSearch = ref(ui.catalog.search);
  const products = ref<ProductCardItem[]>([]);
  const catalogTotal = ref(0);
  const pending = ref(false);
  const loadingMore = ref(false);
  const reachedEnd = ref(false);
  const error = shallowRef<unknown>(null);
  const loadMoreTarget = ref<HTMLElement | null>(null);
  const requestVersion = ref(0);

  watchDebounced(
    () => ui.catalog.search,
    (value) => {
      debouncedSearch.value = value;
    },
    { debounce: 350, maxWait: 1000 }
  );

  watch(
    () => ui.catalog.categoryId,
    () => {
      ui.clearCatalogAttributeFilters();
    }
  );

  const categoriesAsyncData = useAsyncData(
    "shop-categories",
    () => shopFetch<Category[]>("/api/public/product/categories", catalogFetchOptions),
    { default: () => [] }
  );

  const attributeQuery = computed(() => buildQuery({
    categoryId: ui.catalog.categoryId
  }));

  const attributesAsyncData = useAsyncData(
    "shop-product-attributes",
    () => shopFetch<AttributeFilter[]>(`/api/public/product/attributes${attributeQuery.value}`, catalogFetchOptions),
    {
      watch: [attributeQuery],
      default: () => []
    }
  );
  const attributeSelectionKey = computed(() => JSON.stringify(ui.catalog.attributes));
  const priceRangeQuery = computed(() => buildQuery({
    search: debouncedSearch.value,
    categoryId: ui.catalog.categoryId,
    discountOnly: ui.catalog.discountOnly ? 1 : null,
    inStockOnly: ui.catalog.inStockOnly ? 1 : null,
    attributes: attributeSelectionKey.value === "[]" ? null : attributeSelectionKey.value
  }));
  const priceRangeAsyncData = useAsyncData(
    "shop-product-price-range",
    () => shopFetch<ProductPriceRange>(`/api/public/product/price-range${priceRangeQuery.value}`, catalogFetchOptions),
    {
      watch: [priceRangeQuery],
      default: () => ({ minPrice: 0, maxPrice: 0 })
    }
  );
  const { data: categoriesData } = categoriesAsyncData;
  const { data: attributesData, pending: attributesPending } = attributesAsyncData;
  const { data: priceRangeData, pending: priceRangePending } = priceRangeAsyncData;

  const categories = computed(() => categoriesData.value ?? []);
  const attributes = computed(() => attributesData.value ?? []);
  const categoryItems = computed(() => [
    { id: null, name: "Все категории" },
    ...categories.value
  ]);
  const selectedCategoryName = computed(() =>
    categories.value.find((category) => category.id === ui.catalog.categoryId)?.name ?? ""
  );
  const priceRangeMin = computed(() => Math.floor(Math.min(
    priceRangeData.value?.minPrice ?? 0,
    priceRangeData.value?.maxPrice ?? 0
  )));
  const priceRangeMax = computed(() => Math.ceil(Math.max(
    priceRangeData.value?.minPrice ?? 0,
    priceRangeData.value?.maxPrice ?? 0
  )));
  const isPriceFiltered = computed(() => ui.catalog.minPrice !== null || ui.catalog.maxPrice !== null);
  const selectedMinPrice = computed(() =>
    ui.catalog.minPrice === null ? null : clampPriceToAvailableRange(ui.catalog.minPrice)
  );
  const selectedMaxPrice = computed(() =>
    ui.catalog.maxPrice === null ? null : clampPriceToAvailableRange(ui.catalog.maxPrice)
  );
  const priceMin = computed(() => Math.min(
    selectedMinPrice.value ?? priceRangeMin.value,
    selectedMaxPrice.value ?? priceRangeMax.value
  ));
  const priceMax = computed(() => Math.max(
    selectedMinPrice.value ?? priceRangeMin.value,
    selectedMaxPrice.value ?? priceRangeMax.value
  ));
  const priceRange = computed({
    get: () => [priceMin.value, priceMax.value],
    set: (value: number[]) => {
      const min = normalizePriceInput(value[0]) ?? priceRangeMin.value;
      const max = normalizePriceInput(value[1]) ?? priceRangeMax.value;
      const nextMin = Math.min(min, max);
      const nextMax = Math.max(min, max);

      ui.catalog.minPrice = nextMin > priceRangeMin.value ? nextMin : null;
      ui.catalog.maxPrice = nextMax < priceRangeMax.value ? nextMax : null;
    }
  });

  const activeDrawerFilterCount = computed(() => ui.catalog.attributes.length + (isPriceFiltered.value ? 1 : 0));
  const hasAnyFilter = computed(() => Boolean(
    ui.catalog.search ||
    ui.catalog.categoryId ||
    ui.catalog.discountOnly ||
    ui.catalog.inStockOnly ||
    isPriceFiltered.value ||
    ui.catalog.attributes.length ||
    ui.catalog.sort !== "newest"
  ));
  const selectedAttributeLabels = computed(() => ui.catalog.attributes.map((selection) => {
    const attribute = attributes.value.find((item) => item.id === selection.attributeId);
    const name = attribute?.name ?? "Фильтр";

    return {
      key: `${selection.attributeId}-${selection.value}`,
      label: `${name}: ${selection.value}`
    };
  }));
  const catalogStatusText = computed(() => {
    if (pending.value && !products.value.length) {
      return "Загружаю товары из базы";
    }

    if (!catalogTotal.value) {
      return "0 товаров, все найденные";
    }

    const suffix = reachedEnd.value
      ? "все найденные"
      : `загружено ${products.value.length}`;

    return `${catalogTotal.value} товаров, ${suffix}`;
  });
  const filterSignature = computed(() => JSON.stringify({
    search: debouncedSearch.value,
    categoryId: ui.catalog.categoryId,
    sort: ui.catalog.sort,
    minPrice: ui.catalog.minPrice,
    maxPrice: ui.catalog.maxPrice,
    discountOnly: ui.catalog.discountOnly,
    inStockOnly: ui.catalog.inStockOnly,
    attributes: ui.catalog.attributes
  }));

  watch(
    [priceRangeMin, priceRangeMax, priceRangePending],
    ([, , pendingPriceRange]) => {
      if (!pendingPriceRange) {
        normalizeCatalogPriceFilters();
      }
    },
    { immediate: true }
  );

  watch(filterSignature, () => {
    void fetchProducts({ reset: true });
  });

  onMounted(async () => {
    const user = auth.user ?? await auth.fetchMe();

    if (user) {
      await cart.fetchCart();
    }
  });

  useIntersectionObserver(
    loadMoreTarget,
    ([entry]) => {
      if (entry?.isIntersecting) {
        void fetchProducts({ reset: false });
      }
    },
    {
      rootMargin: "640px 0px"
    }
  );

  await fetchProducts({ reset: true });

  function buildProductsQuery(pageNumber: number) {
    return buildQuery({
      page: pageNumber,
      search: debouncedSearch.value,
      categoryId: ui.catalog.categoryId,
      sort: ui.catalog.sort,
      minPrice: ui.catalog.minPrice,
      maxPrice: ui.catalog.maxPrice,
      discountOnly: ui.catalog.discountOnly ? 1 : null,
      inStockOnly: ui.catalog.inStockOnly ? 1 : null,
      attributes: attributeSelectionKey.value === "[]" ? null : attributeSelectionKey.value
    });
  }

  async function fetchProducts(options: { reset: boolean }) {
    if (!options.reset && (pending.value || loadingMore.value || reachedEnd.value)) {
      return;
    }

    const nextPage = options.reset ? 1 : page.value + 1;
    const currentVersion = requestVersion.value + 1;
    requestVersion.value = currentVersion;

    if (options.reset) {
      pending.value = true;
      reachedEnd.value = false;
    } else {
      loadingMore.value = true;
    }

    try {
      const response = await shopFetch<ProductCatalogResponse>(
        `/api/public/product${buildProductsQuery(nextPage)}`,
        catalogFetchOptions
      );

      if (requestVersion.value !== currentVersion) {
        return;
      }

      products.value = options.reset ? response.items : [...products.value, ...response.items];
      catalogTotal.value = response.pagination.total;
      page.value = nextPage;
      reachedEnd.value = products.value.length >= response.pagination.total || response.items.length < PRODUCT_CATALOG_PAGE_SIZE;
      error.value = null;
    } catch (err) {
      if (requestVersion.value === currentVersion) {
        error.value = err;
      }
    } finally {
      if (requestVersion.value === currentVersion) {
        pending.value = false;
        loadingMore.value = false;
      }
    }
  }

  function openFilters() {
    filtersOpen.value = true;
  }

  function closeFilters() {
    filtersOpen.value = false;
  }

  function clearAllFilters() {
    ui.resetCatalogFilters();
  }

  function isAttributeSelected(attributeId: number, value: string) {
    return ui.isCatalogAttributeSelected(attributeId, value);
  }

  function toggleAttribute(attributeId: number, value: string) {
    ui.toggleCatalogAttribute(attributeId, value);
  }

  function clampPriceToAvailableRange(value: number) {
    return Math.min(Math.max(Math.round(value), priceRangeMin.value), priceRangeMax.value);
  }

  function normalizePriceInput(value: string | number | null | undefined) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return null;
    }

    return clampPriceToAvailableRange(numberValue);
  }

  function normalizeCatalogPriceFilters() {
    const minPrice = ui.catalog.minPrice === null ? null : clampPriceToAvailableRange(ui.catalog.minPrice);
    const maxPrice = ui.catalog.maxPrice === null ? null : clampPriceToAvailableRange(ui.catalog.maxPrice);

    ui.catalog.minPrice = minPrice !== null && minPrice > priceRangeMin.value ? minPrice : null;
    ui.catalog.maxPrice = maxPrice !== null && maxPrice < priceRangeMax.value ? maxPrice : null;

    if (
      ui.catalog.minPrice !== null &&
      ui.catalog.maxPrice !== null &&
      ui.catalog.minPrice > ui.catalog.maxPrice
    ) {
      ui.catalog.minPrice = ui.catalog.maxPrice;
    }
  }

  function setMinPrice(value: string | number | null | undefined) {
    const nextPrice = normalizePriceInput(value);
    const minPrice = Math.min(nextPrice ?? priceRangeMin.value, priceMax.value);

    ui.catalog.minPrice = minPrice > priceRangeMin.value ? minPrice : null;
  }

  function setMaxPrice(value: string | number | null | undefined) {
    const nextPrice = normalizePriceInput(value);
    const maxPrice = Math.max(nextPrice ?? priceRangeMax.value, priceMin.value);

    ui.catalog.maxPrice = maxPrice < priceRangeMax.value ? maxPrice : null;
  }

  async function requireAuth() {
    if (auth.user || await auth.fetchMe()) {
      return true;
    }

    toast.info("Войдите, чтобы добавить товар в корзину или избранное");
    await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
    return false;
  }

  async function toggleCart(product: ProductCardItem) {
    if (!await requireAuth()) {
      return;
    }

    const productInCart = cart.items.some((item) => item.product.id === product.id);

    try {
      if (productInCart) {
        await cart.remove(product.id);
        toast.success("Товар удален из корзины");
        return;
      }

      if (isOutOfStock(product)) {
        toast.info("Товара нет в наличии, но его можно добавить в избранное");
        return;
      }

      await cart.add(product.id);
      toast.success("Товар добавлен в корзину");
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось обновить корзину"));
    }
  }

  async function toggleFavorite(product: ProductCardItem) {
    if (!await requireAuth()) {
      return;
    }

    try {
      await favorites.toggle(product.id);
      toast.success(favorites.isFavorite(product.id) ? "Товар в избранном" : "Товар удален из избранного");
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось обновить избранное"));
    }
  }

  return {
    activeDrawerFilterCount,
    attributes,
    attributesPending,
    cart,
    catalogTotal,
    catalogStatusText,
    categoryItems,
    clearAllFilters,
    closeFilters,
    error,
    favorites,
    filtersOpen,
    hasAnyFilter,
    isAttributeSelected,
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
  };
}
