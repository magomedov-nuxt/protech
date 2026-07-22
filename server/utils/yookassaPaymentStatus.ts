import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  type Message
} from "@prisma/client";
import { createError, type H3Event } from "h3";
import { reserveOrderStock, restoreOrderStock } from "./orderStock";
import {
  broadcastOrderStatusChangeMessage,
  createOrderStatusChangeMessage
} from "./orderStatusNotification";
import { prisma } from "./prisma";
import { getYooKassaPayment, type YooKassaPayment } from "./yookassa";

type YooKassaPaymentStatusResult = {
  ok: true;
  status?: YooKassaPayment["status"];
  ignored?: true;
  reason?: string;
  alreadyProcessed?: true;
  processed?: true;
};

function ignored(reason: string): YooKassaPaymentStatusResult {
  return {
    ok: true,
    ignored: true,
    reason
  };
}

function getMetadataOrderId(payment: YooKassaPayment) {
  const orderId = Number(payment.metadata?.orderId);

  return Number.isInteger(orderId) ? orderId : null;
}

export async function applyYooKassaPaymentStatus(
  payment: YooKassaPayment
): Promise<YooKassaPaymentStatusResult> {
  const orderIdFromMetadata = getMetadataOrderId(payment);
  const paymentLookup: Prisma.PaymentWhereInput[] = [
    { transactionId: payment.id }
  ];

  if (orderIdFromMetadata !== null) {
    paymentLookup.push({ orderId: orderIdFromMetadata });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      OR: paymentLookup
    },
    include: {
      order: {
        select: {
          orderStatus: true,
          paymentMethod: true,
          stockReserved: true
        }
      }
    }
  });

  if (!existingPayment) {
    return ignored("Payment not found");
  }

  if (existingPayment.order.paymentMethod !== "ONLINE") {
    return ignored("Order is not an online payment order");
  }

  if (existingPayment.transactionId && existingPayment.transactionId !== payment.id) {
    return ignored("Payment transaction mismatch");
  }

  if (orderIdFromMetadata !== null && orderIdFromMetadata !== existingPayment.orderId) {
    return ignored("Payment order metadata mismatch");
  }

  if (payment.amount.currency !== "RUB") {
    return ignored("Payment currency mismatch");
  }

  const actualAmount = new Prisma.Decimal(payment.amount.value);
  const expectedAmount = new Prisma.Decimal(existingPayment.amount);

  if (!expectedAmount.equals(actualAmount)) {
    return ignored("Payment amount mismatch");
  }

  if (payment.status === "succeeded" && payment.paid) {
    if (existingPayment.paymentStatus === PaymentStatus.PAID) {
      return { ok: true, alreadyProcessed: true };
    }

    let processed = false;
    let statusMessage: Message | null = null;

    await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: {
          id: existingPayment.id,
          paymentStatus: PaymentStatus.PENDING,
          order: {
            is: {
              orderStatus: { not: OrderStatus.CANCELLED }
            }
          }
        },
        data: {
          transactionId: payment.id,
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
          amount: actualAmount
        }
      });

      if (updatedPayment.count !== 1) {
        return;
      }

      const order = await tx.order.findUnique({
        where: { id: existingPayment.orderId },
        select: {
          orderStatus: true,
          userId: true,
          stockReserved: true
        }
      });

      if (!order || order.orderStatus === OrderStatus.CANCELLED) {
        throw createError({
          statusCode: 409,
          message: "Order is not available for payment confirmation"
        });
      }

      if (!order.stockReserved) {
        await reserveOrderStock(tx, existingPayment.orderId);
      }

      await tx.order.update({
        where: { id: existingPayment.orderId },
        data: {
          orderStatus: OrderStatus.CONFIRMED,
          stockReserved: true
        }
      });

      statusMessage = await createOrderStatusChangeMessage(tx, {
        orderId: existingPayment.orderId,
        userId: order.userId,
        previousStatus: order.orderStatus,
        nextStatus: OrderStatus.CONFIRMED
      });
      processed = true;
    });

    if (!processed) {
      return ignored("Payment is not pending or order is cancelled");
    }

    broadcastOrderStatusChangeMessage(statusMessage);

    return { ok: true, processed: true };
  }

  if (payment.status === "canceled") {
    if (existingPayment.paymentStatus === PaymentStatus.CANCELLED) {
      return { ok: true, alreadyProcessed: true };
    }

    let processed = false;
    let statusMessage: Message | null = null;

    await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: {
          id: existingPayment.id,
          paymentStatus: PaymentStatus.PENDING
        },
        data: {
          transactionId: payment.id,
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      if (updatedPayment.count !== 1) {
        return;
      }

      const order = await tx.order.findUnique({
        where: { id: existingPayment.orderId },
        select: {
          orderStatus: true,
          userId: true,
          stockReserved: true
        }
      });

      if (order?.orderStatus !== OrderStatus.CANCELLED && order?.stockReserved) {
        await restoreOrderStock(tx, existingPayment.orderId);
      }

      await tx.order.update({
        where: { id: existingPayment.orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });

      statusMessage = order
        ? await createOrderStatusChangeMessage(tx, {
            orderId: existingPayment.orderId,
            userId: order.userId,
            previousStatus: order.orderStatus,
            nextStatus: OrderStatus.CANCELLED
          })
        : null;
      processed = true;
    });

    if (!processed) {
      return ignored("Payment is not pending");
    }

    broadcastOrderStatusChangeMessage(statusMessage);

    return { ok: true, processed: true };
  }

  return {
    ok: true,
    status: payment.status
  };
}

export async function syncYooKassaPaymentStatus(
  event: H3Event,
  paymentId: string
) {
  const payment = await getYooKassaPayment(event, paymentId);

  return applyYooKassaPaymentStatus(payment);
}
