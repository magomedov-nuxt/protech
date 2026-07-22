import { PaymentStatus } from "@prisma/client";
import type { H3Event } from "h3";
import { attachOrdersPaymentMeta } from "~~/server/utils/orderPaymentMeta";
import { attachOrderStatusHistory, getOrderStatusHistoryAuditLogs } from "~~/server/utils/orderStatusHistory";
import { publicOrderSelect, toPublicOrderDto, type PublicOrderRecord } from "~~/server/utils/publicOrderDto";
import { syncYooKassaPaymentStatus } from "~~/server/utils/yookassaPaymentStatus";

async function syncPendingYooKassaOrders(event: H3Event, orders: PublicOrderRecord[]) {
  const pendingPaymentIds = orders
    .filter((order) => (
      order.paymentMethod === "ONLINE" &&
      order.payment?.paymentStatus === PaymentStatus.PENDING &&
      order.payment.transactionId
    ))
    .map((order) => order.payment!.transactionId!);

  if (!pendingPaymentIds.length) {
    return false;
  }

  const syncResults = await Promise.allSettled(
    pendingPaymentIds.map((paymentId) => syncYooKassaPaymentStatus(event, paymentId))
  );

  for (const result of syncResults) {
    if (result.status === "rejected") {
      console.error("Failed to sync YooKassa payment status", result.reason);
    }
  }

  return syncResults.some((result) => (
    result.status === "fulfilled" &&
    (result.value.processed || result.value.alreadyProcessed)
  ));
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);

  let orders = await prisma.order.findMany({
    where: {
      userId
    },
    select: publicOrderSelect,
    orderBy: {
      createdAt: "desc"
    }
  });

  if (await syncPendingYooKassaOrders(event, orders)) {
    orders = await prisma.order.findMany({
      where: {
        userId
      },
      select: publicOrderSelect,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  const statusAuditLogs = await getOrderStatusHistoryAuditLogs(orders);

  return attachOrdersPaymentMeta(attachOrderStatusHistory(orders, statusAuditLogs)).map(toPublicOrderDto);
});
