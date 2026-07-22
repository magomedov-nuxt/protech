<template>
  <div class="mx-auto w-full max-w-370 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <section class="rounded-2xl bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="max-w-3xl">
          <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <UIcon name="i-lucide-package-check" class="size-4" />
            История
          </p>
          <h1 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            Мои заказы
          </h1>
          <p class="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
            Статусы, оплата, получение и состав заказов собраны в одном спокойном интерфейсе.
          </p>
        </div>

        <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
          class="min-h-12 rounded-full px-5 font-semibold shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.02]">
          В каталог
        </UButton>
      </div>

      <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="metric in orderMetrics" :key="metric.label" class="rounded-xl bg-[#f9fafb] px-3 py-2.5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-zinc-500">{{ metric.label }}</p>
            <UIcon :name="metric.icon" class="size-4 text-zinc-400" />
          </div>
          <p class="mt-1 text-lg font-semibold text-zinc-950">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-5 space-y-3">
      <USkeleton v-for="item in 3" :key="item" class="h-32 rounded-2xl" />
    </div>

    <OrderEmptyState v-else-if="!auth.user" class="mt-5" icon="i-lucide-package-check"
      title="Войдите, чтобы увидеть заказы"
      description="После входа здесь появятся статусы, оплата и состав ваших заказов." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/orders" />

    <OrderEmptyState v-else-if="!orders.length" class="mt-5" icon="i-lucide-shopping-bag" title="Заказов пока нет"
      description="Начните с каталога: добавьте товары в корзину и оформите первый заказ." action-label="Начать покупки"
      action-icon="i-lucide-layout-grid" action-to="/" />

    <div v-else class="mt-5 space-y-3">
      <div v-if="historicalOrdersCount"
        class="flex flex-col gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-sm shadow-zinc-950/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-semibold text-zinc-950">
            Текущие заказы
          </p>
          <p class="mt-1 text-sm leading-6 text-zinc-500">
            {{ showAllOrders ? "Показываем активные и завершенные заказы." : "Завершенные и отмененные заказы скрыты."
            }}
          </p>
        </div>
        <UButton color="neutral" variant="soft" :icon="showAllOrders ? 'i-lucide-eye-off' : 'i-lucide-list'" size="lg"
          class="min-h-12 rounded-full bg-[#f3f4f6] px-5 font-semibold transition duration-300 hover:scale-[1.02]"
          @click="toggleShowAllOrders">
          {{ showAllOrders ? "Скрыть завершенные" : "Показать все заказы" }}
        </UButton>
      </div>

      <OrderEmptyState v-if="!visibleOrders.length" class="mt-4" icon="i-lucide-circle-check"
        title="Текущих заказов нет"
        description="Все ваши заказы сейчас завершены или отменены. Нажмите «Показать все заказы», чтобы открыть историю." />

      <div v-else v-auto-animate class="space-y-3">
        <OrderCard v-for="order in visibleOrders" :key="order.id" :order="order" :class="getOrderCardClass(order)"
          @open-details="openOrderDetails" />
      </div>
    </div>

    <OrderDetailsModal v-model:open="detailsOpen" :order="selectedOrder" />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

useSeoMeta({
  title: "Мои заказы",
  description: "История заказов покупателя ПроТех76."
});

const auth = useAuthStore();
const orders = ref<ShopOrder[]>([]);
const loading = ref(true);
const selectedOrder = ref<ShopOrder | null>(null);
const detailsOpen = ref(false);
const showAllOrders = ref(false);
const terminalOrderStatuses = new Set<ShopOrder["orderStatus"]>(["COMPLETED", "CANCELLED"]);
const orderMetrics = computed(() => [
  {
    icon: "i-lucide-package-check",
    label: "Всего",
    value: `${orders.value.length}`
  },
  {
    icon: "i-lucide-loader-circle",
    label: "В работе",
    value: `${activeOrdersCount.value}`
  },
  {
    icon: "i-lucide-circle-check",
    label: "Завершено",
    value: `${completedOrdersCount.value}`
  },
  {
    icon: "i-lucide-badge-russian-ruble",
    label: "Сумма",
    value: formatCurrency(ordersTotal.value)
  }
]);
const activeOrders = computed(() => orders.value.filter(isActiveOrder));
const historicalOrders = computed(() => orders.value.filter((order) => !isActiveOrder(order)));
const visibleOrders = computed(() => showAllOrders.value ? orders.value : activeOrders.value);
const activeOrdersCount = computed(() => activeOrders.value.length);
const completedOrdersCount = computed(() => orders.value.filter((order) => order.orderStatus === "COMPLETED").length);
const historicalOrdersCount = computed(() => historicalOrders.value.length);
const ordersTotal = computed(() => orders.value.reduce((sum, order) => sum + Number(order.payment?.amount ?? 0), 0));

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    loading.value = false;
    return;
  }

  try {
    orders.value = await shopFetch<ShopOrder[]>("/api/public/orders");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить заказы"));
  } finally {
    loading.value = false;
  }
});

function openOrderDetails(order: ShopOrder) {
  selectedOrder.value = order;
  detailsOpen.value = true;
}

function toggleShowAllOrders() {
  showAllOrders.value = !showAllOrders.value;
}

function isActiveOrder(order: ShopOrder) {
  return !terminalOrderStatuses.has(order.orderStatus);
}

function getOrderCardClass(order: ShopOrder) {
  return isActiveOrder(order)
    ? "!bg-white/90 ring-1 ring-zinc-200/80 shadow-sm shadow-zinc-950/5"
    : "!bg-white/70 opacity-70 grayscale-[0.15]";
}
</script>
