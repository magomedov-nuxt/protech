<template>
  <UModal v-model:open="open" :title="modalTitle" :ui="modalUi">
    <template #body>
      <div v-if="order" class="bg-[#f8faf9] pb-2">
        <div class="max-h-[calc(92dvh-4rem)] overflow-y-auto overscroll-contain">
          <OrderDetailsHeader :order="order" :order-total="orderTotal" />

          <div class="grid gap-4 px-4 pb-6 pt-4 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-4">
              <OrderCurrentStateCard :location-text="currentLocationText" :state="currentState" />

              <OrderTrackingTimeline :steps="trackingSteps" />

              <OrderDetailsItemsPanel :items="order.orderItems" />
            </div>

            <OrderDetailsInfoSidebar :order="order" :payment-rows="paymentRows" :receiving-rows="receivingRows" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  getStatusMeta,
  obtainingMethodLabels,
  paymentMethodLabels
} from "~~/app/entities/order/lib/orderDisplay";
import { formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { OrderStatus, OrderStatusHistoryItem, ShopOrder } from "~~/app/shared/types/shop";

type TrackingState = "done" | "current" | "todo" | "cancelled";

type TrackingStep = {
  date?: string;
  description: string;
  icon: string;
  label: string;
  state: TrackingState;
  status: OrderStatus;
};

type InfoRow = {
  label: string;
  value: string;
};

const props = defineProps<{
  order: ShopOrder | null;
}>();

const open = defineModel<boolean>("open", { required: true });

const order = computed(() => props.order);
const modalTitle = computed(() => order.value ? `Заказ №${order.value.id}` : "Заказ");
const modalUi = {
  overlay: "bg-zinc-950/55 backdrop-blur-sm",
  content: "max-h-[92dvh] max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl shadow-zinc-950/20 ring-0  ",
  header: "px-4 py-3 sm:px-5",
  title: "text-base font-semibold text-zinc-950 ",
  body: "overflow-hidden p-0"
};

const orderFlow: OrderStatus[] = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"];

const orderTotal = computed(() => {
  if (!order.value) {
    return 0;
  }

  if (order.value.payment?.amount !== null && order.value.payment?.amount !== undefined) {
    return order.value.payment.amount;
  }

  return order.value.orderItems.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
});

const orderHistory = computed(() => {
  if (!order.value) {
    return [];
  }

  const history = order.value.statusHistory?.length
    ? order.value.statusHistory
    : buildFallbackHistory(order.value);

  return [...history].sort((left, right) => getTime(left.changedAt) - getTime(right.changedAt));
});

const currentState = computed(() => {
  if (!order.value) {
    return {
      class: "bg-zinc-100 text-zinc-600  ",
      description: "",
      icon: "i-lucide-package",
      title: ""
    };
  }

  if (order.value.orderStatus === "CANCELLED") {
    return {
      class: "bg-red-50 text-red-700  ",
      description: "Заказ отменён. Дальнейшие этапы по нему больше не выполняются.",
      icon: "i-lucide-circle-x",
      title: "Заказ отменён"
    };
  }

  if (order.value.paymentMethod === "ONLINE" && order.value.payment?.paymentStatus === "PENDING") {
    return {
      class: "bg-amber-50 text-amber-700  ",
      description: "После успешной оплаты заказ перейдёт к подтверждению и сборке.",
      icon: "i-lucide-clock-3",
      title: "Ожидает оплаты"
    };
  }

  const states: Record<OrderStatus, { description: string; icon: string; title: string }> = {
    NEW: {
      description: "Мы получили заказ и проверяем состав, оплату и наличие товаров.",
      icon: "i-lucide-clipboard-check",
      title: "Заказ принят"
    },
    CONFIRMED: {
      description: "Состав подтверждён, товары зарезервированы и скоро уйдут в сборку.",
      icon: "i-lucide-check-check",
      title: "Заказ подтверждён"
    },
    PROCESSING: {
      description: "Позиции собирают и готовят к передаче.",
      icon: "i-lucide-package-open",
      title: "Заказ собирается"
    },
    SHIPPED: {
      description: order.value.obtainingMethod === "DELIVERY"
        ? "Заказ передан в доставку и движется к указанному адресу."
        : "Заказ готов к получению. Можно забирать после подтверждения точки выдачи.",
      icon: order.value.obtainingMethod === "DELIVERY" ? "i-lucide-truck" : "i-lucide-store",
      title: order.value.obtainingMethod === "DELIVERY" ? "Заказ в доставке" : "Готов к выдаче"
    },
    COMPLETED: {
      description: "Заказ завершён и отмечен как полученный.",
      icon: "i-lucide-circle-check",
      title: "Заказ получен"
    },
    CANCELLED: {
      description: "",
      icon: "i-lucide-circle-x",
      title: ""
    }
  };

  return {
    class: "bg-emerald-50 text-emerald-700  ",
    ...states[order.value.orderStatus]
  };
});

const currentLocationText = computed(() => {
  if (!order.value) {
    return "";
  }

  if (order.value.orderStatus === "CANCELLED") {
    return "Движение заказа остановлено";
  }

  if (order.value.paymentMethod === "ONLINE" && order.value.payment?.paymentStatus === "PENDING") {
    return "Ожидаем оплату";
  }

  if (order.value.delivery) {
    return order.value.orderStatus === "SHIPPED"
      ? `В доставке на адрес: ${order.value.delivery.address}`
      : `Доставка: ${order.value.delivery.address}`;
  }

  return order.value.orderStatus === "SHIPPED"
    ? "Готов к самовывозу"
    : "Самовывоз после подтверждения";
});

const trackingSteps = computed<TrackingStep[]>(() => {
  if (!order.value) {
    return [];
  }

  const currentIndex = orderFlow.indexOf(order.value.orderStatus);
  const baseSteps = getBaseTrackingSteps(order.value);
  const steps: TrackingStep[] = baseSteps.map((step, index) => {
    let state: TrackingState = "todo";

    if (order.value?.orderStatus === "CANCELLED") {
      state = getOrderStatusDate(step.status) ? "done" : "todo";
    } else if (index < currentIndex) {
      state = "done";
    } else if (index === currentIndex) {
      state = "current";
    }

    return {
      ...step,
      date: getOrderStatusDate(step.status),
      state
    };
  });

  if (order.value.orderStatus === "CANCELLED") {
    steps.push({
      date: getOrderStatusDate("CANCELLED") ?? order.value.updatedAt,
      description: "Заказ отменён, обработка и передача остановлены.",
      icon: "i-lucide-circle-x",
      label: "Отменён",
      state: "cancelled",
      status: "CANCELLED"
    });
  }

  return steps;
});

const paymentRows = computed<InfoRow[]>(() => {
  if (!order.value) {
    return [];
  }

  const rows: InfoRow[] = [
    {
      label: "Способ",
      value: paymentMethodLabels[order.value.paymentMethod]
    },
    {
      label: "Статус",
      value: order.value.payment ? getStatusMeta("payment", order.value.payment.paymentStatus).label : "Не указан"
    }
  ];

  if (order.value.payment?.paidAt) {
    rows.push({
      label: "Оплачено",
      value: formatDateTime(order.value.payment.paidAt)
    });
  }

  return rows;
});

const receivingRows = computed<InfoRow[]>(() => {
  if (!order.value) {
    return [];
  }

  const rows: InfoRow[] = [
    {
      label: "Способ",
      value: obtainingMethodLabels[order.value.obtainingMethod]
    },
    {
      label: "Телефон",
      value: order.value.customerPhone || "Не указан"
    }
  ];

  if (order.value.recipientName || order.value.recipientPhone) {
    rows.push(
      {
        label: "Получатель",
        value: order.value.recipientName || "Не указан"
      },
      {
        label: "Телефон получателя",
        value: order.value.recipientPhone || "Не указан"
      }
    );
  }

  if (!order.value.delivery) {
    rows.push({
      label: "Самовывоз",
      value: getPickupHint(order.value.orderStatus)
    }, {
      label: "Адрес",
      value: "Ярославль, пр.-т Октября, д. 78д"
    }, {
      label: "Запись",
      value: "89201309744"
    });

    return rows;
  }

  rows.push(
    {
      label: "Служба",
      value: order.value.delivery.deliveryMethod === "OZON" ? "Служба доставки OZON" : order.value.delivery.deliveryMethod
    },
    {
      label: "Адрес",
      value: order.value.delivery.address
    }
  );

  const optionalRows: Array<[string, string | null]> = [
    ["Квартира", order.value.delivery.apartment],
    ["Подъезд", order.value.delivery.entrance],
    ["Этаж", order.value.delivery.floor],
    ["Домофон", order.value.delivery.intercom],
    ["Комментарий", order.value.delivery.comment]
  ];

  for (const [label, value] of optionalRows) {
    if (value) {
      rows.push({ label, value });
    }
  }

  return rows;
});

function getBaseTrackingSteps(orderValue: ShopOrder): Omit<TrackingStep, "date" | "state">[] {
  return [
    {
      description: "Заказ создан, состав и контактные данные сохранены.",
      icon: "i-lucide-clipboard-check",
      label: "Принят",
      status: "NEW"
    },
    {
      description: "Магазин подтвердил заказ и наличие товаров.",
      icon: "i-lucide-check-check",
      label: "Подтверждён",
      status: "CONFIRMED"
    },
    {
      description: "Позиции собирают и готовят к передаче.",
      icon: "i-lucide-package-open",
      label: "Собирается",
      status: "PROCESSING"
    },
    {
      description: orderValue.obtainingMethod === "DELIVERY"
        ? "Заказ передан в доставку."
        : "Заказ готов к выдаче.",
      icon: orderValue.obtainingMethod === "DELIVERY" ? "i-lucide-truck" : "i-lucide-store",
      label: orderValue.obtainingMethod === "DELIVERY" ? "В доставке" : "Готов к выдаче",
      status: "SHIPPED"
    },
    {
      description: "Заказ получен и завершён.",
      icon: "i-lucide-circle-check",
      label: "Получен",
      status: "COMPLETED"
    }
  ];
}

function buildFallbackHistory(orderValue: ShopOrder): OrderStatusHistoryItem[] {
  const history: OrderStatusHistoryItem[] = [
    {
      id: `fallback-order-created-${orderValue.id}`,
      type: "order",
      status: "NEW",
      changedAt: orderValue.createdAt
    }
  ];

  if (orderValue.orderStatus !== "NEW") {
    history.push({
      id: `fallback-order-current-${orderValue.id}`,
      type: "order",
      status: orderValue.orderStatus,
      changedAt: orderValue.updatedAt
    });
  }

  if (orderValue.payment) {
    history.push({
      id: `fallback-payment-current-${orderValue.id}`,
      type: "payment",
      status: orderValue.payment.paymentStatus,
      changedAt: orderValue.payment.paidAt ?? orderValue.updatedAt
    });
  }

  return history;
}

function getOrderStatusDate(status: OrderStatus) {
  const events = orderHistory.value.filter((event) => event.type === "order" && event.status === status);

  return events.length ? events[events.length - 1]?.changedAt : undefined;
}

function getPickupHint(status: OrderStatus) {
  if (status === "SHIPPED") {
    return "Заказ готов к выдаче по предварительной записи.";
  }

  if (status === "COMPLETED") {
    return "Заказ уже получен.";
  }

  if (status === "CANCELLED") {
    return "Самовывоз отменён вместе с заказом.";
  }

  return "Самовывоз производится по предварительной записи.";
}

function getTime(value: string) {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}
</script>
