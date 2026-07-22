import { AuditAction } from "@prisma/client";
import { recordStockAdjustment } from "~~/server/utils/orderStock";
import { updateProductStockSchema } from "~~/shared/schemas/admin/products/updateProductStock";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await validateBody(event, updateProductStockSchema);

  let previousQuantity = 0;

  const stock = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        productStocks: {
          select: {
            quantity: true
          }
        }
      }
    });

    if (!product) {
      throw createError({
        statusCode: 404,
        message: "Товар не найден"
      });
    }

    previousQuantity = product.productStocks[0]?.quantity ?? 0;

    const updatedStock = await tx.productStock.upsert({
      where: { productId },
      create: {
        productId,
        quantity: body.quantity
      },
      update: {
        quantity: body.quantity
      }
    });

    await recordStockAdjustment(tx, {
      productId,
      quantityDelta: body.quantity - previousQuantity,
      quantityAfter: updatedStock.quantity,
      reason: "Manual stock update"
    });

    return updatedStock;
  });

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.STOCK_ADJUSTMENT,
    entityType: "product_stock",
    entityId: productId,
    summary: "Updated product stock",
    metadata: {
      productId,
      previousQuantity,
      quantity: stock.quantity,
      quantityDelta: stock.quantity - previousQuantity
    }
  });

  return { success: true };
});
