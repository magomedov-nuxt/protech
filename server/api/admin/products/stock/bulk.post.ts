import { AuditAction } from "@prisma/client";
import { recordStockAdjustment } from "~~/server/utils/orderStock";
import { bulkStockArrivalSchema } from "~~/shared/schemas/admin/products/bulkStockArrival";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, bulkStockArrivalSchema);
  const productIds = body.arrivals.map((arrival) => arrival.productId);

  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true }
  });
  const existingIds = new Set(existingProducts.map((product) => product.id));
  const missingIds = productIds.filter((productId) => !existingIds.has(productId));

  if (missingIds.length) {
    throw createError({
      statusCode: 400,
      message: `Товары не найдены: ${missingIds.join(", ")}`
    });
  }

  const reason = body.reason || "Bulk stock arrival";
  const stocks = await prisma.$transaction(async (tx) => {
    const updated = [];

    for (const arrival of body.arrivals) {
      const stock = await tx.productStock.upsert({
        where: { productId: arrival.productId },
        create: {
          productId: arrival.productId,
          quantity: arrival.quantityDelta
        },
        update: {
          quantity: { increment: arrival.quantityDelta }
        }
      });

      await recordStockAdjustment(tx, {
        productId: arrival.productId,
        quantityDelta: arrival.quantityDelta,
        quantityAfter: stock.quantity,
        reason
      });

      updated.push(stock);
    }

    return updated;
  });
  const quantityDeltaTotal = body.arrivals.reduce((total, arrival) => total + arrival.quantityDelta, 0);

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.STOCK_ADJUSTMENT,
    entityType: "product_stock",
    summary: "Bulk stock arrival",
    metadata: {
      arrivals: body.arrivals,
      quantityDeltaTotal,
      reason,
      affected: stocks.length
    }
  });

  return { success: true, count: stocks.length, quantityDeltaTotal };
});
