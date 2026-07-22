import { AuditAction, OrderStatus, PaymentStatus } from "@prisma/client";
import { reserveProductStock, restoreProductStock } from "~~/server/utils/orderStock";
import {
  broadcastOrderStatusChangeMessage,
  createOrderStatusChangeMessage
} from "~~/server/utils/orderStatusNotification";
import { updatePaymentStatusSchema } from "~~/shared/schemas/admin/orders/updatePaymentStatus";

function getOrderStatusForActivePayment(paymentStatus: PaymentStatus) {
  return paymentStatus === PaymentStatus.PENDING ? OrderStatus.NEW : OrderStatus.CONFIRMED;
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const body = await validateBody(event, updatePaymentStatusSchema);
  const paymentStatus = body.paymentStatus as PaymentStatus;

  const { updatedPayment, statusMessage } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { orderId: body.orderId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            orderStatus: true,
            stockReserved: true,
            orderItems: {
              select: { productId: true, quantity: true }
            }
          }
        }
      }
    });

    if (!payment) {
      throw createError({
        statusCode: 404,
        message: "Платёж для заказа не найден"
      });
    }

    let nextOrderStatus: OrderStatus | null = null;

    if (paymentStatus === PaymentStatus.CANCELLED) {
      if (payment.order.orderStatus !== OrderStatus.CANCELLED) {
        if (payment.order.stockReserved) {
          await restoreProductStock(tx, payment.order.orderItems, {
            orderId: payment.order.id,
            reason: "Admin payment cancelled"
          });
        }

        await tx.order.update({
          where: { id: payment.order.id },
          data: {
            orderStatus: OrderStatus.CANCELLED,
            stockReserved: false
          }
        });

        nextOrderStatus = OrderStatus.CANCELLED;
      }
    } else if (payment.order.orderStatus === OrderStatus.CANCELLED) {
      if (!payment.order.stockReserved) {
        await reserveProductStock(tx, payment.order.orderItems, {
          orderId: payment.order.id,
          reason: "Admin payment reactivated"
        });
      }

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          orderStatus: getOrderStatusForActivePayment(paymentStatus),
          stockReserved: true
        }
      });

      nextOrderStatus = getOrderStatusForActivePayment(paymentStatus);
    } else if (!payment.order.stockReserved) {
      await reserveProductStock(tx, payment.order.orderItems, {
        orderId: payment.order.id,
        reason: "Admin payment status update"
      });

      nextOrderStatus =
        paymentStatus === PaymentStatus.PAID && payment.order.orderStatus === OrderStatus.NEW
          ? OrderStatus.CONFIRMED
          : null;

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          stockReserved: true,
          ...(paymentStatus === PaymentStatus.PAID &&
          payment.order.orderStatus === OrderStatus.NEW
            ? { orderStatus: OrderStatus.CONFIRMED }
            : {})
        }
      });
    } else if (
      paymentStatus === PaymentStatus.PAID &&
      payment.order.orderStatus === OrderStatus.NEW
    ) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          orderStatus: OrderStatus.CONFIRMED,
          stockReserved: true
        }
      });

      nextOrderStatus = OrderStatus.CONFIRMED;
    }

    const updatedPayment = await tx.payment.update({
      where: { orderId: body.orderId },
      data: {
        paymentStatus,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null
      },
      select: {
        id: true,
        orderId: true,
        paymentStatus: true
      }
    });

    const statusMessage = nextOrderStatus
      ? await createOrderStatusChangeMessage(tx, {
          orderId: payment.order.id,
          userId: payment.order.userId,
          previousStatus: payment.order.orderStatus,
          nextStatus: nextOrderStatus
        })
      : null;

    return { updatedPayment, statusMessage };
  }).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Платёж или заказ не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.PAYMENT_STATUS,
    entityType: "payment",
    entityId: updatedPayment.id,
    summary: `Updated payment for order ${updatedPayment.orderId}`,
    metadata: {
      orderId: updatedPayment.orderId,
      paymentStatus: updatedPayment.paymentStatus
    }
  });

  broadcastOrderStatusChangeMessage(statusMessage);

  return { success: true };
});
