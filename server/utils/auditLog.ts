import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type RecordAdminAuditInput = {
  adminId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | number | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAdminAudit(input: RecordAdminAuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId === undefined || input.entityId === null ? null : String(input.entityId),
        summary: input.summary,
        metadata: input.metadata
      }
    });
  } catch (error) {
    console.error("Failed to write admin audit log", error);
  }
}
