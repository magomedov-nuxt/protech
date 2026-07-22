import { AuditAction } from "@prisma/client";
import { bulkProductsSchema } from "~~/shared/schemas/admin/products/bulkProducts";

const productBulkSummary: Record<string, string> = {
  activate: "Bulk activated products",
  deactivate: "Bulk deactivated products",
  delete: "Bulk deleted products",
  changeCategory: "Bulk changed product category"
};

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, bulkProductsSchema);

  if (body.action === "changeCategory") {
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId },
      select: { id: true }
    });

    if (!category) {
      throw createError({
        statusCode: 400,
        message: "Категория не найдена"
      });
    }
  }

  try {
    const result = body.action === "delete"
      ? await prisma.product.deleteMany({
        where: { id: { in: body.productIds } }
      })
      : await prisma.product.updateMany({
        where: { id: { in: body.productIds } },
        data: body.action === "changeCategory"
          ? { categoryId: body.categoryId }
          : { isActive: body.action === "activate" }
      });

    await recordAdminAudit({
      adminId: userId,
      action: body.action === "delete" ? AuditAction.BULK_DELETE : AuditAction.BULK_UPDATE,
      entityType: "product",
      summary: productBulkSummary[body.action] ?? "Bulk product operation",
      metadata: {
        productIds: body.productIds,
        action: body.action,
        affected: result.count,
        ...(body.action === "changeCategory" ? { categoryId: body.categoryId } : {})
      }
    });

    return { success: true, count: result.count };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2003: "Нельзя удалить товары, связанные с заказами"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при массовой операции с товарами"
    });
  }
});
