import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.LOGIN,
    entityType: "auth",
    entityId: userId,
    summary: "Admin signed in"
  });

  return { success: true };
});
