import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  type Order,
  type Payment
} from "@prisma/client";
import {
  getOrderPaymentExpiresAt,
  getOrderPaymentRemainingSeconds
} from "./orderExpiry";

type PaymentMetaOrder = Pick<Order, "createdAt" | "orderStatus" | "paymentMethod"> & {
  payment: Pick<Payment, "paymentStatus"> | null;
};

export function isPendingOnlinePayment(order: PaymentMetaOrder) {
  return (
    order.paymentMethod === PaymentMethod.ONLINE &&
    order.orderStatus !== OrderStatus.CANCELLED &&
    order.payment?.paymentStatus === PaymentStatus.PENDING
  );
}

export function attachOrderPaymentMeta<T extends PaymentMetaOrder>(order: T, now = new Date()) {
  if (!isPendingOnlinePayment(order)) {
    return {
      ...order,
      paymentExpiresAt: null,
      paymentRemainingSeconds: null
    };
  }

  return {
    ...order,
    paymentExpiresAt: getOrderPaymentExpiresAt(order.createdAt),
    paymentRemainingSeconds: getOrderPaymentRemainingSeconds(order.createdAt, now)
  };
}

export function attachOrdersPaymentMeta<T extends PaymentMetaOrder>(orders: T[], now = new Date()) {
  return orders.map((order) => attachOrderPaymentMeta(order, now));
}
