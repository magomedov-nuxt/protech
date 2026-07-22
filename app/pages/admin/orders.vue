<template>
  <div class="orders-shop-page space-y-5">
    <AdminPageHeader title="Заказы" kicker="Операции"
      description="Статусы заказов, оплаты, состав, доставка и быстрые операционные изменения.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ ordersStatusText }}
      </p>

      <div v-auto-animate class="flex flex-wrap gap-2">
        <UButton v-if="hasAnyOrderFilter" color="neutral" variant="ghost" size="lg" icon="i-lucide-rotate-ccw"
          class="h-11 rounded-full bg-white px-4 text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="setOrderStatusFilter('all')">
          Сбросить
        </UButton>
        <UBadge color="primary" variant="soft" class="rounded-full px-3 py-1">
          {{ selectedOrderStatusFilterLabel }}
        </UBadge>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить заказы"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <section class="admin-list-card">
      <div class="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="admin-section-heading">
            Лента заказов
          </p>
          <p class="admin-section-copy">
            Ключевая информация и действия собраны в компактных рабочих карточках.
          </p>
        </div>

        <label class="block w-full min-w-0 rounded-2xl bg-[#f9fafb] p-2 shadow-inner shadow-zinc-950/5 sm:w-72">
          <span class="sr-only">Фильтр по статусу заказа</span>
          <USelect v-model="filters.orders.status" class="w-full rounded-xl bg-white shadow-sm shadow-zinc-950/5"
            size="lg" color="neutral" variant="none" icon="i-lucide-list-filter" :content="adminSelectContent"
            :items="orderStatusFilterItems" :ui="adminSelectUi" />
        </label>
      </div>

      <div v-if="orders.length" class="space-y-4 bg-[#f6f7f8] p-3 sm:p-4">
        <article v-for="order in orders" :key="order.id"
          class="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_14px_44px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:shadow-[0_20px_60px_rgba(24,24,27,0.12)]">
          <header class="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-semibold tracking-tight text-zinc-950">
                  Заказ #{{ order.id }}
                </h2>
                <AdminStatusBadge type="order" :value="order.orderStatus" />
                <AdminStatusBadge v-if="order.payment" type="payment" :value="order.payment.paymentStatus" />
              </div>
              <p class="mt-1.5 text-sm text-zinc-500">
                Создан {{ formatDate(order.createdAt) }} · обновлён {{ formatDate(order.updatedAt) }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:flex sm:items-stretch">
              <div class="rounded-2xl bg-zinc-100 px-4 py-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Товаров
                </p>
                <p class="mt-0.5 text-base font-semibold text-zinc-900">
                  {{ order.orderItems.length }}
                </p>
              </div>
              <div class="rounded-2xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-100">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                  Итого
                </p>
                <p class="mt-0.5 whitespace-nowrap text-lg font-bold text-emerald-700">
                  {{ formatCurrency(order.payment?.amount) }}
                </p>
              </div>
            </div>
          </header>

          <section class="border-y border-zinc-200 bg-white px-4 py-4 sm:px-5">
            <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <label class="block min-w-0">
                <span class="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <UIcon name="i-lucide-package-check" class="size-4" />
                  Статус заказа
                </span>
                <USelect :model-value="order.orderStatus"
                  class="w-full rounded-2xl bg-white shadow-xs shadow-black/20 ring-2 ring-white/10 border border-zinc-200"
                  size="lg" color="neutral" variant="none" icon="i-lucide-clipboard-check" :content="adminSelectContent"
                  :items="orderStatusItems" :ui="statusSelectUi" :disabled="savingOrderId === order.id"
                  @update:model-value="(value) => updateOrderStatus(order, value)" />
              </label>

              <label class="block min-w-0">
                <span class="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <UIcon name="i-lucide-credit-card" class="size-4" />
                  Статус оплаты
                </span>
                <USelect :model-value="order.payment?.paymentStatus"
                  class="w-full rounded-2xl bg-white shadow-xs shadow-black/20 ring-2 ring-white/10  border border-zinc-200"
                  size="lg" color="neutral" variant="none" icon="i-lucide-wallet-cards" :content="adminSelectContent"
                  :items="paymentStatusItems" :ui="statusSelectUi"
                  :disabled="!order.payment || savingPaymentId === order.id"
                  @update:model-value="(value) => updatePaymentStatus(order, value)" />
              </label>

              <UButton v-if="order.user" color="neutral" variant="solid" icon="i-lucide-messages-square"
                :to="{ path: '/admin/messages', query: { userId: order.user.id } }"
                class="min-h-12 justify-center rounded-2xl bg-[#27272a] px-5 text-white ring-1 ring-white/10 hover:bg-[#3f3f46]">
                Чат
              </UButton>
            </div>
          </section>

          <details class="border-b border-zinc-200 bg-[#f9fafb] px-4 py-3 lg:hidden">
            <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-950">
              Состав и клиент
              <UIcon name="i-lucide-chevron-down" class="size-5 text-(--admin-text-muted)" />
            </summary>

            <div class="mt-4 space-y-4">
              <section class="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-zinc-950">
                    Товары
                  </p>
                  <p class="text-sm font-medium text-(--admin-text-muted)">
                    {{ order.orderItems.length }} позиций
                  </p>
                </div>

                <div class="mt-3 divide-y divide-zinc-100">
                  <div v-for="item in order.orderItems.slice(0, 3)" :key="item.product.id"
                    class="flex items-center gap-3 py-3">
                    <img :src="item.product.mainImage" :alt="item.product.name"
                      class="size-12 shrink-0 rounded-xl bg-zinc-100 object-cover ring-1 ring-zinc-200">
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950">
                        {{ item.product.name }}
                      </p>
                      <p class="mt-1 text-xs font-medium text-(--admin-text-muted)">
                        {{ item.quantity }} шт. · {{ formatCurrency(item.price) }}
                      </p>
                    </div>
                  </div>
                </div>

                <p v-if="order.orderItems.length > 3" class="mt-2 text-xs font-medium text-(--admin-text-muted)">
                  Еще позиций: {{ order.orderItems.length - 3 }}
                </p>
              </section>

              <section class="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Получатель
                </p>
                <p class="mt-2 wrap-break-word text-base font-bold text-zinc-950">
                  {{ order.recipientName || order.user?.name || order.user?.email || "Гость" }}
                </p>
                <p class="mt-1 break-all text-sm font-semibold text-zinc-700">
                  {{ order.recipientPhone || order.customerPhone || "Телефон не указан" }}
                </p>
              </section>

              <section class="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {{ order.delivery ? "Адрес доставки" : "Самовывоз" }}
                </p>
                <template v-if="order.delivery">
                  <p class="mt-2 wrap-break-word text-sm font-semibold leading-6 text-zinc-950">
                    {{ order.delivery.address }}
                  </p>
                  <p v-if="deliveryDetails(order)" class="mt-1 text-xs leading-5 text-(--admin-text-muted)">
                    {{ deliveryDetails(order) }}
                  </p>
                </template>
                <template v-else>
                  <p class="mt-2 text-sm font-semibold leading-6 text-zinc-950">
                    Ярославль, пр.-т Октября, д. 78д
                  </p>
                </template>
              </section>
            </div>
          </details>

          <div class="hidden lg:grid xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
            <section class="border-b border-zinc-200 p-4 sm:p-5 xl:border-b-0 xl:border-r">
              <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-base font-semibold text-zinc-950">
                    Товары
                  </p>
                  <p class="mt-1 text-sm text-zinc-500">
                    {{ obtainingMethodLabels[order.obtainingMethod] }} · {{ paymentMethodLabels[order.paymentMethod] }}
                  </p>
                </div>
                <p class="text-sm font-medium text-zinc-500">
                  {{ order.orderItems.length }} позиций
                </p>
              </div>

              <div class="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
                <div v-for="item in order.orderItems" :key="item.product.id"
                  class="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <img :src="item.product.mainImage" :alt="item.product.name"
                      class="size-16 shrink-0 rounded-xl bg-zinc-100 object-cover ring-1 ring-zinc-200">
                    <div class="min-w-0">
                      <p class="line-clamp-2 text-sm font-semibold leading-5 text-zinc-950">
                        {{ item.product.name }}
                      </p>
                      <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        <span class="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                          {{ item.quantity }} шт.
                        </span>
                        <span>{{ formatCurrency(item.price) }} за единицу</span>
                      </div>
                    </div>
                  </div>

                  <p class="whitespace-nowrap text-base font-bold text-zinc-950 sm:text-right">
                    {{ formatCurrency(Number(item.price) * item.quantity) }}
                  </p>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                <span class="text-sm font-semibold text-emerald-700">Сумма заказа</span>
                <span class="whitespace-nowrap text-xl font-bold text-emerald-800">
                  {{ formatCurrency(order.payment?.amount) }}
                </span>
              </div>
            </section>

            <aside class="space-y-4 bg-zinc-50/80 p-4 sm:p-5">
              <section class="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <div class="flex items-start gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <UIcon name="i-lucide-user-round" class="size-5" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Получатель
                    </p>
                    <p class="mt-1 wrap-break-word text-base font-bold text-zinc-950">
                      {{ order.recipientName || order.user?.name || order.user?.email || "Гость" }}
                    </p>
                    <p class="mt-1 break-all text-sm font-semibold text-zinc-700">
                      {{ order.recipientPhone || order.customerPhone || "Телефон не указан" }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <div class="flex items-start gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UIcon name="i-lucide-map-pin" class="size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {{ order.delivery ? "Адрес доставки" : "Самовывоз" }}
                    </p>

                    <template v-if="order.delivery">
                      <p class="mt-1 wrap-break-word text-sm font-semibold leading-6 text-zinc-950">
                        {{ order.delivery.address }}
                      </p>
                      <p v-if="deliveryDetails(order)" class="mt-1 text-xs leading-5 text-zinc-500">
                        {{ deliveryDetails(order) }}
                      </p>
                      <p class="mt-2 text-xs font-medium text-emerald-700">
                        {{ deliveryServiceLabel(order) }}
                      </p>
                    </template>

                    <template v-else>
                      <p class="mt-1 text-sm font-semibold leading-6 text-zinc-950">
                        Ярославль, пр.-т Октября, д. 78д
                      </p>
                      <p class="mt-1 text-xs leading-5 text-zinc-500">
                        По предварительной записи: 89201309744
                      </p>
                    </template>
                  </div>
                </div>

                <div v-if="order.delivery?.comment"
                  class="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 ring-1 ring-amber-100">
                  <span class="font-semibold">Комментарий:</span>
                  {{ order.delivery.comment }}
                </div>
              </section>

              <section class="grid grid-cols-2 gap-2">
                <div class="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Получение
                  </p>
                  <p class="mt-1 text-sm font-semibold text-zinc-900">
                    {{ obtainingMethodLabels[order.obtainingMethod] }}
                  </p>
                </div>
                <div class="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Оплата
                  </p>
                  <p class="mt-1 text-sm font-semibold text-zinc-900">
                    {{ paymentMethodLabels[order.paymentMethod] }}
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <form class="hidden border-t border-zinc-200 bg-white px-4 py-4 sm:px-5 lg:block" @submit.prevent="sendOrderMessage(order)">
            <template v-if="order.user">
              <div class="grid gap-3 lg:grid-cols-[minmax(220px,0.45fr)_minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p class="text-sm font-semibold text-zinc-950">
                    Сообщение заказчику
                  </p>
                  <p class="mt-1 text-xs leading-5 text-zinc-500">
                    Будет привязано к заказу #{{ order.id }}
                  </p>
                </div>

                <div class="rounded-2xl bg-zinc-50 p-1 ring-1 ring-zinc-200">
                  <UTextarea v-model="orderMessageDrafts[order.id]" class="w-full" size="lg" variant="none" :rows="2"
                    :ui="compactTextareaUi" :disabled="sendingMessageOrderId === order.id"
                    placeholder="Напишите сообщение по заказу" />
                </div>

                <UButton color="primary" icon="i-lucide-send" type="submit"
                  class="min-h-12 justify-center rounded-2xl px-5 shadow-lg shadow-emerald-950/10"
                  :disabled="!orderMessageDrafts[order.id]?.trim()" :loading="sendingMessageOrderId === order.id">
                  Отправить
                </UButton>
              </div>
            </template>

            <p v-else class="text-sm leading-6 text-zinc-500">
              У заказа нет зарегистрированного аккаунта, сообщение через личный кабинет недоступно.
            </p>
          </form>
        </article>
      </div>

      <AdminEmptyState v-if="!orders.length && !pending" title="Заказы не найдены"
        description="Измените фильтр статуса.">
        <template #icon>
          <ClipboardList class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination v-if="ordersData?.pagination" :pagination="ordersData.pagination" :loading="pending"
        @update:page="page = $event" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
  buildQuery,
  formatCurrency,
  formatDate,
  formatNumber,
  getErrorMessage,
  obtainingMethodLabels,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type {
  OrderListItem,
  OrderStatus,
  PaginatedResponse,
  PaymentStatus
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const savingOrderId = ref<number | null>(null);
const savingPaymentId = ref<number | null>(null);
const sendingMessageOrderId = ref<number | null>(null);
const orderMessageDrafts = reactive<Record<number, string>>({});

watch(() => filters.orders.status, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  status: filters.orders.status === "all" ? null : filters.orders.status
}));

const { data: ordersData, pending, error, refresh } = await useAsyncData(
  "admin-orders-list",
  () => adminFetch<PaginatedResponse<OrderListItem>>(`/api/admin/orders${query.value}`),
  { watch: [query] }
);

const orders = computed(() => ordersData.value?.items ?? []);
const orderStatusItems = Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }));
const paymentStatusItems = Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }));
const orderStatusFilterItems = [
  { value: "all", label: "Все статусы" },
  ...orderStatusItems
];

const adminSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const adminSelectUi = {
  base: "h-12 rounded-xl bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const statusSelectUi = {
  ...adminSelectUi,
  base: "h-12 rounded-2xl bg-transparent font-semibold text-zinc-900"
};
const compactTextareaUi = {
  base: "min-h-20 resize-y rounded-xl bg-transparent text-sm leading-6 text-zinc-900"
};

const selectedOrderStatusFilterLabel = computed(() => (
  filters.orders.status === "all"
    ? "Все статусы"
    : orderStatusLabels[filters.orders.status] ?? "Статус"
));
const hasAnyOrderFilter = computed(() => filters.orders.status !== "all");
const ordersStatusText = computed(() => {
  const pagination = ordersData.value?.pagination;

  if (!pagination) {
    return pending.value ? "Загружаем заказы..." : "Нет данных по заказам";
  }

  if (pagination.total === 0) {
    return "По текущему фильтру заказы не найдены";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return `Показаны ${formatNumber(start)}-${formatNumber(end)} из ${formatNumber(pagination.total)} заказов`;
});

function setOrderStatusFilter(status: "all" | OrderStatus) {
  filters.orders.status = status;
}

function deliveryDetails(order: OrderListItem) {
  if (!order.delivery) {
    return "";
  }

  return [
    order.delivery.apartment ? `кв. ${order.delivery.apartment}` : "",
    order.delivery.entrance ? `подъезд ${order.delivery.entrance}` : "",
    order.delivery.floor ? `этаж ${order.delivery.floor}` : "",
    order.delivery.intercom ? `домофон ${order.delivery.intercom}` : ""
  ].filter(Boolean).join(", ");
}

function deliveryServiceLabel(order: OrderListItem) {
  return order.delivery?.deliveryMethod === "OZON"
    ? "Служба доставки OZON"
    : "Служба доставки не указана";
}

async function updateOrderStatus(order: OrderListItem, value: unknown) {
  const orderStatus = value as OrderStatus;

  if (!orderStatus || orderStatus === order.orderStatus) {
    return;
  }

  savingOrderId.value = order.id;

  try {
    await adminFetch(`/api/admin/orders/${order.id}/status`, {
      method: "POST",
      body: { orderStatus }
    });
    toast.success("Статус заказа обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить статус заказа"));
  } finally {
    savingOrderId.value = null;
  }
}

