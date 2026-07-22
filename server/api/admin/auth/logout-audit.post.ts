import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.LOGOUT,
    entityType: "auth",
    entityId: userId,
    summary: "Admin signed out"
  });

  return { success: true };
});
