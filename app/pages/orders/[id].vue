<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <UButton color="neutral" variant="soft" icon="i-lucide-arrow-left" to="/orders"
        class="rounded-full bg-white/90 px-4 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-[1.02] ">
        К заказам
      </UButton>

      <UButton v-if="order" color="primary" variant="soft" icon="i-lucide-maximize-2"
        class="rounded-full px-4 transition duration-300 hover:scale-[1.02]" @click="openDetailsModal">
        Открыть окно
      </UButton>
    </div>

    <div v-if="loading" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <USkeleton class="h-136 rounded-4xl" />
      <USkeleton class="h-96 rounded-4xl" />
    </div>

    <UAlert v-else-if="!order" color="error" variant="soft" title="Заказ не найден"
      description="Проверьте номер заказа или войдите в нужный аккаунт." class="rounded-3xl" />

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div class="space-y-6">
        <section class="rounded-4xl bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8  ">
          <div class="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700  ">
                <UIcon name="i-lucide-receipt-text" class="size-4" />
                Заказ №{{ order.id }}
              </p>
              <h1 class="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl ">
                Детали заказа
              </h1>
              <p class="mt-3 text-sm text-zinc-500 ">
                Создан {{ formatDateTime(order.createdAt) }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <OrderStatusPill type="order" :value="order.orderStatus" />
              <OrderStatusPill v-if="order.payment" type="payment" :value="order.payment.paymentStatus" />
            </div>
          </div>

          <div class="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div v-for="metric in detailMetrics" :key="metric.label" class="rounded-[1.5rem] bg-[#f9fafb] p-4 ">
              <div class="flex items-center justify-between gap-4">
                <p class="text-sm text-zinc-500">{{ metric.label }}</p>
                <UIcon :name="metric.icon" class="size-5 text-zinc-400" />
              </div>
              <p class="mt-2 text-xl font-semibold text-zinc-950">{{ metric.value }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-4xl bg-white/90 p-5 shadow-sm shadow-zinc-950/5 sm:p-6  ">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold tracking-normal text-zinc-950">Маршрут заказа</h2>
              <p class="mt-1 text-sm text-zinc-500">Ключевые этапы обработки и получения.</p>
            </div>
            <UIcon name="i-lucide-route" class="size-6 text-zinc-400" />
          </div>

          <div v-auto-animate class="mt-6 grid gap-3 md:grid-cols-4">
            <div v-for="step in timelineSteps" :key="step.label" class="rounded-[1.5rem] p-4"
              :class="step.active ? 'bg-emerald-50 text-emerald-800' : 'bg-[#f9fafb] text-zinc-500  '">
              <UIcon :name="step.icon" class="size-5" />
              <p class="mt-3 text-sm font-semibold">{{ step.label }}</p>
              <p class="mt-1 text-xs leading-5 opacity-80">{{ step.text }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-4xl bg-white/90 p-5 shadow-sm shadow-zinc-950/5 sm:p-6  ">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold tracking-normal text-zinc-950">Состав заказа</h2>
              <p class="mt-1 text-sm text-zinc-500">{{ order.orderItems.length }} позиций в заказе.</p>
            </div>
            <UBadge color="neutral" variant="soft" class="rounded-full bg-[#f3f4f6] px-3 py-1.5 ">
              {{ formatCurrency(order.payment?.amount) }}
            </UBadge>
          </div>

          <div v-auto-animate class="mt-6 space-y-3">
            <OrderLineItem v-for="item in order.orderItems" :key="item.id" :item="item" />
          </div>
        </section>
      </div>

      <OrderSummaryPanel :order="order" />
    </div>

    <OrderDetailsModal v-model:open="detailsOpen" :order="order" />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, formatDateTime, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { OrderStatus, ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

const route = useRoute();
const auth = useAuthStore();
const order = ref<ShopOrder | null>(null);
const loading = ref(true);
const detailsOpen = ref(false);

useSeoMeta({
  title: () => order.value ? `Заказ №${order.value.id}` : "Заказ",
  description: "Детальная информация о заказе ПроТех76."
});

const detailMetrics = computed(() => {
  if (!order.value) return [];

  const metrics = [
    {
      icon: "i-lucide-package",
      label: "Позиций",
      value: `${order.value.orderItems.length}`
    },
    {
      icon: "i-lucide-truck",
      label: "Получение",
      value: order.value.obtainingMethod === "DELIVERY" ? "Доставка OZON" : "Самовывоз"
    },
    {
      icon: "i-lucide-phone",
      label: "Телефон",
      value: order.value.customerPhone || "Не указан"
    }
  ];

  if (order.value.recipientName || order.value.recipientPhone) {
    metrics.push({
      icon: "i-lucide-user-round-check",
      label: "Получатель",
      value: [order.value.recipientName, order.value.recipientPhone].filter(Boolean).join(" · ")
    });
  }

  metrics.push(
    {
      icon: "i-lucide-badge-russian-ruble",
      label: "Сумма",
      value: formatCurrency(order.value.payment?.amount)
    }
  );

  return metrics;
});
const timelineSteps = computed(() => {
  const status = order.value?.orderStatus;

  return [
    {
      active: isStepActive(status, ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"]),
      icon: "i-lucide-sparkles",
      label: "Создан",
      text: "Заказ принят системой."
    },
    {
      active: isStepActive(status, ["CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"]),
      icon: "i-lucide-check-check",
      label: "Подтвержден",
      text: "Мы проверили состав."
    },
    {
      active: isStepActive(status, ["PROCESSING", "SHIPPED", "COMPLETED"]),
      icon: "i-lucide-loader-circle",
      label: "В работе",
      text: "Готовим товары."
    },
    {
      active: isStepActive(status, ["SHIPPED", "COMPLETED"]),
      icon: "i-lucide-truck",
      label: "Передан",
      text: "Заказ движется к получению."
    }
  ];
});

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
    return;
  }

  try {
    order.value = await shopFetch<ShopOrder>(`/api/public/orders/${route.params.id}`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить заказ"));
  } finally {
    loading.value = false;
  }
});

function isStepActive(status: OrderStatus | undefined, activeStatuses: OrderStatus[]) {
  return Boolean(status && activeStatuses.includes(status));
}

function openDetailsModal() {
  detailsOpen.value = true;
}
</script>
