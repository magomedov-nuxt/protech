<template>
  <aside class="space-y-4 lg:sticky lg:top-28 lg:self-start">
    <section class="rounded-4xl bg-white/90 p-5 shadow-sm shadow-zinc-950/5 sm:p-6  ">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-zinc-950">Итого</h2>
        <UIcon name="i-lucide-receipt-text" class="size-5 text-zinc-400" />
      </div>

      <div class="mt-5 space-y-3 text-sm">
        <div v-for="row in rows" :key="row.label" class="flex justify-between gap-4 text-zinc-500 ">
          <span>{{ row.label }}</span>
          <span class="font-medium text-zinc-950">{{ row.value }}</span>
        </div>
        <div class="flex justify-between gap-4 rounded-[1.5rem] bg-[#f9fafb] p-4 text-lg font-semibold text-zinc-950  ">
          <span>Сумма</span>
          <span>{{ formatCurrency(order.payment?.amount) }}</span>
        </div>
      </div>
    </section>

    <OrderPaymentResumeCard :order="order" />

    <section v-if="order.delivery" class="rounded-4xl bg-white/90 p-5 shadow-sm shadow-zinc-950/5 sm:p-6  ">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-zinc-950">Доставка</h2>
        <UIcon name="i-lucide-map-pin" class="size-5 text-zinc-400" />
      </div>

      <div class="mt-4 space-y-3 text-sm leading-6 text-zinc-500 ">
        <p class="font-semibold text-zinc-950">{{ order.delivery.address }}</p>
        <p v-if="order.delivery.apartment">Квартира: {{ order.delivery.apartment }}</p>
        <p v-if="order.delivery.entrance">Подъезд: {{ order.delivery.entrance }}</p>
        <p v-if="order.delivery.floor">Этаж: {{ order.delivery.floor }}</p>
        <p v-if="order.delivery.intercom">Домофон: {{ order.delivery.intercom }}</p>
        <p v-if="order.delivery.comment">Комментарий: {{ order.delivery.comment }}</p>
      </div>
    </section>

    <UButton color="neutral" variant="soft" icon="i-lucide-layout-grid" to="/" block size="lg"
      class="rounded-full bg-white/90 ">
      Вернуться в каталог
    </UButton>
  </aside>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { ShopOrder } from "~~/app/shared/types/shop";

const props = defineProps<{
  order: ShopOrder;
}>();

const rows = computed(() => [
  {
    label: "Получение",
    value: props.order.obtainingMethod === "DELIVERY" ? "Доставка OZON" : "Самовывоз"
  },
  {
    label: "Телефон",
    value: props.order.customerPhone || "Не указан"
  },
  ...(props.order.recipientName || props.order.recipientPhone
    ? [
      {
        label: "Получатель",
        value: [props.order.recipientName, props.order.recipientPhone].filter(Boolean).join(" · ")
      }
    ]
    : []),
  ...(props.order.obtainingMethod === "PICKUP"
    ? [
      {
        label: "Адрес самовывоза",
        value: "Ярославль, пр.-т Октября, д. 78д"
      },
      {
        label: "Запись",
        value: "89201309744"
      }
    ]
    : []),
  {
    label: "Оплата",
    value: props.order.paymentMethod === "ONLINE" ? "Онлайн" : "При получении"
  },
  {
    label: "Позиций",
    value: `${props.order.orderItems.length}`
  },
  {
    label: "Создан",
    value: formatDateTime(props.order.createdAt)
  }
]);
</script>
