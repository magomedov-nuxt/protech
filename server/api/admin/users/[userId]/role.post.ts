import { AuditAction, Role } from "@prisma/client";
import { updateUserRoleSchema } from "~~/shared/schemas/admin/users/updateUserRole";

export default defineEventHandler(async (event) => {
  const { userId: adminId } = await requireAdmin(event);
  const userId = getRouterParam(event, "userId");

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID пользователя"
    });
  }

  const body = await validateBody(event, updateUserRoleSchema);
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true
    }
  });

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: "Пользователь не найден"
    });
  }

  if (targetUser.id === adminId && body.role !== Role.ADMIN) {
    throw createError({
      statusCode: 400,
      message: "Нельзя снять роль ADMIN с текущего пользователя"
    });
  }

  if (targetUser.role === Role.ADMIN && body.role === Role.USER) {
    const adminsCount = await prisma.user.count({
      where: { role: Role.ADMIN }
    });

    if (adminsCount <= 1) {
      throw createError({
        statusCode: 400,
        message: "Нельзя снять роль у последнего администратора"
      });
    }
  }

  const user = targetUser.role === body.role
    ? targetUser
    : await prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true
      }
    });

  await recordAdminAudit({
    adminId,
    action: AuditAction.UPDATE,
    entityType: "user",
    entityId: user.id,
    summary: `Updated user role ${user.email}`,
    metadata: {
      previousRole: targetUser.role,
      nextRole: user.role
    }
  });

  return { success: true };
});
