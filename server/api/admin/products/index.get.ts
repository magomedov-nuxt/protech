import type { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const search = String(query.search ?? "").trim();
  const categoryId = getOptionalPositiveIntQueryParam(query.categoryId);
  const isActive = query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
  const limit = 20;

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { article: { contains: search, mode: "insensitive" } }
        ]
      }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(isActive !== undefined ? { isActive } : {})
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        article: true,
        currentPrice: true,
        oldPrice: true,
        mainImage: true,
        isActive: true,
        productStocks: { select: { quantity: true } },
      }
    }),
    prisma.product.count({ where })
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
