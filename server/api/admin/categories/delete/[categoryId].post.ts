import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const categoryId = getPositiveIntRouterParam(event, "categoryId", "Некорректный ID категории");

  const productsCount = await prisma.product.count({
    where: { categoryId }
  });

  if (productsCount > 0) {
    throw createError({
      statusCode: 409,
      message: "Невозможно удалить категорию, к которой привязаны товары"
    });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true }
    });

    await prisma.category.delete({
      where: { id: categoryId }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.DELETE,
      entityType: "category",
      entityId: categoryId,
      summary: `Deleted category ${category?.name ?? categoryId}`
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Категория не найдена"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении категории"
    });
  }
});
