import { AuditAction } from "@prisma/client";
import { categorySchema } from "~~/shared/schemas/admin/products/category";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const body = await validateBody(event, categorySchema);

  try {
    const category = await prisma.category.create({
      data: { name: body.name }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.CREATE,
      entityType: "category",
      entityId: category.id,
      summary: `Created category ${category.name}`
    });

    return { success: true, category };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2002: "Категория с таким названием уже существует"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании категории"
    });
  }
});
