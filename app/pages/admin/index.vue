<template>
  <div class="analytics-shop-page space-y-5">
    <AdminPageHeader title="Аналитика и статистика" kicker="Аналитика"
      description="Финансы, продажи, маржинальность, популярные товары и складские сигналы в одном рабочем экране.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
        <UButton color="primary" variant="solid" icon="i-lucide-rotate-ccw" size="lg"
          class="h-12 justify-center rounded-full px-4 shadow-lg shadow-emerald-950/10"
          @click="filters.resetAnalyticsFilters()">
          Сбросить
        </UButton>
      </template>
    </AdminPageHeader>

    <section class="overflow-x-auto rounded-4xl bg-[#f9fafb]/90 p-2 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur">
      <div class="grid min-w-240 grid-cols-6 items-end gap-3 max-2xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        <UButton v-for="period in periodOptions" :key="period.value"
          :color="filters.analytics.preset === period.value ? 'primary' : 'neutral'"
          :variant="filters.analytics.preset === period.value ? 'solid' : 'ghost'" size="lg"
          class="h-12 w-full min-w-0 justify-center rounded-full px-3 text-sm font-medium"
          :class="filters.analytics.preset === period.value ? 'shadow-lg shadow-emerald-950/10' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950'"
          @click="filters.setAnalyticsPreset(period.value)">
          {{ period.label }}
        </UButton>

        <label class="block min-w-0">
          <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">С даты</span>
          <UInput v-model="filters.analytics.startDate" class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
            size="lg" type="date" variant="none" :ui="analyticsInputUi"
            @update:model-value="filters.analytics.preset = 'custom'" />
        </label>

        <label class="block min-w-0">
          <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">По дату</span>
          <UInput v-model="filters.analytics.endDate" class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
            size="lg" type="date" variant="none" :ui="analyticsInputUi"
            @update:model-value="filters.analytics.preset = 'custom'" />
        </label>

        <label class="block min-w-0">
          <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Категория</span>
          <USelect v-model="filters.analytics.categoryId"
            class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5" size="lg" color="neutral" variant="none"
            icon="i-lucide-layout-grid" :content="analyticsSelectContent" :items="categoryItems" :ui="analyticsSelectUi"
            placeholder="Все категории" />
        </label>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ analyticsStatusText }}
      </p>

      <div v-auto-animate class="flex flex-wrap gap-2">
        <UButton v-if="hasAnyAnalyticsFilter" color="neutral" variant="ghost" size="lg" icon="i-lucide-rotate-ccw"
          class="h-11 rounded-full bg-white px-4 text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="filters.resetAnalyticsFilters()">
          Сбросить
        </UButton>
        <UBadge v-if="selectedCategoryLabel" color="primary" variant="soft" class="max-w-full rounded-full px-3 py-1">
          <span class="truncate">{{ selectedCategoryLabel }}</span>
        </UBadge>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить аналитику"
      :description="getErrorMessage(error, 'Проверьте соединение и права доступа администратора.')"
      class="rounded-2xl" />

    <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <AdminMetricCard v-for="metric in metricTiles" :key="metric.key" :delta="metric.delta" :hint="metric.hint"
        :icon-class="metric.iconClass" :label="metric.label" :positive="metric.positive" :value="metric.value">
        <template #icon>
          <component :is="metric.icon" class="size-6" />
        </template>
      </AdminMetricCard>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <AdminBarChart title="Топ товаров по продажам" description="Название товара и количество проданных единиц"
        :items="topProductSalesBars" />

      <AdminBarChart title="Топ товаров по выручке" description="Название товара и выручка, которую он принес"
        :items="topProductBars" />
    </div>

    <div class="grid gap-4 2xl:grid-cols-[0.95fr_0.95fr_1.2fr]">
      <AdminDonutChart title="Методы оплаты" description="Сколько заказов и какая выручка пришли по каждому методу"
        center-label="заказов" :items="paymentMethodSlices" />
      <AdminDonutChart title="Получение" description="Доставка и самовывоз" center-label="заказов"
        :items="obtainingMethodSlices" />
      <AdminBarChart title="Категории по выручке" description="Категории, которые формируют оборот"
        :items="categoryBars" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Banknote,
  PackageX,
  ShoppingCart,
  TrendingUp
} from "@lucide/vue";
import {
  buildQuery,
  formatCurrency,
  formatNumber,
  formatPercent,
  getErrorMessage,
  obtainingMethodLabels,
  paymentMethodLabels
} from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type {
  CategoryAnalyticsResponse,
  DashboardStats,
  DashboardStatsResponse,
  ProductAnalyticsResponse,
  SalesAnalyticsResponse
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();

const periodOptions = [
  { label: "7 дней", value: "7" as const },
  { label: "30 дней", value: "30" as const },
  { label: "Произвольно", value: "custom" as const }
];

const analyticsSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const analyticsSelectUi = {
  base: "h-12 rounded-full bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const analyticsInputUi = {
  base: "h-12 rounded-full bg-transparent font-medium text-zinc-700"
};

const analyticsQuery = computed(() => buildQuery({
  startDate: filters.analytics.startDate,
  endDate: filters.analytics.endDate,
  categoryId: filters.analytics.categoryId,
  limit: filters.analytics.limit
}));

const { data, pending, error, refresh } = await useAsyncData("admin-analytics-bundle", async () => {
  const [dashboard, sales, products, categories] = await Promise.all([
    adminFetch<DashboardStatsResponse>("/api/admin/dashboard/stats"),
    adminFetch<SalesAnalyticsResponse>(`/api/admin/analytics/sales${analyticsQuery.value}`),
    adminFetch<ProductAnalyticsResponse>(`/api/admin/analytics/products${analyticsQuery.value}`),
    adminFetch<CategoryAnalyticsResponse>(`/api/admin/analytics/categories${analyticsQuery.value}`)
  ]);

  return {
    dashboard,
    sales,
    products,
    categories
  };
}, {
  watch: [analyticsQuery]
});

const emptyStats: DashboardStats = {
  reviewsPending: 0,
  lowStock: 0
};

const dashboardStats = computed(() => data.value?.dashboard.stats ?? emptyStats);
const salesTotals = computed(() => data.value?.sales.totals ?? {
  orders: 0,
  quantity: 0,
  revenue: 0,
  grossProfit: 0,
  averageOrderValue: 0,
  grossMargin: 0
});

const categoryItems = computed(() => [
  { label: "Все категории", value: null },
  ...(data.value?.sales.categoryOptions ?? []).map((category) => ({
    label: category.name,
    value: category.id
  }))
]);
const selectedCategoryLabel = computed(() => {
  if (!filters.analytics.categoryId) {
    return "";
  }

  return categoryItems.value.find((item) => item.value === filters.analytics.categoryId)?.label ?? "";
});

const analyticsStatusText = computed(() =>
  `Период: ${formatDateKey(filters.analytics.startDate)} - ${formatDateKey(filters.analytics.endDate)}`
);
const hasAnyAnalyticsFilter = computed(() =>
  filters.analytics.preset !== "30" ||
  filters.analytics.categoryId !== null
);
const metricTiles = computed(() => [
  {
    key: "revenue",
    label: "Выручка за период",
    value: formatCurrency(salesTotals.value.revenue),
    hint: `Оплаченные заказы: ${formatNumber(salesTotals.value.orders)}`,
    positive: salesTotals.value.revenue > 0,
    icon: Banknote,
    iconClass: "bg-emerald-100 text-emerald-700"
  },
  {
    key: "profit",
    label: "Валовая прибыль",
    value: formatCurrency(salesTotals.value.grossProfit),
    delta: formatPercent(salesTotals.value.grossMargin),
    hint: "Маржа считается по себестоимости из заказов.",
    positive: salesTotals.value.grossProfit >= 0,
    icon: TrendingUp,
    iconClass: "bg-sky-100 text-sky-700"
  },
  {
    key: "quantity",
    label: "Продано товаров",
    value: formatNumber(salesTotals.value.quantity),
    hint: `Средний чек: ${formatCurrency(salesTotals.value.averageOrderValue)}`,
    positive: true,
    icon: ShoppingCart,
    iconClass: "bg-amber-100 text-amber-700"
  },
  {
    key: "stock",
    label: "Складские риски",
    value: formatNumber(dashboardStats.value.lowStock),
    hint: `${formatNumber(dashboardStats.value.reviewsPending)} отзывов ждут ответа`,
    positive: dashboardStats.value.lowStock === 0,
    icon: PackageX,
    iconClass: dashboardStats.value.lowStock === 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
  }
]);
const productAnalytics = computed(() => data.value?.products.items ?? []);
const topProductBars = computed(() => productAnalytics.value.slice(0, 8).map((product) => ({
  label: product.name,
  value: product.revenue,
  formatted: formatCurrency(product.revenue)
})));
const topProductSalesBars = computed(() => [...productAnalytics.value]
  .sort((a, b) => b.quantity - a.quantity)
  .slice(0, 8)
  .map((product) => ({
    label: product.name,
    value: product.quantity,
    formatted: `${formatNumber(product.quantity)} шт.`
  })));
const categoryBars = computed(() => (data.value?.categories.items ?? []).map((category) => ({
  label: category.categoryName,
  value: category.revenue,
  formatted: formatCurrency(category.revenue)
})));
const paymentMethodSlices = computed(() => (data.value?.sales.breakdowns.paymentMethod ?? []).map((item) => ({
  label: `${paymentMethodLabels[item.paymentMethod] ?? item.paymentMethod} · ${formatCurrency(item.revenue)}`,
  value: item.orders
})));
const obtainingMethodSlices = computed(() => (data.value?.sales.breakdowns.obtainingMethod ?? []).map((item) => ({
  label: obtainingMethodLabels[item.obtainingMethod] ?? item.obtainingMethod,
  value: item.orders
})));

function formatDateKey(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}
</script>

<style scoped>
.analytics-shop-page :deep(.admin-card) {
  border: 0;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(24 24 27 / 5%);
}

.analytics-shop-page :deep(.admin-section-heading) {
  color: #18181b;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
}

.analytics-shop-page :deep(.admin-section-copy) {
  color: #71717a;
  line-height: 1.5rem;
}

.analytics-shop-page :deep(.admin-card table thead) {
  background: #ffffff;
}

.analytics-shop-page :deep(.admin-card table tbody tr:hover) {
  background: #ffffff;
}

.analytics-shop-page :deep(.admin-card svg:not(.admin-line-chart-svg)) {
  max-width: 100%;
}

@media (min-width: 640px) {
  .analytics-shop-page :deep(.admin-card) {
    border-radius: 1.5rem;
  }
}
</style>
