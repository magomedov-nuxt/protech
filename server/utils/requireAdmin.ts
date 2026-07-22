import { Role } from "@prisma/client";
import { createError, type H3Event } from "h3";
import { prisma } from "./prisma";
import { requireUser } from "./request";

export async function requireAdmin(event: H3Event) {
  const { session } = await requireUser(event);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true }
  });

  if (!user || user.role !== Role.ADMIN) {
    throw createError({
      statusCode: 403,
      message: "Доступ запрещён"
    });
  }

  return { session, userId: user.id };
}
