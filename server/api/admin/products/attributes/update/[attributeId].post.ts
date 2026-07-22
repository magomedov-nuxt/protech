import { AuditAction } from "@prisma/client";
import { updateAttributeSchema } from "~~/shared/schemas/admin/products/updateAttribute";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const attributeId = getPositiveIntRouterParam(
    event,
    "attributeId",
    "Некорректный ID характеристики"
  );
  const body = await validateBody(event, updateAttributeSchema);

  try {
    const attribute = await prisma.attribute.update({
      where: { id: attributeId },
      data: body
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.UPDATE,
      entityType: "attribute",
      entityId: attribute.id,
      summary: `Updated attribute ${attribute.name}`,
      metadata: {
        fields: Object.keys(body),
        unit: attribute.unit
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Характеристика не найдена",
      P2002: "Характеристика с таким названием уже существует"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении характеристики"
    });
  }
});
