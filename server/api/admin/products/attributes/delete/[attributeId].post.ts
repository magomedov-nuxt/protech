import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const attributeId = getPositiveIntRouterParam(
    event,
    "attributeId",
    "Некорректный ID характеристики"
  );

  try {
    const attribute = await prisma.attribute.findUnique({
      where: { id: attributeId },
      select: { id: true, name: true, unit: true }
    });

    await prisma.attribute.delete({
      where: { id: attributeId }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.DELETE,
      entityType: "attribute",
      entityId: attributeId,
      summary: `Deleted attribute ${attribute?.name ?? attributeId}`,
      metadata: { unit: attribute?.unit }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Характеристика не найдена"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении характеристики"
    });
  }
});
