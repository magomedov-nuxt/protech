import { StockMovementType, type Prisma } from "@prisma/client";
import { createError } from "h3";

type StockItem = {
  productId: number;
  quantity: number;
};

type OrderStockTransaction = Prisma.TransactionClient;

type StockMovementOptions = {
  orderId?: number;
  reason?: string;
};

function normalizeStockItems(items: StockItem[]) {
  const quantityByProductId = new Map<number, number>();

  for (const item of items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw createError({
        statusCode: 400,
        message: "Invalid product id"
      });
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw createError({
        statusCode: 400,
        message: "Invalid product quantity"
      });
    }

    quantityByProductId.set(
      item.productId,
      (quantityByProductId.get(item.productId) ?? 0) + item.quantity
    );
  }

  return [...quantityByProductId.entries()].map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

export async function reserveProductStock(
  tx: OrderStockTransaction,
  items: StockItem[],
  options: StockMovementOptions = {}
) {
  for (const item of normalizeStockItems(items)) {
    const result = await tx.productStock.updateMany({
      where: {
        productId: item.productId,
        quantity: { gte: item.quantity }
      },
      data: {
        quantity: { decrement: item.quantity }
      }
    });

    if (result.count !== 1) {
      throw createError({
        statusCode: 409,
        message: `Not enough stock for product ${item.productId}`
      });
    }

    const stock = await tx.productStock.findUniqueOrThrow({
      where: { productId: item.productId },
      select: { quantity: true }
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        orderId: options.orderId,
        type: StockMovementType.RESERVE,
        quantityDelta: -item.quantity,
        quantityAfter: stock.quantity,
        reason: options.reason ?? "Order stock reserve"
      }
    });
  }
}

export async function restoreProductStock(
  tx: OrderStockTransaction,
  items: StockItem[],
  options: StockMovementOptions = {}
) {
  for (const item of normalizeStockItems(items)) {
    const stock = await tx.productStock.upsert({
      where: { productId: item.productId },
      create: {
        productId: item.productId,
        quantity: item.quantity
      },
      update: {
        quantity: { increment: item.quantity }
      },
      select: {
        quantity: true
      }
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        orderId: options.orderId,
        type: StockMovementType.RELEASE,
        quantityDelta: item.quantity,
        quantityAfter: stock.quantity,
        reason: options.reason ?? "Order stock release"
      }
    });
  }
}

export async function getOrderStockItems(
  tx: OrderStockTransaction,
  orderId: number
) {
  return await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true }
  });
}

export async function reserveOrderStock(
  tx: OrderStockTransaction,
  orderId: number,
  reason = "Order stock reserve"
) {
  const orderItems = await getOrderStockItems(tx, orderId);
  await reserveProductStock(tx, orderItems, { orderId, reason });
}

export async function restoreOrderStock(
  tx: OrderStockTransaction,
  orderId: number,
  reason = "Order stock release"
) {
  const orderItems = await getOrderStockItems(tx, orderId);
  await restoreProductStock(tx, orderItems, { orderId, reason });
}

export async function recordStockAdjustment(
  tx: OrderStockTransaction,
  input: {
    productId: number;
    quantityDelta: number;
    quantityAfter: number;
    reason?: string;
  }
) {
  if (input.quantityDelta === 0) {
    return;
  }

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: StockMovementType.ADJUSTMENT,
      quantityDelta: input.quantityDelta,
      quantityAfter: input.quantityAfter,
      reason: input.reason ?? "Manual stock adjustment"
    }
  });
}
