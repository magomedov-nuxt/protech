import { Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const roles = new Set<string>(Object.values(Role));

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const search = String(query.search ?? "").trim();
  const role = query.role ? String(query.role) : undefined;
  const limit = 20;

  if (role && !roles.has(role)) {
    throw createError({
      statusCode: 400,
      message: "Некорректная роль пользователя"
    });
  }

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } }
        ]
      }
      : {}),
    ...(role ? { role: role as Role } : {})
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            message: true,
            reviews: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
});
