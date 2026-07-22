import type { Prisma } from "@prisma/client";

export const publicOrderSelect = {
  id: true,
  obtainingMethod: true,
  orderStatus: true,
  paymentMethod: true,
  customerPhone: true,
  recipientName: true,
  recipientPhone: true,
  createdAt: true,
  updatedAt: true,
  orderItems: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      price: true,
      lineTotal: true,
      productName: true,
      productArticle: true,
      productMainImage: true,
      product: {
        select: {
          mainImage: true
        }
      }
    }
  },
  delivery: {
    select: {
      address: true,
      apartment: true,
      entrance: true,
      floor: true,
      intercom: true,
      comment: true,
      deliveryMethod: true
    }
  },
  payment: {
    select: {
      id: true,
      amount: true,
      paymentStatus: true,
      paidAt: true,
      transactionId: true
    }
  }
} satisfies Prisma.OrderSelect;

export type PublicOrderRecord = Prisma.OrderGetPayload<{
  select: typeof publicOrderSelect;
}>;

type PublicOrderWithMeta = PublicOrderRecord & {
  paymentExpiresAt?: Date | null;
  paymentRemainingSeconds?: number | null;
  statusHistory?: Array<{
    id: string;
    type: "order" | "payment";
    status: string;
    changedAt: Date;
  }>;
};

export function toPublicOrderDto(order: PublicOrderWithMeta) {
  return {
    id: order.id,
    obtainingMethod: order.obtainingMethod,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    customerPhone: order.customerPhone,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paymentExpiresAt: order.paymentExpiresAt ?? null,
    paymentRemainingSeconds: order.paymentRemainingSeconds ?? null,
    statusHistory: order.statusHistory,
    delivery: order.delivery,
    payment: order.payment
      ? {
          amount: order.payment.amount,
          paymentStatus: order.payment.paymentStatus,
          paidAt: order.payment.paidAt
        }
      : null,
    orderItems: order.orderItems
  };
}
