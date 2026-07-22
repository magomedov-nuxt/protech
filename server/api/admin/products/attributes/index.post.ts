import { AuditAction } from "@prisma/client";
import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const body = await validateBody(event, createAttributeSchema);

  try {
    const attribute = await prisma.attribute.create({
      data: body
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.CREATE,
      entityType: "attribute",
      entityId: attribute.id,
      summary: `Created attribute ${attribute.name}`,
      metadata: { unit: attribute.unit }
    });

    return { success: true, attribute };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2002: "Характеристика с таким названием уже существует"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании характеристики"
    });
  }
});
