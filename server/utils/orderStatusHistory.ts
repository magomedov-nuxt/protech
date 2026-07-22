import { AuditAction, OrderStatus, PaymentStatus, type AuditLog, type Order, type Payment, type Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type OrderStatusHistoryOrder = Pick<Order, "id" | "orderStatus" | "createdAt" | "updatedAt"> & {
  payment: Pick<Payment, "id" | "paymentStatus" | "paidAt"> | null;
};

type StatusAuditLog = Pick<AuditLog, "id" | "action" | "entityType" | "entityId" | "metadata" | "createdAt">;

export type OrderStatusHistoryItem = {
  id: string;
  type: "order" | "payment";
  status: OrderStatus | PaymentStatus;
  changedAt: Date;
};

export async function getOrderStatusHistoryAuditLogs(orders: OrderStatusHistoryOrder[]) {
  const orderIds = orders.map((order) => String(order.id));
  const paymentIds = orders
    .map((order) => order.payment?.id)
    .filter((id): id is number => typeof id === "number")
    .map(String);

  if (!orderIds.length && !paymentIds.length) {
    return [];
  }

  return await prisma.auditLog.findMany({
    where: {
      OR: [
        ...(orderIds.length
          ? [{
              action: AuditAction.ORDER_STATUS,
              entityType: "order",
              entityId: { in: orderIds }
            }]
          : []),
        ...(paymentIds.length
          ? [{
              action: AuditAction.PAYMENT_STATUS,
              entityType: "payment",
              entityId: { in: paymentIds }
            }]
          : [])
      ]
    },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export function attachOrderStatusHistory<T extends OrderStatusHistoryOrder>(
  orders: T[],
  auditLogs: StatusAuditLog[]
) {
  const paymentIdToOrderId = new Map<string, number>();

  for (const order of orders) {
    if (order.payment?.id) {
      paymentIdToOrderId.set(String(order.payment.id), order.id);
    }
  }

  const logsByOrderId = new Map<number, StatusAuditLog[]>();

  for (const log of auditLogs) {
    const orderId = log.entityType === "order"
      ? Number(log.entityId)
      : paymentIdToOrderId.get(String(log.entityId));

    if (!orderId || Number.isNaN(orderId)) {
      continue;
    }

    logsByOrderId.set(orderId, [
      ...(logsByOrderId.get(orderId) ?? []),
      log
    ]);
  }

  return orders.map((order) => ({
    ...order,
    statusHistory: buildOrderStatusHistory(order, logsByOrderId.get(order.id) ?? [])
  }));
}

function buildOrderStatusHistory(order: OrderStatusHistoryOrder, auditLogs: StatusAuditLog[]) {
  const history: OrderStatusHistoryItem[] = [];

  addHistoryItem(history, {
    id: `order-created-${order.id}`,
    type: "order",
    status: OrderStatus.NEW,
    changedAt: order.createdAt
  });

  for (const log of auditLogs) {
    if (log.action === AuditAction.ORDER_STATUS) {
      const orderStatus = getMetadataEnumValue(log.metadata, "orderStatus", OrderStatus);

      if (orderStatus) {
        addHistoryItem(history, {
          id: `audit-order-${log.id}`,
          type: "order",
          status: orderStatus,
          changedAt: log.createdAt
        });
      }
    }

    if (log.action === AuditAction.PAYMENT_STATUS) {
      const paymentStatus = getMetadataEnumValue(log.metadata, "paymentStatus", PaymentStatus);

      if (paymentStatus) {
        addHistoryItem(history, {
          id: `audit-payment-${log.id}`,
          type: "payment",
          status: paymentStatus,
          changedAt: log.createdAt
        });
      }
    }
  }

  if (!hasStatus(history, "order", order.orderStatus)) {
    addHistoryItem(history, {
      id: `order-current-${order.id}`,
      type: "order",
      status: order.orderStatus,
      changedAt: order.orderStatus === OrderStatus.NEW ? order.createdAt : order.updatedAt
    });
  }

  if (order.payment && !hasStatus(history, "payment", order.payment.paymentStatus)) {
    addHistoryItem(history, {
      id: `payment-current-${order.payment.id}`,
      type: "payment",
      status: order.payment.paymentStatus,
      changedAt: order.payment.paidAt ?? order.updatedAt ?? order.createdAt
    });
  }

  return history.sort((left, right) => {
    const diff = left.changedAt.getTime() - right.changedAt.getTime();

    if (diff !== 0) {
      return diff;
    }

    return left.type === "order" ? -1 : 1;
  });
}

function addHistoryItem(history: OrderStatusHistoryItem[], item: OrderStatusHistoryItem) {
  const isDuplicate = history.some((historyItem) => (
    historyItem.type === item.type &&
    historyItem.status === item.status &&
    historyItem.changedAt.getTime() === item.changedAt.getTime()
  ));

  if (!isDuplicate) {
    history.push(item);
  }
}

function hasStatus(
  history: OrderStatusHistoryItem[],
  type: OrderStatusHistoryItem["type"],
  status: OrderStatus | PaymentStatus
) {
  return history.some((item) => item.type === type && item.status === status);
}

function getMetadataEnumValue<T extends Record<string, string>>(
  metadata: Prisma.JsonValue | null,
  key: string,
  enumValues: T
) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];

  if (typeof value !== "string") {
    return null;
  }

  return Object.values(enumValues).includes(value)
    ? value as T[keyof T]
    : null;
}
