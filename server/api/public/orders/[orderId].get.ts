import { PaymentStatus } from "@prisma/client";
import { attachOrderPaymentMeta } from "~~/server/utils/orderPaymentMeta";
import { attachOrderStatusHistory, getOrderStatusHistoryAuditLogs } from "~~/server/utils/orderStatusHistory";
import { publicOrderSelect, toPublicOrderDto } from "~~/server/utils/publicOrderDto";
import { syncYooKassaPaymentStatus } from "~~/server/utils/yookassaPaymentStatus";

async function getUserOrder(orderId: number, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    select: publicOrderSelect
  });
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const orderId = getPositiveIntRouterParam(event, "orderId", "Некорректный ID заказа");

  let order = await getUserOrder(orderId, userId);

  if (!order) {
    throw createError({
      statusCode: 404,
      message: "Заказ не найден"
    });
  }

  if (
    order.paymentMethod === "ONLINE" &&
    order.payment?.paymentStatus === PaymentStatus.PENDING &&
    order.payment.transactionId
  ) {
    try {
      const syncResult = await syncYooKassaPaymentStatus(event, order.payment.transactionId);

      if (syncResult.processed || syncResult.alreadyProcessed) {
        const syncedOrder = await getUserOrder(orderId, userId);

        if (syncedOrder) {
          order = syncedOrder;
        }
      }
    } catch (error) {
      console.error("Failed to sync YooKassa payment status", error);
    }
  }

  const statusAuditLogs = await getOrderStatusHistoryAuditLogs([order]);

  return toPublicOrderDto(attachOrderPaymentMeta(attachOrderStatusHistory([order], statusAuditLogs)[0]!));
});
