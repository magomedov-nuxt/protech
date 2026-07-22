import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";
import { prisma } from "./prisma";
import { restoreProductStock } from "./orderStock";
import {
  broadcastOrderStatusChangeMessage,
  createOrderStatusChangeMessage
} from "./orderStatusNotification";
import { getPositiveIntegerEnv } from "./env";

export type ExpireUnpaidOrdersOptions = {
  expiresBefore?: Date;
  now?: Date;
  batchSize?: number;
};

export type ExpireUnpaidOrdersResult = {
  checked: number;
  expired: number;
  orderIds: number[];
};

export function getOrderPaymentExpiryMinutes() {
  return getPositiveIntegerEnv("ORDER_PAYMENT_EXPIRY_MINUTES", 10);
}

export function getOrderPaymentExpiresAt(createdAt: Date) {
  return new Date(createdAt.getTime() + getOrderPaymentExpiryMinutes() * 60_000);
}

export function getOrderPaymentRemainingSeconds(createdAt: Date, now = new Date()) {
  return Math.max(0, Math.ceil((getOrderPaymentExpiresAt(createdAt).getTime() - now.getTime()) / 1000));
}

function getDefaultExpiresBefore(now: Date) {
  const ttlMinutes = getOrderPaymentExpiryMinutes();

  return new Date(now.getTime() - ttlMinutes * 60_000);
}

export async function expireUnpaidOrders(
  options: ExpireUnpaidOrdersOptions = {}
): Promise<ExpireUnpaidOrdersResult> {
  const now = options.now ?? new Date();
  const expiresBefore = options.expiresBefore ?? getDefaultExpiresBefore(now);
  const batchSize = options.batchSize ?? getPositiveIntegerEnv("ORDER_EXPIRY_BATCH_SIZE", 100);

  const candidates = await prisma.order.findMany({
    where: {
      paymentMethod: PaymentMethod.ONLINE,
      orderStatus: { not: OrderStatus.CANCELLED },
      stockReserved: true,
      createdAt: { lte: expiresBefore },
      payment: {
        is: {
          paymentStatus: PaymentStatus.PENDING
        }
      }
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: "asc"
    },
    take: batchSize
  });

  const expiredOrderIds: number[] = [];

  for (const candidate of candidates) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: candidate.id },
        include: {
          orderItems: {
            select: {
              productId: true,
              quantity: true
            }
          },
          payment: {
            select: {
              paymentStatus: true
            }
          }
        }
      });

      if (
        !order ||
        order.paymentMethod !== PaymentMethod.ONLINE ||
        order.orderStatus === OrderStatus.CANCELLED ||
        !order.stockReserved ||
        order.createdAt > expiresBefore ||
        order.payment?.paymentStatus !== PaymentStatus.PENDING
      ) {
        return { expired: false, statusMessage: null };
      }

      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentMethod: PaymentMethod.ONLINE,
          orderStatus: { not: OrderStatus.CANCELLED },
          stockReserved: true,
          createdAt: { lte: expiresBefore },
          payment: {
            is: {
              paymentStatus: PaymentStatus.PENDING
            }
          }
        },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });

      if (claimed.count !== 1) {
        return { expired: false, statusMessage: null };
      }

      await restoreProductStock(tx, order.orderItems, {
        orderId: order.id,
        reason: "Unpaid order expired"
      });

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      const statusMessage = await createOrderStatusChangeMessage(tx, {
        orderId: order.id,
        userId: order.userId,
        previousStatus: order.orderStatus,
        nextStatus: OrderStatus.CANCELLED
      });

      return { expired: true, statusMessage };
    });

    if (result.expired) {
      expiredOrderIds.push(candidate.id);
      broadcastOrderStatusChangeMessage(result.statusMessage);
    }
  }

  return {
    checked: candidates.length,
    expired: expiredOrderIds.length,
    orderIds: expiredOrderIds
  };
}
