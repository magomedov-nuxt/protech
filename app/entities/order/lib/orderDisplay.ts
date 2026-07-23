import type { ObtainingMethod, OrderStatus, PaymentMethod, PaymentStatus } from "~~/app/shared/types/shop";

export type StatusMeta = {
  class: string;
  dotClass: string;
  icon: string;
  label: string;
};

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  NEW: {
    class: "bg-sky-50 text-sky-700  ",
    dotClass: "bg-sky-500",
    icon: "i-lucide-sparkles",
    label: "Новый"
  },
  CONFIRMED: {
    class: "bg-emerald-50 text-emerald-700  ",
    dotClass: "bg-emerald-500",
    icon: "i-lucide-check-check",
    label: "Подтвержден"
  },
  PROCESSING: {
    class: "bg-amber-50 text-amber-700  ",
    dotClass: "bg-amber-500",
    icon: "i-lucide-loader-circle",
    label: "В работе"
  },
  SHIPPED: {
    class: "bg-indigo-50 text-indigo-700  ",
    dotClass: "bg-indigo-500",
    icon: "i-lucide-truck",
    label: "Отправлен"
  },
  COMPLETED: {
    class: "bg-emerald-50 text-emerald-700  ",
    dotClass: "bg-emerald-500",
    icon: "i-lucide-circle-check",
    label: "Завершен"
  },
  CANCELLED: {
    class: "bg-red-50 text-red-700  ",
    dotClass: "bg-red-500",
    icon: "i-lucide-circle-x",
    label: "Отменен"
  }
};

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  PENDING: {
    class: "bg-amber-50 text-amber-700  ",
    dotClass: "bg-amber-500",
    icon: "i-lucide-clock-3",
    label: "Ожидает оплаты"
  },
  UPON_RECEIPT: {
    class: "bg-zinc-100 text-zinc-600  ",
    dotClass: "bg-zinc-400",
    icon: "i-lucide-wallet",
    label: "При получении"
  },
  PAID: {
    class: "bg-emerald-50 text-emerald-700  ",
    dotClass: "bg-emerald-500",
    icon: "i-lucide-badge-check",
    label: "Оплачен"
  },
  CANCELLED: {
    class: "bg-red-50 text-red-700  ",
    dotClass: "bg-red-500",
    icon: "i-lucide-circle-x",
    label: "Оплата отменена"
  }
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  ONLINE: "Онлайн",
  OFFLINE: "При получении"
};

export const obtainingMethodLabels: Record<ObtainingMethod, string> = {
  DELIVERY: "Доставка",
  PICKUP: "Самовывоз"
};

export function getStatusMeta(type: "order", value: OrderStatus): StatusMeta;
export function getStatusMeta(type: "payment", value: PaymentStatus): StatusMeta;
export function getStatusMeta(type: "order" | "payment", value: OrderStatus | PaymentStatus) {
  return type === "order"
    ? orderStatusMeta[value as OrderStatus]
    : paymentStatusMeta[value as PaymentStatus];
}
