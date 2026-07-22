<template>
  <article class="group cursor-pointer rounded-2xl bg-white/90 p-3 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-zinc-950/10 sm:p-4"
    @click="openDetails">
    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <OrderStatusPill type="order" :value="order.orderStatus" />
          <OrderStatusPill v-if="order.payment" type="payment" :value="order.payment.paymentStatus" />
        </div>

        <h2 class="mt-2 text-lg font-semibold tracking-normal text-zinc-950 transition group-hover:text-emerald-700 sm:text-xl">
          Заказ №{{ order.id }}
        </h2>

        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 sm:text-sm">
          <span>{{ formatDateTime(order.createdAt) }}</span>
          <span v-if="order.customerPhone" class="inline-flex items-center gap-1.5 font-medium text-zinc-600">
            <UIcon name="i-lucide-phone" class="size-3.5 text-zinc-400" />
            {{ order.customerPhone }}
          </span>
          <span v-if="order.recipientName || order.recipientPhone"
            class="inline-flex items-center gap-1.5 font-medium text-zinc-600">
            <UIcon name="i-lucide-user-round-check" class="size-3.5 text-zinc-400" />
            {{ recipientLabel }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="metric in metrics" :key="metric.label"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-zinc-600">
            <UIcon :name="metric.icon" class="size-3.5 text-zinc-400" />
            <span class="text-zinc-400">{{ metric.label }}</span>
            <span class="text-zinc-700">{{ metric.value }}</span>
          </span>
        </div>

        <OrderPaymentResumeCard :order="order" compact />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 sm:justify-start lg:justify-end">
        <div class="flex -space-x-3">
          <img v-for="item in order.orderItems.slice(0, 4)" :key="item.id"
            :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'" :alt="item.productName"
            class="size-10 rounded-xl object-cover ring-2 ring-white sm:size-11">
          <span v-if="hiddenItemsCount > 0"
            class="grid size-10 place-items-center rounded-xl bg-[#f3f4f6] text-sm font-semibold text-zinc-500 ring-2 ring-white sm:size-11">
            +{{ hiddenItemsCount }}
          </span>
        </div>

        <div class="min-w-28 text-right">
          <p class="text-xs text-zinc-500">{{ order.orderItems.length }} позиций</p>
          <p class="mt-0.5 text-lg font-semibold text-zinc-950 sm:text-xl">
            {{ formatCurrency(order.payment?.amount) }}
          </p>
        </div>

      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { ShopOrder } from "~~/app/shared/types/shop";

const props = defineProps<{
  order: ShopOrder;
}>();

const emit = defineEmits<{
  openDetails: [order: ShopOrder];
}>();

const hiddenItemsCount = computed(() => Math.max(props.order.orderItems.length - 4, 0));
const recipientLabel = computed(() => [
  props.order.recipientName,
  props.order.recipientPhone
].filter(Boolean).join(" · "));
const metrics = computed(() => [
  {
    icon: props.order.obtainingMethod === "DELIVERY" ? "i-lucide-truck" : "i-lucide-store",
    label: "Получение",
    value: props.order.obtainingMethod === "DELIVERY" ? "Доставка" : "Самовывоз"
  },
  {
    icon: props.order.paymentMethod === "ONLINE" ? "i-lucide-credit-card" : "i-lucide-wallet",
    label: "Оплата",
    value: props.order.paymentMethod === "ONLINE" ? "Онлайн" : "При получении"
  },
  {
    icon: "i-lucide-clock-3",
    label: "Обновлен",
    value: formatDateTime(props.order.updatedAt)
  }
]);

function openDetails() {
  emit("openDetails", props.order);
}
</script>