async function updatePaymentStatus(order: OrderListItem, value: unknown) {
  const paymentStatus = value as PaymentStatus;

  if (!paymentStatus || !order.payment || paymentStatus === order.payment.paymentStatus) {
    return;
  }

  savingPaymentId.value = order.id;

  try {
    await adminFetch("/api/admin/orders/payment", {
      method: "POST",
      body: {
        orderId: order.id,
        paymentStatus
      }
    });
    toast.success("Статус оплаты обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить оплату"));
  } finally {
    savingPaymentId.value = null;
  }
}

async function sendOrderMessage(order: OrderListItem) {
  const userId = order.user?.id;
  const text = orderMessageDrafts[order.id]?.trim();

  if (!userId) {
    toast.error("У заказа нет зарегистрированного заказчика");
    return;
  }

  if (!text) {
    toast.error("Введите сообщение заказчику");
    return;
  }

  sendingMessageOrderId.value = order.id;

  try {
    await adminFetch(`/api/admin/messages/${userId}`, {
      method: "POST",
      body: {
        message: `По заказу #${order.id}\n\n${text}`
      }
    });
    orderMessageDrafts[order.id] = "";
    toast.success("Сообщение отправлено заказчику");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось отправить сообщение"));
  } finally {
    sendingMessageOrderId.value = null;
  }
}
</script>
